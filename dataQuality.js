// Data Quality Assessment

function assessDataQuality() {
    return {
        completeness: calculateCompleteness(),
        outliers: detectOutliers(),
        consistency: checkConsistency()
    };
}

function calculateCompleteness() {
    const totalRecords = sampleData.rawData.length;
    let completeRecords = 0;
    let missingFields = 0;
    
    const pinCompleteness = new Map();
    
    sampleData.rawData.forEach(row => {
        let isComplete = true;
        
        if (!row.Date || !row.State || !row.District || !row.Pincode) {
            isComplete = false;
            missingFields++;
        }
        
        if (isComplete) completeRecords++;
        
        // Track by PIN
        const pin = row.Pincode;
        if (!pinCompleteness.has(pin)) {
            pinCompleteness.set(pin, { complete: 0, total: 0 });
        }
        const pinData = pinCompleteness.get(pin);
        pinData.total++;
        if (isComplete) pinData.complete++;
    });
    
    const overallScore = ((completeRecords / totalRecords) * 100).toFixed(1);
    
    return {
        score: overallScore,
        totalRecords,
        completeRecords,
        missingFields,
        pinCompleteness: Array.from(pinCompleteness.entries()).map(([pin, data]) => ({
            pin,
            score: ((data.complete / data.total) * 100).toFixed(1),
            complete: data.complete,
            total: data.total
        }))
    };
}

function detectOutliers() {
    const outliers = [];
    
    // Detect enrollment outliers
    const enrollments = sampleData.pins.map(p => p.enrollment);
    const mean = enrollments.reduce((a, b) => a + b, 0) / enrollments.length;
    const stdDev = Math.sqrt(enrollments.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / enrollments.length);
    
    sampleData.pins.forEach(pin => {
        const zScore = Math.abs((pin.enrollment - mean) / stdDev);
        if (zScore > 3) {
            outliers.push({
                pin: pin.pin,
                district: pin.district,
                type: 'Enrollment',
                value: pin.enrollment,
                expected: mean.toFixed(0),
                deviation: `${zScore.toFixed(2)} std dev`,
                severity: zScore > 4 ? 'High' : 'Medium'
            });
        }
    });
    
    // Detect growth rate outliers
    const growthRates = sampleData.pins.map(p => p.growth);
    const growthMean = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const growthStdDev = Math.sqrt(growthRates.reduce((sq, n) => sq + Math.pow(n - growthMean, 2), 0) / growthRates.length);
    
    sampleData.pins.forEach(pin => {
        const zScore = Math.abs((pin.growth - growthMean) / growthStdDev);
        if (zScore > 3) {
            outliers.push({
                pin: pin.pin,
                district: pin.district,
                type: 'Growth Rate',
                value: `${pin.growth}%`,
                expected: `${growthMean.toFixed(1)}%`,
                deviation: `${zScore.toFixed(2)} std dev`,
                severity: zScore > 4 ? 'High' : 'Medium'
            });
        }
    });
    
    return outliers;
}

function checkConsistency() {
    const issues = [];
    
    // Check for duplicate records
    const seen = new Set();
    sampleData.rawData.forEach((row, index) => {
        const key = `${row.Date}-${row.Pincode}`;
        if (seen.has(key)) {
            issues.push({
                type: 'Duplicate',
                description: `Duplicate record found for PIN ${row.Pincode} on ${row.Date}`,
                severity: 'Low'
            });
        }
        seen.add(key);
    });
    
    // Check for date inconsistencies
    const dates = sampleData.rawData.map(r => parseDate(r.Date)).filter(d => !isNaN(d));
    if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 365) {
            issues.push({
                type: 'Date Range',
                description: `Data spans ${Math.floor(daysDiff)} days - verify if this is expected`,
                severity: 'Low'
            });
        }
    }
    
    return issues;
}

function renderDataQuality() {
    const quality = assessDataQuality();
    
    renderQualityCards(quality);
    renderCompletenessChart(quality.completeness);
    renderOutliersTable(quality.outliers);
}

function renderQualityCards(quality) {
    const container = document.querySelector('#data-quality-view .quality-cards');
    const score = parseFloat(quality.completeness.score);
    const scoreClass = score > 95 ? '' : score > 85 ? 'medium' : 'low';
    
    container.innerHTML = `
        <div class="card">
            <div class="card-label">Overall Quality Score</div>
            <div class="quality-score ${scoreClass}">${quality.completeness.score}%</div>
        </div>
        <div class="card">
            <div class="card-label">Complete Records</div>
            <div class="card-value">${quality.completeness.completeRecords.toLocaleString()}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                of ${quality.completeness.totalRecords.toLocaleString()}
            </div>
        </div>
        <div class="card">
            <div class="card-label">Outliers Detected</div>
            <div class="card-value ${quality.outliers.length > 0 ? 'alert' : ''}">${quality.outliers.length}</div>
        </div>
        <div class="card">
            <div class="card-label">Consistency Issues</div>
            <div class="card-value">${quality.consistency.length}</div>
        </div>
    `;
}

function renderCompletenessChart(completeness) {
    const container = document.getElementById('completenessChart');
    const data = completeness.pinCompleteness.sort((a, b) => parseFloat(a.score) - parseFloat(b.score)).slice(0, 15);
    
    const chartHeight = 400;
    const barHeight = 20;
    const chartWidth = container.offsetWidth - 200;
    
    let svg = `<svg width="${chartWidth + 200}" height="${data.length * 30 + 40}">`;
    
    data.forEach((item, i) => {
        const y = i * 30 + 20;
        const barWidth = (parseFloat(item.score) / 100) * chartWidth;
        const color = item.score > 95 ? '#4caf50' : item.score > 85 ? '#ff9800' : '#f44336';
        
        svg += `<text x="10" y="${y + 15}" font-size="12" fill="#333">PIN ${item.pin}</text>`;
        svg += `<rect x="100" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" opacity="0.8"/>`;
        svg += `<text x="${100 + barWidth + 10}" y="${y + 15}" font-size="12" fill="#666">${item.score}%</text>`;
    });
    
    svg += '</svg>';
    container.innerHTML = svg;
}

function renderOutliersTable(outliers) {
    const container = document.getElementById('outliersTable');
    
    if (outliers.length === 0) {
        container.innerHTML = '<p style="color: #2e7d32; padding: 2rem; text-align: center;">✓ No significant outliers detected</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>PIN</th>
                    <th>District</th>
                    <th>Type</th>
                    <th>Actual Value</th>
                    <th>Expected Value</th>
                    <th>Deviation</th>
                    <th>Severity</th>
                </tr>
            </thead>
            <tbody>
                ${outliers.map(o => `
                    <tr>
                        <td><strong>${o.pin}</strong></td>
                        <td>${o.district}</td>
                        <td>${o.type}</td>
                        <td>${typeof o.value === 'number' ? o.value.toLocaleString() : o.value}</td>
                        <td>${o.expected}</td>
                        <td>${o.deviation}</td>
                        <td><span class="risk-badge ${o.severity.toLowerCase()}">${o.severity}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
