// Sample data for demonstration
let sampleData = {
    pins: [],
    timeSeriesData: [],
    policyTimeline: [],
    pinDetails: {},
    rawData: []
};

let dataLoaded = false;

// Generate sample template data
function generateSampleTemplate() {
    return [
        { Date: '01-09-2025', State: 'Assam', District: 'Bajali', Pincode: '781375', 'Age 0 5': 1, 'Age 5 17': 0, 'Age 18 Greater': 0 },
        { Date: '01-09-2025', State: 'Assam', District: 'Baksa', Pincode: '781315', 'Age 0 5': 6, 'Age 5 17': 1, 'Age 18 Greater': 0 },
        { Date: '01-09-2025', State: 'Assam', District: 'Baksa', Pincode: '781340', 'Age 0 5': 1, 'Age 5 17': 0, 'Age 18 Greater': 0 },
        { Date: '01-08-2025', State: 'Assam', District: 'Bajali', Pincode: '781375', 'Age 0 5': 2, 'Age 5 17': 1, 'Age 18 Greater': 1 },
        { Date: '01-08-2025', State: 'Assam', District: 'Baksa', Pincode: '781315', 'Age 0 5': 8, 'Age 5 17': 2, 'Age 18 Greater': 1 }
    ];
}
