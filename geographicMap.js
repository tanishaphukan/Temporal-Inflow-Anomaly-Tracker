// Geographic Map Visualization with Leaflet

let map = null;
let markersLayer = null;
let heatmapLayer = null;

// Approximate coordinates for Assam border districts and PIN codes
const districtCoordinates = {
    'Dhubri': { lat: 26.0167, lng: 89.9833 },
    'Kokrajhar': { lat: 26.4019, lng: 90.2715 },
    'Karimganj': { lat: 24.8697, lng: 92.3547 },
    'Hailakandi': { lat: 24.6847, lng: 92.5672 },
    'South Salmara': { lat: 26.1500, lng: 89.8500 },
    'Bongaigaon': { lat: 26.4833, lng: 90.5500 },
    'Chirang': { lat: 26.5333, lng: 90.4500 },
    'Baksa': { lat: 26.7833, lng: 91.2333 },
    'Bajali': { lat: 26.6500, lng: 90.9500 }
};

// Generate approximate PIN coordinates based on district
function getPinCoordinates(pin, district) {
    const baseCoords = districtCoordinates[district] || { lat: 26.2006, lng: 92.9376 };
    
    // Add small random offset for each PIN within district
    const offset = 0.1;
    const hash = pin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latOffset = ((hash % 100) / 100 - 0.5) * offset;
    const lngOffset = (((hash * 7) % 100) / 100 - 0.5) * offset;
    
    return {
        lat: baseCoords.lat + latOffset,
        lng: baseCoords.lng + lngOffset
    };
}

function renderGeographicMap() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        const container = document.getElementById('geoMap');
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Map library loading... Please refresh if this persists.</div>';
        return;
    }
    
    const container = document.getElementById('geoMap');
    if (!container) {
        console.error('Map container not found');
        return;
    }
    
    // Clear any existing map
    container.innerHTML = '';
    if (map) {
        map.remove();
        map = null;
    }
    
    // Wait a bit for container to be ready
    setTimeout(() => {
        try {
            // Initialize Leaflet map centered on Assam
            map = L.map('geoMap', {
                center: [26.2006, 91.5],
                zoom: 8,
                scrollWheelZoom: true
            });
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                minZoom: 7
            }).addTo(map);
            
            // Create marker layer
            markersLayer = L.layerGroup().addTo(map);
            
            // Add markers for each PIN
            sampleData.pins.forEach(pin => {
                const coords = getPinCoordinates(pin.pin, pin.district);
                
                // Determine marker color based on risk
                const color = pin.risk === 'high' ? '#f44336' : 
                             pin.risk === 'medium' ? '#ff9800' : '#4caf50';
                
                // Create custom icon
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background: ${color};
                        width: ${20 + (pin.enrollment / 300)}px;
                        height: ${20 + (pin.enrollment / 300)}px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 10px;
                    ">${pin.pin.slice(-3)}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                
                // Create marker
                const marker = L.marker([coords.lat, coords.lng], { icon: icon });
                
                // Create popup content
                const popupContent = `
                    <div class="popup-title">PIN ${pin.pin}</div>
                    <div class="popup-detail"><strong>District:</strong> ${pin.district}</div>
                    <div class="popup-detail"><strong>Risk Level:</strong> <span style="color: ${color}; font-weight: 600;">${pin.risk.toUpperCase()}</span></div>
                    <div class="popup-detail"><strong>Total Enrollment:</strong> ${pin.enrollment.toLocaleString()}</div>
                    <div class="popup-detail"><strong>Growth Rate:</strong> ${pin.growth}%</div>
                    <div class="popup-detail"><strong>Border Pushbacks:</strong> ${pin.borderPushbacks}</div>
                    <button onclick="showPinDetail('${pin.pin}')" style="
                        margin-top: 10px;
                        padding: 6px 12px;
                        background: #2c5282;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.85rem;
                    ">View Details</button>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(markersLayer);
            });
            
            // Add border line (approximate Assam-Bangladesh border)
            const borderLine = [
                [26.5, 89.8],
                [26.3, 89.9],
                [26.0, 90.0],
                [25.5, 90.5],
                [24.8, 92.0],
                [24.5, 92.5]
            ];
            
            const border = L.polyline(borderLine, {
                color: '#d84315',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(map);
            
            border.bindPopup('<strong>International Border</strong><br>Assam-Bangladesh Border');
            
            // Force map to recalculate size
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 100);
            
            // Setup map controls
            setupMapControls();
            
            // Render legend
            renderMapLegend();
            
            // Render stats
            renderMapStats();
            
        } catch (error) {
            console.error('Error initializing map:', error);
            container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #d84315;">Error loading map: ${error.message}</div>`;
        }
    }, 200);
}

function setupMapControls() {
    document.getElementById('showBorderLines').addEventListener('change', (e) => {
        // Toggle border visibility (would need to store border reference)
        alert('Border line toggle: ' + (e.target.checked ? 'ON' : 'OFF'));
    });
    
    document.getElementById('showHeatmap').addEventListener('change', (e) => {
        if (e.target.checked) {
            addHeatmapLayer();
        } else {
            removeHeatmapLayer();
        }
    });
    
    document.getElementById('clusterMarkers').addEventListener('change', (e) => {
        if (e.target.checked) {
            enableMarkerClustering();
        } else {
            disableMarkerClustering();
        }
    });
}

function addHeatmapLayer() {
    // Create circle markers for heat effect
    sampleData.pins.forEach(pin => {
        const coords = getPinCoordinates(pin.pin, pin.district);
        const radius = pin.enrollment / 50;
        const opacity = pin.risk === 'high' ? 0.4 : pin.risk === 'medium' ? 0.25 : 0.15;
        
        L.circle([coords.lat, coords.lng], {
            radius: radius * 1000,
            fillColor: pin.risk === 'high' ? '#f44336' : pin.risk === 'medium' ? '#ff9800' : '#4caf50',
            fillOpacity: opacity,
            stroke: false
        }).addTo(map);
    });
}

function removeHeatmapLayer() {
    // Would remove heat circles (need to store references)
    map.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
            map.removeLayer(layer);
        }
    });
}

function enableMarkerClustering() {
    alert('Marker clustering enabled (requires Leaflet.markercluster plugin in production)');
}

function disableMarkerClustering() {
    alert('Marker clustering disabled');
}

function renderMapLegend() {
    const legend = document.getElementById('mapLegend');
    
    legend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background: #f44336;"></div>
            <span>High Risk (${sampleData.pins.filter(p => p.risk === 'high').length} PINs)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #ff9800;"></div>
            <span>Medium Risk (${sampleData.pins.filter(p => p.risk === 'medium').length} PINs)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #4caf50;"></div>
            <span>Low Risk (${sampleData.pins.filter(p => p.risk === 'low').length} PINs)</span>
        </div>
        <div class="legend-item">
            <div style="width: 20px; height: 2px; background: #d84315; border-top: 2px dashed #d84315;"></div>
            <span>International Border</span>
        </div>
        <div class="legend-item">
            <span style="font-size: 0.85rem; color: #666;">Marker size indicates enrollment volume</span>
        </div>
    `;
}

function renderMapStats() {
    const container = document.getElementById('mapStats');
    
    const totalEnrollment = sampleData.pins.reduce((sum, p) => sum + p.enrollment, 0);
    const avgEnrollment = Math.round(totalEnrollment / sampleData.pins.length);
    const maxEnrollment = Math.max(...sampleData.pins.map(p => p.enrollment));
    const borderPINs = sampleData.pins.filter(p => p.borderPushbacks > 30).length;
    
    container.innerHTML = `
        <div class="map-stat-item">
            <div class="map-stat-label">Total Enrollment</div>
            <div class="map-stat-value">${totalEnrollment.toLocaleString()}</div>
        </div>
        <div class="map-stat-item">
            <div class="map-stat-label">Average per PIN</div>
            <div class="map-stat-value">${avgEnrollment.toLocaleString()}</div>
        </div>
        <div class="map-stat-item">
            <div class="map-stat-label">Highest Enrollment</div>
            <div class="map-stat-value">${maxEnrollment.toLocaleString()}</div>
        </div>
        <div class="map-stat-item">
            <div class="map-stat-label">Border Activity PINs</div>
            <div class="map-stat-value" style="color: #d84315;">${borderPINs}</div>
        </div>
    `;
}

