// Age Group Analysis Engine

function analyzeAgeGroups() {
    const ageData = {
        distribution: calculateAgeDistribution(),
        suspicious: findSuspiciousAgePatterns(),
        growthRates: calculateAgeGrowthRates()
    };
    
    return ageData;
}

function calculateAgeDistribution() {
    let total0_5 = 0;
    let total5_17 = 0;
    let total18plus = 0;
    
    sampleData.rawData.forEach(row => {
        total0_5 += row['Age 0 5'] || 0;
        total5_17 += row['Age 5 17'] || 0;
        total18plus += row['Age 18 Greater'] || 0;
    });
    
    const total = total0_5 + total5_17 + total18plus;
    
    return {
        age0_5: { count: total0_5, percentage: ((total0_5 / total) * 100).toFixed(1) },
        age5_17: { count: total5_17, percentage: ((total5_17 / total) * 100).toFixed(1) },
        age18plus: { count: total18plus, percentage: ((total18plus / total) * 100).toFixed(1) }
    };
}

function findSuspiciousAgePatterns() {
    const suspicious = [];
    const pinAgeData = new Map();
    
    // Aggregate by PIN
    sampleData.rawData.forEach(row => {
        const pin = row.Pincode;
        if (!pinAgeData.has(pin)) {
            pinAgeData.set(pin, { age0_5: 0, age5_17: 0, age18plus: 0, district: row.District });
        }
        const data = pinAgeData.get(pin);
        data.age0_5 += row['Age 0 5'] || 0;
        data.age5_17 += row['Age 5 17'] || 0;
        data.age18plus += row['Age 18 Greater'] || 0;
    });
    
    // Analyze patterns
    pinAgeData.forEach((data, pin) => {
        const total = data.age0_5 + data.age5_17 + data.age18plus;
        if (total === 0) return;
        
        const adult_pct = (data.age18plus / total) * 100;
        const child_pct = (data.age0_5 / total) * 100;
        
        // Flag if adult percentage is unusually high (>70%)
        if (adult_pct > 70) {
            suspicious.push({
                pin: pin,
                district: data.district,
                pattern: 'High Adult Ratio',
                percentage: adult_pct.toFixed(1),
                reason: `${adult_pct.toFixed(1)}% adult enrollments (expected ~50-60%)`,
                severity: adult_pct > 85 ? 'High' : 'Medium'
            });
        }
        
        // Flag if child percentage is unusually high (>40%)
        if (child_pct > 40) {
            suspicious.push({
                pin: pin,
                district: data.district,
                pattern: 'High Child Ratio',
                percentage: child_pct.toFixed(1),
                reason: `${child_pct.toFixed(1)}% child (0-5) enrollments (expected ~15-25%)`,
                severity: child_pct > 50 ? 'High' : 'Medium'
            });
        }
    });
    
    return suspicious;
}

function calculateAgeGrowthRates() {
    // Group by date and calculate growth
    const dateGroups = new Map();
    
    sampleData.rawData.forEach(row => {
        const date = row.Date;
        if (!dateGroups.has(date)) {
            dateGroups.set(date, { age0_5: 0, age5_17: 0, age18plus: 0 });
        }
        const data = dateGroups.get(date);
        data.age0_5 += row['Age 0 5'] || 0;
        data.age5_17 += row['Age 5 17'] || 0;
        data.age18plus += row['Age 18 Greater'] || 0;
    });
    
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => parseDate(a) - parseDate(b));
    
    if (sortedDates.length < 2) {
        return { age0_5: 0, age5_17: 0, age18plus: 0 };
    }
    
    const recent = dateGroups.get(sortedDates[sortedDates.length - 1]);
    const older = dateGroups.get(sortedDates[0]);
    
    return {
        age0_5: older.age0_5 > 0 ? (((recent.age0_5 - older.age0_5) / older.age0_5) * 100).toFixed(1) : 0,
        age5_17: older.age5_17 > 0 ? (((recent.age5_17 - older.age5_17) / older.age5_17) * 100).toFixed(1) : 0,
        age18plus: older.age18plus > 0 ? (((recent.age18plus - older.age18plus) / older.age18plus) * 100).toFixed(1) : 0
    };
}

function renderAgeAnalysis() {
    const ageData = analyzeAgeGroups();
    
    // Render age distribution
    renderAgeDistribution(ageData.distribution);
    
    // Render suspicious patterns
    renderSuspiciousPatterns(ageData.suspicious);
    
    // Render growth rates
    renderAgeGrowthRates(ageData.growthRates);
}

function renderAgeDistribution(distribution) {
    const container = document.getElementById('ageDistribution');
    const total = parseInt(distribution.age0_5.count) + parseInt(distribution.age5_17.count) + parseInt(distribution.age18plus.count);
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="card">
                <div class="card-label">Age 0-5</div>
                <div class="card-value">${distribution.age0_5.count.toLocaleString()}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">${distribution.age0_5.percentage}% of total</div>
            </div>
            <div class="card">
                <div class="card-label">Age 5-17</div>
                <div class="card-value">${distribution.age5_17.count.toLocaleString()}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">${distribution.age5_17.percentage}% of total</div>
            </div>
            <div class="card">
                <div class="card-label">Age 18+</div>
                <div class="card-value">${distribution.age18plus.count.toLocaleString()}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">${distribution.age18plus.percentage}% of total</div>
            </div>
        </div>
        <div style="background: #fff; padding: 2rem; border-radius: 6px; border: 1px solid #e0e0e0;">
            <svg width="100%" height="300" viewBox="0 0 400 300">
                <rect x="50" y="${300 - (distribution.age0_5.percentage * 2)}" width="80" height="${distribution.age0_5.percentage * 2}" fill="#4caf50"/>
                <text x="90" y="${300 - (distribution.age0_5.percentage * 2) - 10}" text-anchor="middle" font-size="14" font-weight="600">${distribution.age0_5.percentage}%</text>
                <text x="90" y="290" text-anchor="middle" font-size="12" fill="#666">Age 0-5</text>
                
                <rect x="160" y="${300 - (distribution.age5_17.percentage * 2)}" width="80" height="${distribution.age5_17.percentage * 2}" fill="#2196f3"/>
                <text x="200" y="${300 - (distribution.age5_17.percentage * 2) - 10}" text-anchor="middle" font-size="14" font-weight="600">${distribution.age5_17.percentage}%</text>
                <text x="200" y="290" text-anchor="middle" font-size="12" fill="#666">Age 5-17</text>
                
                <rect x="270" y="${300 - (distribution.age18plus.percentage * 2)}" width="80" height="${distribution.age18plus.percentage * 2}" fill="#ff9800"/>
                <text x="310" y="${300 - (distribution.age18plus.percentage * 2) - 10}" text-anchor="middle" font-size="14" font-weight="600">${distribution.age18plus.percentage}%</text>
                <text x="310" y="290" text-anchor="middle" font-size="12" fill="#666">Age 18+</text>
            </svg>
        </div>
    `;
}

function renderSuspiciousPatterns(suspicious) {
    const container = document.getElementById('suspiciousAgePatterns');
    
    if (suspicious.length === 0) {
        container.innerHTML = '<p style="color: #2e7d32; padding: 2rem; text-align: center;">✓ No suspicious age patterns detected</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>PIN Code</th>
                    <th>District</th>
                    <th>Pattern</th>
                    <th>Percentage</th>
                    <th>Severity</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
                ${suspicious.map(s => `
                    <tr>
                        <td><strong>${s.pin}</strong></td>
                        <td>${s.district}</td>
                        <td>${s.pattern}</td>
                        <td>${s.percentage}%</td>
                        <td><span class="risk-badge ${s.severity.toLowerCase()}">${s.severity}</span></td>
                        <td style="font-size: 0.9rem; color: #666;">${s.reason}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderAgeGrowthRates(growthRates) {
    const container = document.getElementById('ageGrowthRates');
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            <div class="card">
                <div class="card-label">Age 0-5 Growth</div>
                <div class="card-value" style="color: ${growthRates.age0_5 > 100 ? '#d84315' : '#2c5282'}">${growthRates.age0_5}%</div>
            </div>
            <div class="card">
                <div class="card-label">Age 5-17 Growth</div>
                <div class="card-value" style="color: ${growthRates.age5_17 > 100 ? '#d84315' : '#2c5282'}">${growthRates.age5_17}%</div>
            </div>
            <div class="card">
                <div class="card-label">Age 18+ Growth</div>
                <div class="card-value" style="color: ${growthRates.age18plus > 100 ? '#d84315' : '#2c5282'}">${growthRates.age18plus}%</div>
            </div>
        </div>
    `;
}
