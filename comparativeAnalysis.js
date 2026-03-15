// Comparative Analysis Engine

function setupComparativeAnalysis() {
    const selectors = ['comparePin1', 'comparePin2', 'comparePin3'];
    
    selectors.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option value="">-- Select PIN --</option>';
        sampleData.pins.forEach(pin => {
            const option = document.createElement('option');
            option.value = pin.pin;
            option.textContent = `${pin.pin} - ${pin.district}`;
            select.appendChild(option);
        });
    });
    
    document.getElementById('compareBtn').addEventListener('click', performComparison);
    renderDistrictComparison();
}

function performComparison() {
    const pin1 = document.getElementById('comparePin1').value;
    const pin2 = document.getElementById('comparePin2').value;
    const pin3 = document.getElementById('comparePin3').value;
    
    const selectedPins = [pin1, pin2, pin3].filter(p => p);
    
    if (selectedPins.length < 2) {
        alert('Please select at least 2 PINs to compare');
        return;
    }
    
    const comparisonData = selectedPins.map(pinCode => {
        const pin = sampleData.pins.find(p => p.pin === pinCode);
        const details = sampleData.pinDetails[pinCode];
        return { pin, details };
    });
    
    renderComparison(comparisonData);
}

function renderComparison(data) {
    const container = document.getElementById('comparisonResults');
    
    container.innerHTML = `
        <div class="comparison-grid">
            ${data.map(item => `
                <div class="comparison-card">
                    <h4>PIN ${item.pin.pin}</h4>
                    <p style="color: #666; margin-bottom: 1rem;">${item.pin.district} District</p>
                    <div style="margin-bottom: 0.75rem;">
                        <strong>Total Enrollment:</strong> ${item.pin.enrollment.toLocaleString()}
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong>Growth Rate:</strong> ${item.pin.growth}%
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong>Risk Level:</strong> <span class="risk-badge ${item.pin.risk}">${item.pin.risk.toUpperCase()}</span>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong>Border Pushbacks:</strong> ${item.pin.borderPushbacks}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="chart-section">
            <h3>Side-by-Side Comparison</h3>
            <div id="comparisonChart"></div>
        </div>
    `;
    
    renderComparisonChart(data);
}

function renderComparisonChart(data) {
    const container = document.getElementById('comparisonChart');
    const maxEnrollment = Math.max(...data.map(d => d.pin.enrollment));
    
    const chartHeight = 300;
    const chartWidth = container.offsetWidth - 100;
    const barWidth = 60;
    const groupSpacing = 100;
    
    let svg = `<svg width="${chartWidth + 100}" height="${chartHeight + 80}">`;
    
    // Draw bars for each PIN
    data.forEach((item, i) => {
        const x = 50 + i * (barWidth + groupSpacing);
        const barHeight = (item.pin.enrollment / maxEnrollment) * chartHeight;
        const y = chartHeight - barHeight + 20;
        
        const color = item.pin.risk === 'high' ? '#ffab91' : item.pin.risk === 'medium' ? '#fff59d' : '#a5d6a7';
        
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="#666" stroke-width="1"/>`;
        svg += `<text x="${x + barWidth/2}" y="${y - 5}" font-size="12" fill="#333" text-anchor="middle" font-weight="600">${item.pin.enrollment.toLocaleString()}</text>`;
        svg += `<text x="${x + barWidth/2}" y="${chartHeight + 40}" font-size="12" fill="#666" text-anchor="middle">PIN ${item.pin.pin}</text>`;
        svg += `<text x="${x + barWidth/2}" y="${chartHeight + 60}" font-size="10" fill="#999" text-anchor="middle">${item.pin.growth}% growth</text>`;
    });
    
    svg += '</svg>';
    container.innerHTML = svg;
}

function renderDistrictComparison() {
    const container = document.getElementById('districtComparison');
    
    // Aggregate by district
    const districtData = new Map();
    sampleData.pins.forEach(pin => {
        if (!districtData.has(pin.district)) {
            districtData.set(pin.district, {
                totalEnrollment: 0,
                pinCount: 0,
                highRiskCount: 0,
                avgGrowth: 0
            });
        }
        const data = districtData.get(pin.district);
        data.totalEnrollment += pin.enrollment;
        data.pinCount++;
        data.avgGrowth += pin.growth;
        if (pin.risk === 'high') data.highRiskCount++;
    });
    
    // Calculate averages
    districtData.forEach((data, district) => {
        data.avgGrowth = (data.avgGrowth / data.pinCount).toFixed(1);
    });
    
    const districts = Array.from(districtData.entries()).sort((a, b) => b[1].totalEnrollment - a[1].totalEnrollment);
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>District</th>
                    <th>Total Enrollment</th>
                    <th>PIN Codes</th>
                    <th>High-Risk PINs</th>
                    <th>Avg Growth Rate</th>
                </tr>
            </thead>
            <tbody>
                ${districts.map(([district, data]) => `
                    <tr>
                        <td><strong>${district}</strong></td>
                        <td>${data.totalEnrollment.toLocaleString()}</td>
                        <td>${data.pinCount}</td>
                        <td><span class="risk-badge ${data.highRiskCount > 0 ? 'high' : 'low'}">${data.highRiskCount}</span></td>
                        <td>${data.avgGrowth}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
