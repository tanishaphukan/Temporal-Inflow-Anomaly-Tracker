// Alert System

let alertRules = {
    growthThreshold: 150,
    enrollmentThreshold: 3000,
    daysToDeadline: 60
};

let alertHistory = [];

function setupAlertSystem() {
    document.getElementById('saveAlerts').addEventListener('click', saveAlertRules);
    generateAlerts();
}

function saveAlertRules() {
    alertRules.growthThreshold = parseInt(document.getElementById('alertGrowth').value);
    alertRules.enrollmentThreshold = parseInt(document.getElementById('alertEnrollment').value);
    alertRules.daysToDeadline = parseInt(document.getElementById('alertDays').value);
    
    generateAlerts();
    alert('Alert rules saved successfully!');
}

function generateAlerts() {
    const alerts = [];
    const timestamp = new Date().toISOString();
    
    sampleData.pins.forEach(pin => {
        const daysToDeadline = calculateDaysToDeadline(pin);
        
        // Growth threshold alert
        if (pin.growth > alertRules.growthThreshold) {
            alerts.push({
                id: `${pin.pin}-growth-${Date.now()}`,
                pin: pin.pin,
                district: pin.district,
                type: 'Growth Rate',
                severity: pin.growth > alertRules.growthThreshold * 1.5 ? 'Critical' : 'High',
                message: `Growth rate of ${pin.growth}% exceeds threshold of ${alertRules.growthThreshold}%`,
                timestamp: timestamp,
                value: pin.growth
            });
        }
        
        // Enrollment threshold alert
        if (pin.enrollment > alertRules.enrollmentThreshold) {
            alerts.push({
                id: `${pin.pin}-enrollment-${Date.now()}`,
                pin: pin.pin,
                district: pin.district,
                type: 'High Enrollment',
                severity: pin.enrollment > alertRules.enrollmentThreshold * 1.5 ? 'Critical' : 'High',
                message: `Enrollment of ${pin.enrollment.toLocaleString()} exceeds threshold of ${alertRules.enrollmentThreshold.toLocaleString()}`,
                timestamp: timestamp,
                value: pin.enrollment
            });
        }
        
        // Policy deadline proximity alert
        if (daysToDeadline !== 'N/A' && daysToDeadline < alertRules.daysToDeadline && pin.growth > 100) {
            alerts.push({
                id: `${pin.pin}-deadline-${Date.now()}`,
                pin: pin.pin,
                district: pin.district,
                type: 'Policy Deadline',
                severity: daysToDeadline < 30 ? 'Critical' : 'High',
                message: `High growth (${pin.growth}%) detected ${daysToDeadline} days before policy deadline`,
                timestamp: timestamp,
                value: daysToDeadline
            });
        }
    });
    
    // Add to history
    if (alerts.length > 0) {
        alertHistory = [...alerts, ...alertHistory].slice(0, 50); // Keep last 50 alerts
    }
    
    renderActiveAlerts(alerts);
    renderAlertHistory();
}

function renderActiveAlerts(alerts) {
    const container = document.getElementById('activeAlerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p style="color: #2e7d32; padding: 2rem; text-align: center;">✓ No active alerts</p>';
        return;
    }
    
    // Group by severity
    const critical = alerts.filter(a => a.severity === 'Critical');
    const high = alerts.filter(a => a.severity === 'High');
    
    container.innerHTML = `
        ${critical.length > 0 ? `
            <h4 style="color: #d84315; margin-bottom: 1rem;">Critical Alerts (${critical.length})</h4>
            ${critical.map(a => `
                <div class="alert-item critical">
                    <h5>PIN ${a.pin} - ${a.district}</h5>
                    <p><strong>${a.type}</strong></p>
                    <p style="color: #666; font-size: 0.9rem;">${a.message}</p>
                </div>
            `).join('')}
        ` : ''}
        
        ${high.length > 0 ? `
            <h4 style="color: #f57f17; margin-bottom: 1rem; margin-top: 1.5rem;">High Priority Alerts (${high.length})</h4>
            ${high.map(a => `
                <div class="alert-item">
                    <h5>PIN ${a.pin} - ${a.district}</h5>
                    <p><strong>${a.type}</strong></p>
                    <p style="color: #666; font-size: 0.9rem;">${a.message}</p>
                </div>
            `).join('')}
        ` : ''}
    `;
}

function renderAlertHistory() {
    const container = document.getElementById('alertHistory');
    
    if (alertHistory.length === 0) {
        container.innerHTML = '<p style="color: #666; padding: 2rem; text-align: center;">No alert history available</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>PIN</th>
                    <th>District</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Message</th>
                </tr>
            </thead>
            <tbody>
                ${alertHistory.slice(0, 20).map(a => `
                    <tr>
                        <td style="font-size: 0.85rem;">${new Date(a.timestamp).toLocaleString()}</td>
                        <td><strong>${a.pin}</strong></td>
                        <td>${a.district}</td>
                        <td>${a.type}</td>
                        <td><span class="risk-badge ${a.severity.toLowerCase()}">${a.severity}</span></td>
                        <td style="font-size: 0.9rem;">${a.message}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
