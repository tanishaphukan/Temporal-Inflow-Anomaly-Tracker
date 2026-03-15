// Report Generation

function setupReportGenerator() {
    document.getElementById('generatePDF').addEventListener('click', generateExecutiveReport);
    document.getElementById('generateCustom').addEventListener('click', generateCustomReport);
}

function generateExecutiveReport() {
    const report = {
        title: 'Temporal Inflow Anomaly Tracker - Executive Summary',
        generatedDate: new Date().toLocaleString(),
        summary: generateSummaryStats(),
        riskAnalysis: generateRiskAnalysis(),
        recommendations: generateRecommendations()
    };
    
    // Create HTML report
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${report.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { color: #2c5282; border-bottom: 3px solid #2c5282; padding-bottom: 10px; }
                h2 { color: #2c5282; margin-top: 30px; }
                .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                .stat-card { background: #fff; border: 2px solid #e0e0e0; padding: 15px; border-radius: 6px; }
                .stat-label { font-size: 0.9rem; color: #666; text-transform: uppercase; }
                .stat-value { font-size: 2rem; font-weight: bold; color: #2c5282; margin: 10px 0; }
                .risk-high { color: #d84315; }
                .risk-medium { color: #f57f17; }
                .risk-low { color: #2e7d32; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
                th { background: #f5f5f5; font-weight: 600; }
                .recommendation { background: #e8f0f8; padding: 15px; margin: 10px 0; border-left: 4px solid #2c5282; border-radius: 4px; }
                .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #666; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${report.title}</h1>
                <p><strong>Generated:</strong> ${report.generatedDate}</p>
                <p><strong>Analysis Period:</strong> ${sampleData.rawData.length} records analyzed</p>
            </div>
            
            <h2>Summary Statistics</h2>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-label">Total PINs Monitored</div>
                    <div class="stat-value">${report.summary.totalPins}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">High-Risk PINs</div>
                    <div class="stat-value risk-high">${report.summary.highRiskPins}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Enrollments</div>
                    <div class="stat-value">${report.summary.totalEnrollments.toLocaleString()}</div>
                </div>
            </div>
            
            <h2>Risk Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>PIN Code</th>
                        <th>District</th>
                        <th>Risk Level</th>
                        <th>Enrollment</th>
                        <th>Growth Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.riskAnalysis.map(pin => `
                        <tr>
                            <td><strong>${pin.pin}</strong></td>
                            <td>${pin.district}</td>
                            <td class="risk-${pin.risk}">${pin.risk.toUpperCase()}</td>
                            <td>${pin.enrollment.toLocaleString()}</td>
                            <td>${pin.growth}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.title}</strong>
                    <p>${rec.description}</p>
                </div>
            `).join('')}
            
            <div class="footer">
                <p>This report is generated from aggregated data only. Individual records are not included to maintain privacy compliance.</p>
                <p>For questions or additional analysis, contact the data analytics team.</p>
            </div>
        </body>
        </html>
    `;
    
    // Open in new window for printing/saving
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    alert('Report generated! You can now print or save as PDF from the new window.');
}

function generateSummaryStats() {
    return {
        totalPins: sampleData.pins.length,
        highRiskPins: sampleData.pins.filter(p => p.risk === 'high').length,
        totalEnrollments: sampleData.pins.reduce((sum, p) => sum + p.enrollment, 0)
    };
}

function generateRiskAnalysis() {
    return sampleData.pins
        .filter(p => p.risk === 'high' || p.risk === 'medium')
        .sort((a, b) => b.enrollment - a.enrollment)
        .slice(0, 10);
}

function generateRecommendations() {
    const recommendations = [];
    const highRiskCount = sampleData.pins.filter(p => p.risk === 'high').length;
    const avgGrowth = sampleData.pins.reduce((sum, p) => sum + p.growth, 0) / sampleData.pins.length;
    
    if (highRiskCount > 5) {
        recommendations.push({
            title: 'Immediate Action Required',
            description: `${highRiskCount} PIN codes classified as high-risk. Recommend immediate field verification and enhanced monitoring protocols.`
        });
    }
    
    if (avgGrowth > 150) {
        recommendations.push({
            title: 'Elevated Growth Patterns',
            description: `Average growth rate of ${avgGrowth.toFixed(1)}% exceeds normal thresholds. Consider implementing temporary enrollment verification measures.`
        });
    }
    
    recommendations.push({
        title: 'Border District Focus',
        description: 'Prioritize monitoring of border districts with correlation to pushback incidents. Coordinate with border security agencies for data sharing.'
    });
    
    recommendations.push({
        title: 'Policy Timeline Awareness',
        description: 'Continue monitoring enrollment patterns around policy deadlines. Historical data shows significant spikes 30-60 days before major deadlines.'
    });
    
    return recommendations;
}

function generateCustomReport() {
    const template = document.getElementById('reportTemplate').value;
    
    let reportData = {};
    
    switch(template) {
        case 'High-Risk PINs Summary':
            reportData = {
                title: 'High-Risk PINs Summary Report',
                data: sampleData.pins.filter(p => p.risk === 'high')
            };
            break;
        case 'District-wise Analysis':
            reportData = {
                title: 'District-wise Analysis Report',
                data: generateDistrictReport()
            };
            break;
        case 'Anomaly Detection Report':
            reportData = {
                title: 'Anomaly Detection Report',
                data: detectAnomalies('zscore', 'medium')
            };
            break;
        case 'Predictive Analysis Report':
            reportData = {
                title: 'Predictive Analysis Report',
                data: generatePredictions()
            };
            break;
    }
    
    alert(`Custom report "${template}" generated! (In production, this would generate a downloadable file)`);
}

function generateDistrictReport() {
    const districts = new Map();
    
    sampleData.pins.forEach(pin => {
        if (!districts.has(pin.district)) {
            districts.set(pin.district, {
                district: pin.district,
                totalEnrollment: 0,
                pinCount: 0,
                highRiskCount: 0
            });
        }
        const data = districts.get(pin.district);
        data.totalEnrollment += pin.enrollment;
        data.pinCount++;
        if (pin.risk === 'high') data.highRiskCount++;
    });
    
    return Array.from(districts.values());
}
