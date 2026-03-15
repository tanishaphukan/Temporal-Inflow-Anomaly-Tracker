// Pattern Recognition Engine

function recognizePatterns() {
    return {
        clusters: performClusterAnalysis(),
        spikePatterns: findSimilarSpikePatterns(),
        weekdayPatterns: analyzeWeekdayPatterns()
    };
}

function performClusterAnalysis() {
    // Simple k-means clustering based on enrollment and growth
    const clusters = {
        highVolume: [],
        rapidGrowth: [],
        stable: [],
        emerging: []
    };
    
    sampleData.pins.forEach(pin => {
        if (pin.enrollment > 3000 && pin.growth > 150) {
            clusters.highVolume.push(pin);
        } else if (pin.growth > 150) {
            clusters.rapidGrowth.push(pin);
        } else if (pin.enrollment > 2000 && pin.growth < 100) {
            clusters.stable.push(pin);
        } else {
            clusters.emerging.push(pin);
        }
    });
    
    return clusters;
}

function findSimilarSpikePatterns() {
    // Find PINs with similar spike timing
    const patterns = [];
    const pinMonthlyData = new Map();
    
    // Build monthly data for each PIN
    sampleData.pins.forEach(pin => {
        if (sampleData.pinDetails[pin.pin]) {
            pinMonthlyData.set(pin.pin, {
                pin: pin.pin,
                district: pin.district,
                data: sampleData.pinDetails[pin.pin].monthlyData
            });
        }
    });
    
    // Find correlations
    const pinArray = Array.from(pinMonthlyData.values());
    for (let i = 0; i < pinArray.length; i++) {
        const similar = [];
        for (let j = i + 1; j < pinArray.length; j++) {
            const correlation = calculateCorrelation(pinArray[i].data, pinArray[j].data);
            if (correlation > 0.7) {
                similar.push({
                    pin: pinArray[j].pin,
                    district: pinArray[j].district,
                    correlation: correlation.toFixed(2)
                });
            }
        }
        
        if (similar.length > 0) {
            patterns.push({
                primaryPin: pinArray[i].pin,
                primaryDistrict: pinArray[i].district,
                similarPins: similar
            });
        }
    }
    
    return patterns;
}

function calculateCorrelation(data1, data2) {
    if (data1.length !== data2.length || data1.length === 0) return 0;
    
    const values1 = data1.map(d => d.enrollments);
    const values2 = data2.map(d => d.enrollments);
    
    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < values1.length; i++) {
        const diff1 = values1[i] - mean1;
        const diff2 = values2[i] - mean2;
        numerator += diff1 * diff2;
        sum1 += diff1 * diff1;
        sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
}

function analyzeWeekdayPatterns() {
    const weekdayData = { weekday: 0, weekend: 0 };
    
    sampleData.rawData.forEach(row => {
        const date = parseDate(row.Date);
        const dayOfWeek = date.getDay();
        const enrollment = (row['Age 0 5'] || 0) + (row['Age 5 17'] || 0) + (row['Age 18 Greater'] || 0);
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekdayData.weekend += enrollment;
        } else {
            weekdayData.weekday += enrollment;
        }
    });
    
    const total = weekdayData.weekday + weekdayData.weekend;
    return {
        weekday: {
            count: weekdayData.weekday,
            percentage: ((weekdayData.weekday / total) * 100).toFixed(1)
        },
        weekend: {
            count: weekdayData.weekend,
            percentage: ((weekdayData.weekend / total) * 100).toFixed(1)
        }
    };
}

function renderPatternRecognition() {
    const patterns = recognizePatterns();
    
    renderClusterAnalysis(patterns.clusters);
    renderSpikePatterns(patterns.spikePatterns);
    renderWeekdayPattern(patterns.weekdayPatterns);
}

function renderClusterAnalysis(clusters) {
    const container = document.getElementById('clusterAnalysis');
    
    container.innerHTML = `
        <div class="cluster-group">
            <h4>High Volume & High Growth (${clusters.highVolume.length} PINs)</h4>
            <p style="color: #666; margin-bottom: 1rem;">PINs with both high enrollment volume and rapid growth - highest priority monitoring</p>
            ${clusters.highVolume.map(p => `<span class="pin-tag">${p.pin} (${p.district})</span>`).join('')}
        </div>
        
        <div class="cluster-group">
            <h4>Rapid Growth (${clusters.rapidGrowth.length} PINs)</h4>
            <p style="color: #666; margin-bottom: 1rem;">PINs showing rapid growth rates - potential emerging hotspots</p>
            ${clusters.rapidGrowth.map(p => `<span class="pin-tag">${p.pin} (${p.district})</span>`).join('')}
        </div>
        
        <div class="cluster-group">
            <h4>Stable High Volume (${clusters.stable.length} PINs)</h4>
            <p style="color: #666; margin-bottom: 1rem;">PINs with high enrollment but stable growth - baseline monitoring</p>
            ${clusters.stable.map(p => `<span class="pin-tag">${p.pin} (${p.district})</span>`).join('')}
        </div>
        
        <div class="cluster-group">
            <h4>Emerging (${clusters.emerging.length} PINs)</h4>
            <p style="color: #666; margin-bottom: 1rem;">PINs with moderate activity - watch for changes</p>
            ${clusters.emerging.slice(0, 10).map(p => `<span class="pin-tag">${p.pin} (${p.district})</span>`).join('')}
            ${clusters.emerging.length > 10 ? `<span style="color: #666; font-size: 0.9rem;">... and ${clusters.emerging.length - 10} more</span>` : ''}
        </div>
    `;
}

function renderSpikePatterns(patterns) {
    const container = document.getElementById('spikePatterns');
    
    if (patterns.length === 0) {
        container.innerHTML = '<p style="color: #666; padding: 2rem; text-align: center;">No significant correlation patterns detected</p>';
        return;
    }
    
    container.innerHTML = patterns.slice(0, 5).map(p => `
        <div class="cluster-group">
            <h4>PIN ${p.primaryPin} (${p.primaryDistrict})</h4>
            <p style="color: #666; margin-bottom: 1rem;">Shows similar enrollment patterns with:</p>
            ${p.similarPins.map(s => `
                <span class="pin-tag">${s.pin} (${s.district}) - ${(s.correlation * 100).toFixed(0)}% correlation</span>
            `).join('')}
        </div>
    `).join('');
}

function renderWeekdayPattern(patterns) {
    const container = document.getElementById('weekdayPattern');
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div class="card">
                <div class="card-label">Weekday Enrollments</div>
                <div class="card-value">${patterns.weekday.count.toLocaleString()}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">${patterns.weekday.percentage}% of total</div>
            </div>
            <div class="card">
                <div class="card-label">Weekend Enrollments</div>
                <div class="card-value">${patterns.weekend.count.toLocaleString()}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">${patterns.weekend.percentage}% of total</div>
            </div>
        </div>
        <div style="background: #fff; padding: 2rem; border-radius: 6px; border: 1px solid #e0e0e0; margin-top: 1.5rem;">
            <p style="color: #666;">
                ${patterns.weekend.percentage > 20 ? 
                    '⚠️ Elevated weekend activity detected. Weekend enrollments typically represent 10-15% of total activity. Current level may warrant investigation.' :
                    '✓ Weekend enrollment patterns appear normal for typical administrative operations.'}
            </p>
        </div>
    `;
}
