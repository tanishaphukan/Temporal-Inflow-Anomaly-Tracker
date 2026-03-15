// Anomaly Detection Engine

function detectAnomalies(method = 'zscore', sensitivity = 'medium') {
    const anomalies = [];
    
    switch(method) {
        case 'zscore':
            return detectZScoreAnomalies(sensitivity);
        case 'iqr':
            return detectIQRAnomalies(sensitivity);
        case 'growth':
            return detectGrowthAnomalies(sensitivity);
        default:
            return detectZScoreAnomalies(sensitivity);
    }
}

function detectZScoreAnomalies(sensitivity) {
    const threshold = sensitivity === 'high' ? 2 : sensitivity === 'medium' ? 2.5 : 3;
    const enrollments = sampleData.pins.map(p => p.enrollment);
    const mean = enrollments.reduce((a, b) => a + b, 0) / enrollments.length;
    const stdDev = Math.sqrt(enrollments.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / enrollments.length);
    
    const anomalies = [];
    sampleData.pins.forEach(pin => {
        const zScore = Math.abs((pin.enrollment - mean) / stdDev);
        if (zScore > threshold) {
            anomalies.push({
                pin: pin.pin,
                district: pin.district,
                enrollment: pin.enrollment,
                score: zScore.toFixed(2),
                confidence: zScore > 3 ? 'High' : zScore > 2.5 ? 'Medium' : 'Low',
                reason: `Z-Score of ${zScore.toFixed(2)} exceeds threshold of ${threshold}`,
                daysToDeadline: calculateDaysToDeadline(pin)
            });
        }
    });
    
    return anomalies.sort((a, b) => b.score - a.score);
}

function detectIQRAnomalies(sensitivity) {
    const enrollments = sampleData.pins.map(p => p.enrollment).sort((a, b) => a - b);
    const q1 = enrollments[Math.floor(enrollments.length * 0.25)];
    const q3 = enrollments[Math.floor(enrollments.length * 0.75)];
    const iqr = q3 - q1;
    const multiplier = sensitivity === 'high' ? 1.5 : sensitivity === 'medium' ? 2 : 2.5;
    const lowerBound = q1 - (multiplier * iqr);
    const upperBound = q3 + (multiplier * iqr);
    
    const anomalies = [];
    sampleData.pins.forEach(pin => {
        if (pin.enrollment > upperBound || pin.enrollment < lowerBound) {
            const deviation = pin.enrollment > upperBound ? 
                ((pin.enrollment - upperBound) / upperBound * 100).toFixed(1) :
                ((lowerBound - pin.enrollment) / lowerBound * 100).toFixed(1);
            
            anomalies.push({
                pin: pin.pin,
                district: pin.district,
                enrollment: pin.enrollment,
                score: deviation,
                confidence: deviation > 100 ? 'High' : deviation > 50 ? 'Medium' : 'Low',
                reason: `${deviation}% deviation from IQR bounds (${lowerBound.toFixed(0)} - ${upperBound.toFixed(0)})`,
                daysToDeadline: calculateDaysToDeadline(pin)
            });
        }
    });
    
    return anomalies.sort((a, b) => b.score - a.score);
}

function detectGrowthAnomalies(sensitivity) {
    const threshold = sensitivity === 'high' ? 100 : sensitivity === 'medium' ? 150 : 200;
    
    const anomalies = [];
    sampleData.pins.forEach(pin => {
        if (pin.growth > threshold) {
            anomalies.push({
                pin: pin.pin,
                district: pin.district,
                enrollment: pin.enrollment,
                score: pin.growth,
                confidence: pin.growth > 250 ? 'High' : pin.growth > 150 ? 'Medium' : 'Low',
                reason: `Growth rate of ${pin.growth}% exceeds threshold of ${threshold}%`,
                daysToDeadline: calculateDaysToDeadline(pin)
            });
        }
    });
    
    return anomalies.sort((a, b) => b.score - a.score);
}

function calculateDaysToDeadline(pin) {
    // Calculate days to nearest policy deadline
    const today = new Date();
    const deadlines = sampleData.policyTimeline.map(p => new Date(p.date));
    const futureDates = deadlines.filter(d => d > today);
    
    if (futureDates.length === 0) return 'N/A';
    
    const nearest = futureDates.reduce((a, b) => a < b ? a : b);
    const days = Math.floor((nearest - today) / (1000 * 60 * 60 * 24));
    return days;
}

function renderAnomalyResults(anomalies) {
    const container = document.getElementById('anomalyResults');
    
    if (anomalies.length === 0) {
        container.innerHTML = '<p style="color: #2e7d32; padding: 2rem; text-align: center;">✓ No anomalies detected with current settings</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>${anomalies.length}</strong> anomalies detected
        </div>
        ${anomalies.map(a => `
            <div class="anomaly-item">
                <h4>PIN ${a.pin} - ${a.district}</h4>
                <p><strong>Enrollment:</strong> ${a.enrollment.toLocaleString()} | 
                   <strong>Confidence:</strong> <span class="anomaly-score">${a.confidence}</span> |
                   <strong>Days to Deadline:</strong> ${a.daysToDeadline}</p>
                <p style="color: #666; font-size: 0.9rem;">${a.reason}</p>
            </div>
        `).join('')}
    `;
}
