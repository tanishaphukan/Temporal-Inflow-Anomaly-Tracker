// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (item.classList.contains('disabled')) {
            return;
        }
        
        const viewName = item.dataset.view;
        
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(`${viewName}-view`).classList.add('active');
    });
});

// File upload handling
document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('datasetUpload').click();
});

document.getElementById('datasetUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

document.getElementById('downloadTemplateBtn').addEventListener('click', () => {
    downloadTemplate();
});

function handleFileUpload(file) {
    const status = document.getElementById('uploadStatus');
    status.textContent = 'Processing file...';
    status.className = 'upload-status';
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const csv = e.target.result;
            const data = parseCSV(csv);
            
            if (validateData(data)) {
                sampleData.rawData = data;
                
                // Show progress
                if (typeof showProgress === 'function') {
                    showProgress(30);
                }
                status.textContent = 'Processing data...';
                
                setTimeout(() => {
                    processRawData(data);
                    if (typeof showProgress === 'function') {
                        showProgress(60);
                    }
                    
                    setTimeout(() => {
                        dataLoaded = true;
                        if (typeof showProgress === 'function') {
                            showProgress(100);
                        }
                        
                        status.textContent = `✓ Successfully loaded ${data.length} records across ${sampleData.pins.length} PIN codes`;
                        status.className = 'upload-status success';
                        
                        // Trigger confetti for successful upload
                        if (typeof triggerConfetti === 'function') {
                            triggerConfetti();
                        }
                        if (typeof showNotification === 'function') {
                            showNotification(`Successfully loaded ${sampleData.pins.length} PIN codes!`, 'success');
                        }
                        
                        // Enable navigation items
                        document.querySelectorAll('.nav-item.disabled').forEach(item => {
                            item.classList.remove('disabled');
                        });
                        
                        // Initialize dashboard
                        setTimeout(() => {
                            document.querySelector('[data-view="dashboard"]').click();
                            initDashboard();
                            if (typeof initializeInteractivity === 'function') {
                                initializeInteractivity();
                            }
                        }, 1000);
                    }, 500);
                }, 500);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            status.textContent = `✗ Error: ${error.message}. Please check your CSV format.`;
            status.className = 'upload-status error';
        }
    };
    
    reader.onerror = () => {
        status.textContent = '✗ Error reading file';
        status.className = 'upload-status error';
    };
    
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    
    // Create a mapping of normalized headers to original headers
    const headerMap = {};
    rawHeaders.forEach(header => {
        const normalized = header.toLowerCase().replace(/\s+/g, '');
        headerMap[normalized] = header;
    });
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        rawHeaders.forEach((header, index) => {
            const value = values[index];
            const normalized = header.toLowerCase().replace(/\s+/g, '');
            
            // Map to standard field names
            if (normalized.includes('date')) {
                row['Date'] = value;
            } else if (normalized.includes('state')) {
                row['State'] = value;
            } else if (normalized.includes('district')) {
                row['District'] = value;
            } else if (normalized.includes('pincode') || normalized.includes('pin')) {
                row['Pincode'] = value;
            } else if (normalized.includes('age') && (normalized.includes('05') || normalized.includes('0-5') || normalized.includes('5'))) {
                row['Age 0 5'] = parseInt(value) || 0;
            } else if (normalized.includes('age') && (normalized.includes('517') || normalized.includes('5-17') || normalized.includes('17'))) {
                row['Age 5 17'] = parseInt(value) || 0;
            } else if (normalized.includes('age') && (normalized.includes('18') || normalized.includes('greater') || normalized.includes('above'))) {
                row['Age 18 Greater'] = parseInt(value) || 0;
            }
        });
        
        data.push(row);
    }
    
    return data;
}

function validateData(data) {
    if (!data || data.length === 0) {
        throw new Error('No data found in file');
    }
    
    const requiredFields = ['Date', 'State', 'District', 'Pincode'];
    const firstRow = data[0];
    
    for (const field of requiredFields) {
        if (!(field in firstRow) || !firstRow[field]) {
            throw new Error(`Missing or empty required column: ${field}. Found columns: ${Object.keys(firstRow).join(', ')}`);
        }
    }
    
    // Check if at least one age column exists
    const hasAgeData = ('Age 0 5' in firstRow) || ('Age 5 17' in firstRow) || ('Age 18 Greater' in firstRow);
    if (!hasAgeData) {
        throw new Error('Missing age group columns. Need at least one of: Age 0 5, Age 5 17, Age 18 Greater');
    }
    
    return true;
}

function generateTimeSeriesData() {
    // Generate synthetic time series based on uploaded data
    const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'];
    const totalEnrollment = sampleData.pins.reduce((sum, pin) => sum + pin.enrollment, 0);
    
    sampleData.timeSeriesData = months.map((month, i) => {
        const factor = 0.3 + (i * 0.15);
        return {
            month,
            total: Math.floor(totalEnrollment * factor),
            policyMarker: month === '2024-10',
            policyName: month === '2024-10' ? 'NRC Draft Review' : undefined
        };
    });
}

function generatePolicyTimeline() {
    sampleData.policyTimeline = [
        { date: '2024-10-15', title: 'NRC Draft Review Period', description: 'Final review period announced for NRC draft submissions' },
        { date: '2024-12-31', title: 'Citizenship Amendment Deadline', description: 'Extended deadline for citizenship documentation under CAA' },
        { date: '2025-03-31', title: 'Border Security Enhancement', description: 'Implementation of enhanced border verification protocols' }
    ];
}

function generatePinDetails() {
    sampleData.pinDetails = {};
    
    sampleData.pins.forEach(pin => {
        const baseEnrollment = Math.floor(pin.enrollment / 3);
        sampleData.pinDetails[pin.pin] = {
            monthlyData: [
                { month: 'Jul 2024', enrollments: Math.floor(baseEnrollment * 0.7) },
                { month: 'Aug 2024', enrollments: Math.floor(baseEnrollment * 0.8) },
                { month: 'Sep 2024', enrollments: Math.floor(baseEnrollment * 0.9) },
                { month: 'Oct 2024', enrollments: Math.floor(baseEnrollment * 1.5) },
                { month: 'Nov 2024', enrollments: Math.floor(baseEnrollment * 2.2) },
                { month: 'Dec 2024', enrollments: pin.enrollment },
                { month: 'Jan 2025', enrollments: Math.floor(pin.enrollment * 0.9) }
            ],
            explanation: pin.risk === 'high' 
                ? `Elevated enrollment activity detected during policy deadline period. Growth rate of ${pin.growth}% exceeds threshold for high-risk classification.`
                : pin.risk === 'medium'
                ? `Moderate increase in enrollment observed. Growth rate of ${pin.growth}% warrants continued monitoring.`
                : `Normal enrollment patterns within historical baseline. Growth rate of ${pin.growth}% consistent with demographic trends.`
        };
    });
}

function downloadTemplate() {
    const template = generateSampleTemplate();
    const headers = ['Date', 'State', 'District', 'Pincode', 'Age 0 5', 'Age 5 17', 'Age 18 Greater'];
    const rows = template.map(row => [
        row.Date,
        row.State,
        row.District,
        row.Pincode,
        row['Age 0 5'],
        row['Age 5 17'],
        row['Age 18 Greater']
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadCSV(csv, 'aadhaar-enrollment-template.csv');
}

// Initialize dashboard
function initDashboard() {
    if (!dataLoaded) return;
    
    updateSummaryCards();
    renderHeatmap();
    renderTimeSeriesChart();
    populatePinSelector();
    populateDistrictFilter();
    renderPolicyTimeline();
    
    // Initialize all advanced features
    setupTimeFilter();
    setupAnomalyDetection();
    renderGeographicMap();
    renderPredictiveAnalytics();
    setupComparativeAnalysis();
    renderAgeAnalysis();
    renderPatternRecognition();
    setupAlertSystem();
    renderCorrelationAnalysis();
    renderDataQuality();
    setupReportGenerator();
}

function setupTimeFilter() {
    document.getElementById('timeFilter').addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            document.getElementById('startDate').style.display = 'inline-block';
            document.getElementById('endDate').style.display = 'inline-block';
        } else {
            document.getElementById('startDate').style.display = 'none';
            document.getElementById('endDate').style.display = 'none';
        }
        // In production, this would filter the data
    });
}

function setupAnomalyDetection() {
    const methodSelect = document.getElementById('anomalyMethod');
    const sensitivitySelect = document.getElementById('anomalySensitivity');
    
    const runDetection = () => {
        const anomalies = detectAnomalies(methodSelect.value, sensitivitySelect.value);
        renderAnomalyResults(anomalies);
    };
    
    methodSelect.addEventListener('change', runDetection);
    sensitivitySelect.addEventListener('change', runDetection);
    
    // Initial detection
    runDetection();
}

function updateSummaryCards() {
    const totalPins = sampleData.pins.length;
    const highRiskPins = sampleData.pins.filter(p => p.risk === 'high').length;
    const latestMonth = sampleData.timeSeriesData[sampleData.timeSeriesData.length - 1].month;
    
    // Animate the values
    const totalPinsEl = document.getElementById('totalPins');
    const highRiskPinsEl = document.getElementById('highRiskPins');
    
    if (totalPinsEl && highRiskPinsEl) {
        if (typeof animateValue === 'function') {
            animateValue(totalPinsEl, 0, totalPins, 1000);
            animateValue(highRiskPinsEl, 0, highRiskPins, 1000);
        } else {
            totalPinsEl.textContent = totalPins;
            highRiskPinsEl.textContent = highRiskPins;
        }
        document.getElementById('latestAnomaly').textContent = formatMonth(latestMonth);
    }
}

function renderHeatmap() {
    const heatmap = document.getElementById('heatmap');
    heatmap.innerHTML = '';
    
    sampleData.pins.forEach((pin, index) => {
        const cell = document.createElement('div');
        cell.className = `heatmap-cell risk-${pin.risk}`;
        cell.style.animationDelay = (index * 0.05) + 's';
        cell.classList.add('fade-in');
        cell.setAttribute('data-tooltip', `${pin.district} - ${pin.enrollment.toLocaleString()} enrollments`);
        
        cell.innerHTML = `
            <div class="heatmap-cell-pin">${pin.pin}</div>
            <div class="heatmap-cell-risk">${pin.risk.toUpperCase()}</div>
        `;
        
        cell.addEventListener('click', () => {
            showPinDetail(pin.pin);
            if (typeof showNotification === 'function') {
                showNotification(`Loading details for PIN ${pin.pin}`, 'info');
            }
        });
        
        heatmap.appendChild(cell);
    });
    
    // Re-initialize tooltips
    if (typeof addInteractiveTooltips === 'function') {
        setTimeout(addInteractiveTooltips, 100);
    }
}

function renderTimeSeriesChart() {
    const chart = document.getElementById('timeSeriesChart');
    const data = sampleData.timeSeriesData;
    
    const maxValue = Math.max(...data.map(d => d.total));
    const chartHeight = 350;
    const chartWidth = chart.offsetWidth - 100;
    const pointSpacing = chartWidth / (data.length - 1);
    
    let svg = `<svg width="${chartWidth + 100}" height="${chartHeight + 50}" style="overflow: visible;">`;
    
    // Grid lines
    for (let i = 0; i <= 5; i++) {
        const y = (chartHeight / 5) * i + 20;
        const value = Math.round(maxValue - (maxValue / 5) * i);
        svg += `<line x1="50" y1="${y}" x2="${chartWidth + 50}" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>`;
        svg += `<text x="10" y="${y + 5}" font-size="12" fill="#666">${value.toLocaleString()}</text>`;
    }
    
    // Line path
    let path = 'M';
    data.forEach((point, i) => {
        const x = 50 + i * pointSpacing;
        const y = 20 + chartHeight - (point.total / maxValue) * chartHeight;
        path += `${i === 0 ? '' : ' L'}${x},${y}`;
    });
    svg += `<path d="${path}" fill="none" stroke="#2c5282" stroke-width="3"/>`;
    
    // Data points and policy markers
    data.forEach((point, i) => {
        const x = 50 + i * pointSpacing;
        const y = 20 + chartHeight - (point.total / maxValue) * chartHeight;
        
        if (point.policyMarker) {
            svg += `<line x1="${x}" y1="20" x2="${x}" y2="${chartHeight + 20}" stroke="#d84315" stroke-width="2" stroke-dasharray="5,5"/>`;
            svg += `<text x="${x}" y="10" font-size="11" fill="#d84315" text-anchor="middle" font-weight="600">${point.policyName}</text>`;
        }
        
        svg += `<circle cx="${x}" cy="${y}" r="5" fill="#2c5282"/>`;
        svg += `<text x="${x}" y="${chartHeight + 40}" font-size="11" fill="#666" text-anchor="middle">${formatMonth(point.month)}</text>`;
    });
    
    svg += '</svg>';
    chart.innerHTML = svg;
}

function populatePinSelector() {
    const select = document.getElementById('pinSelect');
    select.innerHTML = '<option value="">-- Select PIN --</option>';
    
    sampleData.pins.forEach(pin => {
        const option = document.createElement('option');
        option.value = pin.pin;
        option.textContent = `${pin.pin} - ${pin.district}`;
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        if (e.target.value) {
            showPinDetail(e.target.value);
        }
    });
}

function showPinDetail(pinCode) {
    const pin = sampleData.pins.find(p => p.pin === pinCode);
    const details = sampleData.pinDetails[pinCode];
    
    if (!pin || !details) return;
    
    // Switch to PIN analysis view
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelector('[data-view="pin-analysis"]').classList.add('active');
    document.getElementById('pin-analysis-view').classList.add('active');
    
    // Set selector
    document.getElementById('pinSelect').value = pinCode;
    
    const detailDiv = document.getElementById('pinDetail');
    detailDiv.innerHTML = `
        <h3>PIN ${pin.pin} - ${pin.district} District</h3>
        <div class="pin-detail-grid">
            <div class="detail-item">
                <div class="detail-label">Current Enrollment</div>
                <div class="detail-value">${pin.enrollment.toLocaleString()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Growth Rate</div>
                <div class="detail-value">${pin.growth}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Risk Level</div>
                <div class="detail-value">
                    <span class="risk-badge ${pin.risk}">${pin.risk.toUpperCase()}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Border Pushbacks</div>
                <div class="detail-value">${pin.borderPushbacks}</div>
            </div>
        </div>
        
        <div class="chart-section">
            <h4>Monthly Enrollment Trend</h4>
            <div id="pinChart"></div>
        </div>
        
        <div class="explanation-box">
            <h4>Analysis Summary</h4>
            <p>${details.explanation}</p>
        </div>
    `;
    
    renderPinChart(details.monthlyData);
}

function renderPinChart(monthlyData) {
    const chart = document.getElementById('pinChart');
    if (!chart) return;
    
    const maxValue = Math.max(...monthlyData.map(d => d.enrollments));
    const barWidth = 60;
    const chartHeight = 250;
    const chartWidth = monthlyData.length * (barWidth + 20);
    
    let svg = `<svg width="${chartWidth}" height="${chartHeight + 60}">`;
    
    monthlyData.forEach((point, i) => {
        const x = i * (barWidth + 20) + 10;
        const barHeight = (point.enrollments / maxValue) * chartHeight;
        const y = chartHeight - barHeight + 10;
        
        const color = point.enrollments > maxValue * 0.7 ? '#ffab91' : 
                     point.enrollments > maxValue * 0.5 ? '#fff59d' : '#a5d6a7';
        
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" stroke="#666" stroke-width="1"/>`;
        svg += `<text x="${x + barWidth/2}" y="${y - 5}" font-size="12" fill="#333" text-anchor="middle" font-weight="600">${point.enrollments.toLocaleString()}</text>`;
        svg += `<text x="${x + barWidth/2}" y="${chartHeight + 30}" font-size="11" fill="#666" text-anchor="middle">${point.month}</text>`;
    });
    
    svg += '</svg>';
    chart.innerHTML = svg;
}

function renderPolicyTimeline() {
    const timeline = document.querySelector('.timeline');
    timeline.innerHTML = '';
    
    sampleData.policyTimeline.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-date">${formatDate(item.date)}</div>
            <div class="timeline-title">${item.title}</div>
            <div class="timeline-desc">${item.description}</div>
        `;
        timeline.appendChild(div);
    });
}

function populateDistrictFilter() {
    const select = document.getElementById('districtFilter');
    const districts = [...new Set(sampleData.pins.map(p => p.district))];
    
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        select.appendChild(option);
    });
}

// Export functionality
document.getElementById('exportBtn').addEventListener('click', () => {
    const districtFilter = document.getElementById('districtFilter').value;
    const riskFilter = document.getElementById('riskFilter').value;
    
    let filteredData = sampleData.pins;
    
    if (districtFilter !== 'all') {
        filteredData = filteredData.filter(p => p.district === districtFilter);
    }
    
    if (riskFilter !== 'all') {
        filteredData = filteredData.filter(p => p.risk === riskFilter);
    }
    
    const csv = generateCSV(filteredData);
    downloadCSV(csv, 'nrc-anomaly-report.csv');
});

function generateCSV(data) {
    const headers = ['PIN Code', 'District', 'State', 'Risk Level', 'Total Enrollment', 'Growth Rate (%)', 'Border Pushbacks'];
    const rows = data.map(pin => [
        pin.pin,
        pin.district,
        pin.state || 'Assam',
        pin.risk.toUpperCase(),
        pin.enrollment,
        pin.growth,
        pin.borderPushbacks
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Utility functions
function formatMonth(dateStr) {
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Initialize on load - removed duplicate DOMContentLoaded
// (Already handled in the navigation section above)
