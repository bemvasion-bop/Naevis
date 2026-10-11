// NAEVIS Backend API
const API_URL = "http://127.0.0.1:5000/predict";

let probabilityChart;
let featureChart;


// --------------------------------------------------
// Probability Chart
// --------------------------------------------------

function createProbabilityChart() {
    const ctx = document.getElementById("probabilityChart");

    probabilityChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: [
                "Good Condition",
                "Monitor",
                "Needs Maintenance"
            ],
            datasets: [{
                data: [0, 0, 0],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#8fa2ba",
                        padding: 18
                    }
                }
            }
        }
    });
}


// --------------------------------------------------
// Feature Chart
// --------------------------------------------------

function createFeatureChart() {
    const ctx = document.getElementById("featureChart");

    featureChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "Mileage",
                "Fuel",
                "Temperature",
                "Maintenance",
                "Usage",
                "Load",
                "Age",
                "Breakdown"
            ],
            datasets: [{
                label: "Input Value",
                data: [0, 0, 0, 0, 0, 0, 0, 0],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: "#8fa2ba"
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#8fa2ba"
                    },
                    grid: {
                        color: "#21334c"
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#8fa2ba"
                    }
                }
            }
        }
    });
}


// --------------------------------------------------
// Get Form Data
// --------------------------------------------------

function getFormData() {
    return {
        vehicle_type: document.getElementById("vehicle_type").value,
        mileage: document.getElementById("mileage").value,
        fuel_consumption: document.getElementById("fuel_consumption").value,
        engine_temperature: document.getElementById("engine_temperature").value,
        maintenance_history: document.getElementById("maintenance_history").value,
        usage_frequency: document.getElementById("usage_frequency").value,
        load_weight: document.getElementById("load_weight").value,
        vehicle_age: document.getElementById("vehicle_age").value,
        breakdown_history: document.getElementById("breakdown_history").value
    };
}


// --------------------------------------------------
// Send Data to NAEVIS Model
// --------------------------------------------------

async function runAssessment() {

    const data = getFormData();

    // Show temporary loading state
    document.getElementById("predictionLabel").textContent =
        "Analyzing...";

    document.getElementById("predictionText").textContent =
        "The NAEVIS model is analyzing the vehicle data.";

    document.getElementById("resultIcon").textContent =
        "...";

    document.getElementById("recommendationText").textContent =
        "Please wait while the model generates a recommendation.";

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // Check if Flask returned an HTTP error
        if (!response.ok) {

            const errorData = await response.json().catch(() => ({}));

            throw new Error(
                errorData.error ||
                `Server returned status ${response.status}`
            );
        }

        const result = await response.json();

        console.log("NAEVIS prediction:", result);

        // Update the dashboard with the real model result
        updateResults(result);

        // Update feature chart using entered values
        updateFeatureChart(data);

        // Scroll to results
        document.getElementById("results").scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {

        console.error("NAEVIS API error:", error);

        document.getElementById("predictionLabel").textContent =
            "Prediction Error";

        document.getElementById("predictionText").textContent =
            "Unable to connect to the NAEVIS prediction service.";

        document.getElementById("resultIcon").textContent =
            "!";

        document.getElementById("recommendationText").textContent =
            "Please make sure the NAEVIS Flask backend is running on http://127.0.0.1:5000.";

        alert(
            "Unable to connect to the NAEVIS backend.\n\n" +
            "Make sure app.py is running."
        );
    }
}


// --------------------------------------------------
// Update Prediction Results
// --------------------------------------------------

function updateResults(result) {

    const prediction = result.prediction;

    // Prediction label
    document.getElementById("predictionLabel").textContent =
        prediction;

    // Prediction description
    if (prediction === "Good Condition") {

        document.getElementById("predictionText").textContent =
            "The vehicle is currently classified as being in good condition.";

        document.getElementById("resultIcon").textContent =
            "✓";

    } else if (prediction === "Monitor") {

        document.getElementById("predictionText").textContent =
            "The vehicle should be monitored closely for possible maintenance concerns.";

        document.getElementById("resultIcon").textContent =
            "!";

    } else if (prediction === "Needs Maintenance") {

        document.getElementById("predictionText").textContent =
            "The vehicle requires maintenance attention based on the model prediction.";

        document.getElementById("resultIcon").textContent =
            "!";

    } else {

        document.getElementById("predictionText").textContent =
            "The NAEVIS model returned a prediction.";

        document.getElementById("resultIcon").textContent =
            "?";
    }


    // --------------------------------------------------
    // Update Probability Chart
    // --------------------------------------------------

    if (result.probabilities && probabilityChart) {

        probabilityChart.data.datasets[0].data = [

            result.probabilities["Good Condition"] || 0,

            result.probabilities["Monitor"] || 0,

            result.probabilities["Needs Maintenance"] || 0

        ];

        probabilityChart.update();
    }


    // --------------------------------------------------
    // Update Recommendation
    // --------------------------------------------------

    document.getElementById("recommendationText").textContent =
        result.recommendation ||
        "No recommendation was returned by the backend.";
}


// --------------------------------------------------
// Update Feature Chart
// --------------------------------------------------

function updateFeatureChart(data) {

    if (!featureChart) {
        return;
    }

    featureChart.data.datasets[0].data = [

        Number(data.mileage) || 0,

        Number(data.fuel_consumption) || 0,

        Number(data.engine_temperature) || 0,

        Number(data.maintenance_history) || 0,

        Number(data.usage_frequency) || 0,

        Number(data.load_weight) || 0,

        Number(data.vehicle_age) || 0,

        Number(data.breakdown_history) || 0

    ];

    featureChart.update();
}


// --------------------------------------------------
// Update Input Summary
// --------------------------------------------------

function updateSummary() {

    const fields = [
        "vehicle_type",
        "mileage",
        "fuel_consumption",
        "engine_temperature",
        "maintenance_history",
        "usage_frequency",
        "load_weight",
        "vehicle_age",
        "breakdown_history"
    ];

    fields.forEach(field => {

        const element = document.getElementById(field);
        const summaryElement = document.getElementById("sum_" + field);

        if (element && summaryElement) {

            summaryElement.textContent =
                element.value || "-";
        }
    });
}


// --------------------------------------------------
// Clear Form
// --------------------------------------------------

function clearForm() {

    document.getElementById("assessmentForm").reset();

    updateSummary();

    document.getElementById("predictionLabel").textContent =
        "Awaiting Assessment";

    document.getElementById("predictionText").textContent =
        "Run an assessment to receive the vehicle condition prediction.";

    document.getElementById("resultIcon").textContent =
        "?";

    document.getElementById("recommendationText").textContent =
        "Run an assessment to receive maintenance guidance from the NAEVIS model.";

    // Reset probability chart
    if (probabilityChart) {

        probabilityChart.data.datasets[0].data =
            [0, 0, 0];

        probabilityChart.update();
    }

    // Reset feature chart
    if (featureChart) {

        featureChart.data.datasets[0].data =
            [0, 0, 0, 0, 0, 0, 0, 0];

        featureChart.update();
    }
}


// --------------------------------------------------
// Navigation
// --------------------------------------------------

function goTo(sectionId) {

    document.getElementById(sectionId).scrollIntoView({
        behavior: "smooth"
    });
}


// --------------------------------------------------
// Form Events
// --------------------------------------------------

document
    .getElementById("assessmentForm")
    .addEventListener("input", updateSummary);


document
    .getElementById("assessmentForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        // Run the REAL NAEVIS model
        runAssessment();
    });


// --------------------------------------------------
// Initialize Dashboard
// --------------------------------------------------

createProbabilityChart();
createFeatureChart();
updateSummary();