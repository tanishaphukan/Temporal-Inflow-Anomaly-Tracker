// Process raw Aadhaar enrollment data
function processRawData(rawData) {
    // Group by pincode and calculate metrics
    const pinMap = new Map();
    const dateMap = new Map();
    
    rawData.forEach(row => {
        const pincode = row.Pincode;
        const date = row.Date;
        const totalEnrollment = (row['Age 0 5'] || 0) + (row['Age 5 17'] || 0) + (row['Age 18 Greater'] || 0);
        
        // Aggregate by pincode
        if (!pinMap.has(pincode)) {
            pinMap.set(pincode, {
                pin: pincode,
                district: row.District,
                state: row.State,
                totalEnrollment: 0,
                monthlyData: [],
                dates: new Set()
            });
        }
        
        const pinData = pinMap.get(pincode);
        pinData.totalEnrollment += totalEnrollment;
        pinData.dates.add(date);
        pinData.monthlyData.push({
            date: date,
            enrollment: totalEnrollment,
            age0_5: row['Age 0 5'] || 0,
            age5_17: row['Age 5 17'] || 0,
            age18plus: row['Age 18 Greater'] || 0
        });
        
        // Aggregate by date for time series
        if (!dateMap.has(date)) {
            dateMap.set(date, 0);
        }
        dateMap.set(date, dateMap.get(date) + totalEnrollment);
    });
    
    // Calculate risk levels and growth rates
    const pinsArray = Array.from(pinMap.values());
    
    pinsArray.forEach(pin => {
        // Sort monthly data by date
        pin.monthlyData.sort((a, b) => parseDate(a.date) - parseDate(b.date));
        
        // Calculate growth rate
        if (pin.monthlyData.length >= 2) {
            const recent = pin.monthlyData.slice(-3).reduce((sum, d) => sum + d.enrollment, 0);
            const older = pin.monthlyData.slice(0, Math.min(3, pin.monthlyData.length - 3)).reduce((sum, d) => sum + d.enrollment, 0);
            pin.growth = older > 0 ? Math.round(((recent - older) / older) * 100) : 0;
        } else {
            pin.growth = 0;
        }
        
        // Determine risk level based on growth and total enrollment
        if (pin.growth > 150 || pin.totalEnrollment > 3000) {
            pin.risk = 'high';
        } else if (pin.growth > 80 || pin.totalEnrollment > 1500) {
            pin.risk = 'medium';
        } else {
            pin.risk = 'low';
        }
        
        // Simulate border pushbacks (in real scenario, this would come from actual data)
        pin.borderPushbacks = Math.floor(pin.totalEnrollment * 0.02 * (pin.risk === 'high' ? 1.5 : pin.risk === 'medium' ? 1 : 0.5));
        
        pin.enrollment = pin.totalEnrollment;
    });
    
    sampleData.pins = pinsArray;
    
    // Generate time series data
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => parseDate(a) - parseDate(b));
    sampleData.timeSeriesData = sortedDates.map(date => ({
        month: formatDateToMonth(date),
        total: dateMap.get(date),
        policyMarker: false
    }));
    
    // Mark policy dates if they exist in the data
    sampleData.timeSeriesData.forEach(item => {
        if (item.month.includes('Oct 2024')) {
            item.policyMarker = true;
            item.policyName = 'NRC Draft Review';
        }
    });
    
    // Generate policy timeline
    generatePolicyTimeline();
    
    // Generate detailed pin data
    generatePinDetailsFromRaw();
}

function parseDate(dateStr) {
    // Parse DD-MM-YYYY format
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

function formatDateToMonth(dateStr) {
    const date = parseDate(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function generatePolicyTimeline() {
    sampleData.policyTimeline = [
        { date: '2024-10-15', title: 'NRC Draft Review Period', description: 'Final review period announced for NRC draft submissions' },
        { date: '2024-12-31', title: 'Citizenship Amendment Deadline', description: 'Extended deadline for citizenship documentation under CAA' },
        { date: '2025-03-31', title: 'Border Security Enhancement', description: 'Implementation of enhanced border verification protocols' }
    ];
}

function generatePinDetailsFromRaw() {
    sampleData.pinDetails = {};
    
    sampleData.pins.forEach(pin => {
        // Group monthly data by month
        const monthlyMap = new Map();
        
        pin.monthlyData.forEach(data => {
            const monthKey = formatDateToMonth(data.date);
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: monthKey,
                    enrollments: 0
                });
            }
            monthlyMap.get(monthKey).enrollments += data.enrollment;
        });
        
        const monthlyArray = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        
        // Format month labels
        monthlyArray.forEach(item => {
            const date = new Date(item.month + '-01');
            item.month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        
        sampleData.pinDetails[pin.pin] = {
            monthlyData: monthlyArray,
            explanation: pin.risk === 'high' 
                ? `Elevated enrollment activity detected. Growth rate of ${pin.growth}% exceeds threshold for high-risk classification. Total enrollments: ${pin.totalEnrollment.toLocaleString()}.`
                : pin.risk === 'medium'
                ? `Moderate increase in enrollment observed. Growth rate of ${pin.growth}% warrants continued monitoring. Total enrollments: ${pin.totalEnrollment.toLocaleString()}.`
                : `Normal enrollment patterns within historical baseline. Growth rate of ${pin.growth}% consistent with demographic trends. Total enrollments: ${pin.totalEnrollment.toLocaleString()}.`
        };
    });
}
