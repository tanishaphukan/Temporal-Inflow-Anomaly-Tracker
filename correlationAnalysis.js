// Correlation Analysis

function performCorrelationAnalysis() {
    return {
        policyCorrelation: analyzePolicyCorrelation(),
        riskMatrix: generateRiskMatrix()
    };
}

function analyzePolicyCorrelation() {
    const correlations = [];
    
    sampleData.policyTimeline.forEach(policy => {
        const policyDate = new Date(policy.date);
        const daysBefore = 60;
        const daysAfter = 30;
        
        // Calculate enrollment changes around policy date
        let enrollmentBefore = 0;
        let enrollmentAfter = 0;
        let countBefore = 0;
        let countAfter = 0;
        
        sampleData.rawData.forEach(row => {
            const rowDate = parseDate(row.Date);
            const daysDiff = (rowDate - policyDate) / (1000 * 60 * 60 * 24);
            const enrollment = (row['Age 0 5'] || 0) + (row['Age 5 17'] || 0) + (row['Age 18 Greater'] || 0);
            
            if (daysDiff >= -daysBefore && daysDiff < 0) {
                enrollmentBefore += enrollment;
                countBefore++;
            } else if (daysDiff >= 0 && daysDiff <= daysAfter) {
                enrollmentAfter += enrollment;
                countAfter++;
            }
        });
        
        const avgBefore = countBefore > 0 ? enrollmentBefore / countBefore : 0;
        const avgAfter = countAfter > 0 ? enrollmentAfter / countAfter : 0;
        const change = avgBefore > 0 ? ((avgAfter - avgBefore) / avgBefore * 100).toFixed(1) : 0;
        
        correlations.push({
            policy: policy.title,
            date: policy.date,
            avgBefore: Math.round(avgBefore),
            avgAfter: Math.round(avgAfter),
            change: change,
            correlation: Math.abs(change) > 50 ? 'Strong' : Math.abs(change) > 20 ? 'Moderate' : 'Weak'
        });
    });
    
    return correlations;
}

function generateRiskMatrix() {
    const factors = [
        { name: 'Growth Rate', weight: 0.3 },
        { name: 'Enrollment Volume', weight: 0.25 },
        { name: 'Border Proximity', weight: 0.2 },
        { name: 'Policy Deadline', weight: 0.15 },
        { name: 'Age Distribution', weight: 0.1 }
    ];
    
    const matrix = sampleData.pins.map(pin => {
        const scores = {
            growthRate: Math.min(100, (pin.growth / 300) * 100),
            enrollmentVolume: Math.min(100, (pin.enrollment / 5000) * 100),
            borderProximity: Math.min(100, (pin.borderPushbacks / 100) * 100),
            policyDeadline: calculateDeadlineScore(pin),
            ageDistribution: calculateAgeScore(pin)
        };
        
        const totalScore = 
            scores.growthRate * 0.3 +
            scores.enrollmentVolume * 0.25 +
            scores.borderProximity * 0.2 +
            scores.policyDeadline * 0.15 +
            scores.ageDistribution * 0.1;
        
        return {
            pin: pin.pin,
            district: pin.district,
            scores: scores,
            totalScore: totalScore.toFixed(1),
            riskLevel: totalScore > 70 ? 'High' : totalScore > 40 ? 'Medium' : 'Low'
        };
    });
    
    return matrix.sort((a, b) => b.totalScore - a.totalScore);
}

function calculateDeadlineScore(pin) {
    const days = calculateDaysToDeadline(pin);
    if (days === 'N/A') return 0;
    if (days < 30) return 100;
    if (days < 60) return 70;
    if (days < 90) return 40;
    return 20;
}

function calculateAgeScore(pin) {
    // Higher score for suspicious age patterns
    const pinData = sampleData.rawData.filter(r => r.Pincode === pin.pin);
    if (pinData.length === 0) return 0;
    
    let totalAdults = 0;
    let totalAll = 0;
    
    pinData.forEach(row => {
        const adults = row['Age 18 Greater'] || 0;
        const all = (row['Age 0 5'] || 0) + (row['Age 5 17'] || 0) + adults;
        totalAdults += adults;
        totalAll += all;
    });
    
    const adultPct = totalAll > 0 ? (totalAdults / totalAll) * 100 : 0;
    
    if (adultPct > 80) return 100;
    if (adultPct > 70) return 70;
    if (adultPct > 60) return 40;
    return 20;
}

function renderCorrelationAnalysis() {
    const analysis = performCorrelationAnalysis();
    
    renderPolicyCorrelation(analysis.policyCorrelation);
    renderRiskMatrix(analysis.riskMatrix);
}

function renderPolicyCorrelation(correlations) {
    const container = document.getElementById('policyCorrelation');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Policy Event</th>
                    <th>Date</th>
                    <th>Avg Before (60d)</th>
                    <th>Avg After (30d)</th>
                    <th>Change</th>
                    <th>Correlation</th>
                </tr>
            </thead>
            <tbody>
                ${correlations.map(c => `
                    <tr>
                        <td><strong>${c.policy}</strong></td>
                        <td>${new Date(c.date).toLocaleDateString()}</td>
                        <td>${c.avgBefore.toLocaleString()}</td>
                        <td>${c.avgAfter.toLocaleString()}</td>
                        <td style="color: ${c.change > 0 ? '#d84315' : '#2e7d32'}; font-weight: 600;">${c.change > 0 ? '+' : ''}${c.change}%</td>
                        <td><span class="risk-badge ${c.correlation === 'Strong' ? 'high' : c.correlation === 'Moderate' ? 'medium' : 'low'}">${c.correlation}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderRiskMatrix(matrix) {
    const container = document.getElementById('riskMatrix');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>PIN</th>
                    <th>District</th>
                    <th>Growth</th>
                    <th>Volume</th>
                    <th>Border</th>
                    <th>Deadline</th>
                    <th>Age</th>
                    <th>Total Score</th>
                    <th>Risk Level</th>
                </tr>
            </thead>
            <tbody>
                ${matrix.slice(0, 15).map(m => `
                    <tr>
                        <td><strong>${m.pin}</strong></td>
                        <td>${m.district}</td>
                        <td>${m.scores.growthRate.toFixed(0)}</td>
                        <td>${m.scores.enrollmentVolume.toFixed(0)}</td>
                        <td>${m.scores.borderProximity.toFixed(0)}</td>
                        <td>${m.scores.policyDeadline.toFixed(0)}</td>
                        <td>${m.scores.ageDistribution.toFixed(0)}</td>
                        <td><strong>${m.totalScore}</strong></td>
                        <td><span class="risk-badge ${m.riskLevel.toLowerCase()}">${m.riskLevel}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
            Scores are normalized to 0-100 scale. Total score is weighted average: Growth (30%), Volume (25%), Border (20%), Deadline (15%), Age (10%)
        </p>
    `;
}
