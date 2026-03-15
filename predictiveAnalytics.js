// Predictive Analytics Engine

function generatePredictions() {
    const predictions = {
        next30Days: predictEnrollment(30),
        next60Days: predictEnrollment(60),
        next90Days: predictEnrollment(90),
        highRiskPins: identifyHighRiskPins(),
        earlyWarnings: generateEarlyWarnings()
    };
    
    return predictions;
}

function predictEnrollment(days) {
    // Simple linear regression for prediction
    const timeSeriesData = sampleData.timeSeriesData;
    if (timeSeriesData.length < 3) return null;
    
    const recentData = timeSeriesData.slice(-6);
    const avgGrowth = recentData.reduce((sum, d, i) => {
        if (i === 0) return 0;
        return sum + ((d.total - recentData[i-1].total) / recentData[i-1].total);
    }, 0) / (recentData.length - 1);
    
    const lastValue = timeSeriesData[timeSeriesData.length - 1].total;
    const monthsAhead = Math.ceil(days / 30);
    const predicted = lastValue * Math.pow(1 + avgGrowth, monthsAhead);
    
    return {
        value: Math.round(predicted),
        confidence: avgGrowth > 0.1 ? 'Medium' : 'High',
        trend: avgGrowth > 0 ? 'Increasing' : 'Decreasing',
        growthRate: (avgGrowth * 100).toFixed(1)
    };
}

function identifyHighRiskPins() {
    return sampleData.pins
        .filter(p => p.risk === 'high' || p.growth > 150)
        .map(p => ({
            pin: p.pin,
            district: p.district,
            probability: calculateAnomalyProbability(p),
            currentRisk: p.risk
        }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 10);
}

function calculateAnomalyProbability(pin) {
    // Multi-factor probability calculation
    let probability = 0;
    
    // Growth factor
    if (pin.growth > 200) probability += 40;
    else if (pin.growth > 150) probability += 30;
    else if (pin.growth > 100) probability += 20;
    
    // Enrollment volume factor
    if (pin.enrollment > 4000) probability += 30;
    else if (pin.enrollment > 2500) probability += 20;
    else if (pin.enrollment > 1500) probability += 10;
    
    // Border pushback correlation
    if (pin.borderPushbacks > 70) probability += 20;
    else if (pin.borderPushbacks > 40) probability += 10;
    
    // Time proximity to deadline
    const daysToDeadline = calculateDaysToDeadline(pin);
    if (daysToDeadline !== 'N/A' && daysToDeadline < 60) probability += 10;
    
    return Math.min(probability, 100);
}

function generateEarlyWarnings() {
    const warnings = [];
    
    sampleData.pins.forEach(pin => {
        const probability = calculateAnomalyProbability(pin);
        
        if (probability > 60) {
            warnings.push({
                pin: pin.pin,
                district: pin.district,
                severity: probability > 80 ? 'Critical' : 'High',
                probability: probability,
                message: generateWarningMessage(pin, probability)
            });
        }
    });
    
    return warnings.sort((a, b) => b.probability - a.probability);
}

function generateWarningMessage(pin, probability) {
    const messages = [];
    
    if (pin.growth > 200) {
        messages.push(`Extreme growth rate of ${pin.growth}%`);
    }
    
    if (pin.enrollment > 4000) {
        messages.push(`High enrollment volume (${pin.enrollment.toLocaleString()})`);
    }
    
    const daysToDeadline = calculateDaysToDeadline(pin);
    if (daysToDeadline !== 'N/A' && daysToDeadline < 60) {
        messages.push(`${daysToDeadline} days to policy deadline`);
    }
    
    return messages.join('. ') + '.';
}

function renderPredictiveAnalytics() {
    const predictions = generatePredictions();
    
    // Render prediction cards
    const cardsContainer = document.querySelector('#predictive-view .prediction-cards');
    cardsContainer.innerHTML = `
        <div class="card">
            <div class="card-label">30-Day Forecast</div>
            <div class="card-value">${predictions.next30Days.value.toLocaleString()}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                ${predictions.next30Days.trend} (${predictions.next30Days.growthRate}%)
            </div>
        </div>
        <div class="card">
            <div class="card-label">60-Day Forecast</div>
            <div class="card-value">${predictions.next60Days.value.toLocaleString()}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                Confidence: ${predictions.next60Days.confidence}
            </div>
        </div>
        <div class="card">
            <div class="card-label">90-Day Forecast</div>
            <div class="card-value">${predictions.next90Days.value.toLocaleString()}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                ${predictions.next90Days.trend}
            </div>
        </div>
        <div class="card">
            <div class="card-label">High-Risk PINs</div>
            <div class="card-value alert">${predictions.highRiskPins.length}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                Require monitoring
            </div>
        </div>
    `;
    
    // Render forecast chart
    renderForecastChart(predictions);
    
    // Render early warnings
    renderEarlyWarnings(predictions.earlyWarnings);
}

function renderForecastChart(predictions) {
    const container = document.getElementById('forecastChart');
    const historical = sampleData.timeSeriesData.slice(-6);
    const forecast = [
        { month: 'Next 30d', value: predictions.next30Days.value, isForecast: true },
        { month: 'Next 60d', value: predictions.next60Days.value, isForecast: true },
        { month: 'Next 90d', value: predictions.next90Days.value, isForecast: true }
    ];
    
    const allData = [...historical.map(h => ({ month: formatMonth(h.month), value: h.total, isForecast: false })), ...forecast];
    const maxValue = Math.max(...allData.map(d => d.value));
    
    const chartHeight = 300;
    const chartWidth = container.offsetWidth - 100;
    const barWidth = 50;
    const spacing = (chartWidth - (allData.length * barWidth)) / (allData.length + 1);
    
    let svg = `<svg width="${chartWidth + 100}" height="${chartHeight + 60}">`;
    
    allData.forEach((point, i) => {
        const x = spacing + i * (barWidth + spacing) + 50;
        const barHeight = (point.value / maxValue) * chartHeight;
        const y = chartHeight - barHeight + 10;
        
        const color = point.isForecast ? '#90caf9' : '#2c5282';
        
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" opacity="${point.isForecast ? 0.7 : 1}"/>`;
        svg += `<text x="${x + barWidth/2}" y="${y - 5}" font-size="11" fill="#333" text-anchor="middle" font-weight="600">${(point.value/1000).toFixed(1)}K</text>`;
        svg += `<text x="${x + barWidth/2}" y="${chartHeight + 30}" font-size="10" fill="#666" text-anchor="middle">${point.month}</text>`;
    });
    
    svg += '</svg>';
    container.innerHTML = svg;
}

function renderEarlyWarnings(warnings) {
    const container = document.getElementById('earlyWarning');
    
    if (warnings.length === 0) {
        container.innerHTML = '<p style="color: #2e7d32; padding: 2rem; text-align: center;">✓ No early warnings at this time</p>';
        return;
    }
    
    container.innerHTML = warnings.map(w => `
        <div class="alert-item ${w.severity === 'Critical' ? 'critical' : ''}">
            <h4>PIN ${w.pin} - ${w.district}</h4>
            <p><strong>Severity:</strong> ${w.severity} | <strong>Probability:</strong> ${w.probability}%</p>
            <p style="color: #666; font-size: 0.9rem;">${w.message}</p>
        </div>
    `).join('');
}
