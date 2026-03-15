# 📊 Temporal Inflow Anomaly Tracker

> A professional analytics dashboard for detecting unusual Aadhaar enrollment spikes in Assam border PIN codes using statistical anomaly detection and predictive analytics.

---

## What It Does

Analyzes Aadhaar enrollment data across border PIN codes to identify suspicious spikes before policy deadlines, visualized through interactive maps, heatmaps, and time-series charts.

---

## Key Features

- 🔴 **PIN-wise Risk Heatmap** - color-coded green/yellow/red risk levels
- 📈 **Anomaly Detection** - statistical outlier identification with sensitivity controls
- 🗺️ **Geographic Map** - Leaflet.js map of Assam-Bangladesh border PIN locations
- 🔮 **Predictive Analytics** - future enrollment trend forecasting
- 👥 **Age Analysis** - demographic breakdown by age group
- 📋 **Report Generator** - export reports in multiple formats
- 🔔 **Alert System** - configurable threshold breach notifications
- 📤 **CSV Upload** - flexible data import with automatic parsing

---

## Tech Stack

- **Frontend** - HTML5, CSS3, Vanilla JavaScript
- **Mapping** - Leaflet.js
- **Data** - CSV with flexible column parsing
- **No build process required** - runs directly in browser

---

## Quick Start

```bash
git clone https://github.com/tanishaphukan/temporal-inflow-anomaly-tracker.git
cd temporal-inflow-anomaly-tracker

# Just open in browser
open index.html
```

---

## CSV Format

```csv
Date,State,District,Pincode,Age 0 5,Age 5 17,Age 18 Greater
15-01-2024,Assam,Dhubri,783301,120,340,890
```

---

## Future Scope

Real-time data feeds · ML-based pattern recognition · Multi-state support · PDF report export
