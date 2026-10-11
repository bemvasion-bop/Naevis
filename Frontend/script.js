
// NAEVIS Backend API
const API_URL = "https://naevis-api.onrender.com/predict";

let probabilityChart;
let featureChart;

// --------------------------------------------------
// Probability Chart
// --------------------------------------------------

function createProbabilityChart() {
    const canvas = document.getElementById("probabilityChart");

    if (!canvas) {
        console.error("Missing canvas: probabilityChart");
        return;
    }

    probabilityChart = new Chart(canvas, {
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
    const canvas = document.getElementById("featureChart");

    if (!canvas) {
        console.error("Missing canvas: featureChart");
        return;
    }

    featureChart = new Chart(canvas, {
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

    const predictionLabel = document.getElementById("predictionLabel");
    const predictionText = document.getElementById("predictionText");
    const resultIcon = document.getElementById("resultIcon");
    const recommendationText = document.getElementById("recommendationText");

    predictionLabel.textContent = "Analyzing...";
    predictionText.textContent = "The NAEVIS model is analyzing the vehicle data.";
    resultIcon.textContent = "...";
    recommendationText.textContent = "Please wait while the model generates a recommendation.";

    try {
        console.log("Sending NAEVIS assessment to:", API_URL);
        console.log("Vehicle input:", data);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // Read the response body once
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.error ||
                result.message ||
                `Backend returned HTTP ${response.status}.`
            );
        }

        if (!result.prediction) {
            throw new Error("The backend response did not contain a prediction.");
        }

        console.log("NAEVIS prediction response:", result);

        // Update dashboard
        updateResults(result);
        updateFeatureChart(data);

        // Update input summary
        updateSummary();

        // Scroll to results
        const resultsSection = document.getElementById("results");

        if (resultsSection) {
            resultsSection.scrollIntoView({
                behavior: "smooth"
            });
        }

        // Warn if the API returned a prediction but did not confirm saving
        if (result.saved === false) {
            console.warn("Prediction returned, but saving was not confirmed.");
        }

    } catch (error) {
        console.error("NAEVIS request failed:", error);

        predictionLabel.textContent = "Assessment Failed";
        resultIcon.textContent = "!";
        predictionText.textContent = error.message;
        recommendationText.textContent =
            "The assessment could not be completed. Check the browser console and Flask terminal for details.";

        // Only show the connection-specific message for network failures
        if (error instanceof TypeError) {
            predictionText.textContent =
                "Could not reach the backend. Check that Flask is running at http://127.0.0.1:5000 and inspect the browser console for network or CORS errors.";
        }

        alert(
            "NAEVIS assessment failed.\n\n" +
            error.message +
            "\n\nCheck the browser console (F12) and the Flask terminal for details."
        );
    }
}

// --------------------------------------------------
// Update Prediction Results
// --------------------------------------------------

function updateResults(result) {
    const prediction = result.prediction;

    document.getElementById("predictionLabel").textContent = prediction;

    if (prediction === "Good Condition") {
        document.getElementById("predictionText").textContent =
            "The vehicle is currently classified as being in good condition.";

        document.getElementById("resultIcon").textContent = "✓";

    } else if (prediction === "Monitor") {
        document.getElementById("predictionText").textContent =
            "The vehicle should be monitored closely for possible maintenance concerns.";

        document.getElementById("resultIcon").textContent = "!";

    } else if (prediction === "Needs Maintenance") {
        document.getElementById("predictionText").textContent =
            "The vehicle requires maintenance attention based on the model prediction.";

        document.getElementById("resultIcon").textContent = "!";

    } else {
        document.getElementById("predictionText").textContent =
            "The NAEVIS model returned a prediction.";

        document.getElementById("resultIcon").textContent = "?";
    }

    // Update probability chart
    if (result.probabilities && probabilityChart) {
        probabilityChart.data.datasets[0].data = [
            result.probabilities["Good Condition"] || 0,
            result.probabilities["Monitor"] || 0,
            result.probabilities["Needs Maintenance"] || 0
        ];

        probabilityChart.update();
    }

    // Update recommendation
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
            summaryElement.textContent = element.value || "-";
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

    document.getElementById("resultIcon").textContent = "?";

    document.getElementById("recommendationText").textContent =
        "Run an assessment to receive maintenance guidance from the NAEVIS model.";

    if (probabilityChart) {
        probabilityChart.data.datasets[0].data = [0, 0, 0];
        probabilityChart.update();
    }

    if (featureChart) {
        featureChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0, 0, 0];
        featureChart.update();
    }
}

// --------------------------------------------------
// Navigation
// --------------------------------------------------

function goTo(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
        section.scrollIntoView({
            behavior: "smooth"
        });
    }
}

// --------------------------------------------------
// Initialize Dashboard and Form Events
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("assessmentForm");

    if (!form) {
        console.error("NAEVIS form not found: assessmentForm");
        return;
    }

    form.addEventListener("input", updateSummary);

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        runAssessment();
    });

    createProbabilityChart();
    createFeatureChart();
    updateSummary();

    console.log("NAEVIS frontend initialized.");
});
