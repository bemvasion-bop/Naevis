from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
from xgboost import XGBClassifier
import os


# --------------------------------------------------
# Flask application
# --------------------------------------------------

app = Flask(__name__)
CORS(app)


# --------------------------------------------------
# Load trained NAEVIS files
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "naevis_xgboost_model.json")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "naevis_preprocessor.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "naevis_label_encoder.pkl")


# Load the XGBoost model from its native JSON format
model = XGBClassifier()
model.load_model(MODEL_PATH)

# Load preprocessing and target label encoder
preprocessor = joblib.load(PREPROCESSOR_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)


print("NAEVIS model loaded successfully!")
print("Target classes:", list(label_encoder.classes_))


# --------------------------------------------------
# Home / health check
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "NAEVIS API is running!",
        "model": "XGBoost",
        "status": "ready"
    })


# --------------------------------------------------
# Prediction endpoint
# --------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():

    try:
        # Get JSON data from frontend
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received."
            }), 400


        # --------------------------------------------------
        # Create DataFrame using the SAME feature names
        # used during model training
        # --------------------------------------------------

        input_data = pd.DataFrame([{
            "vehicle_type": data.get("vehicle_type"),

            "mileage": float(data.get("mileage")),
            "fuel_consumption": float(data.get("fuel_consumption")),
            "engine_temperature": float(data.get("engine_temperature")),
            "maintenance_history": float(data.get("maintenance_history")),
            "usage_frequency": float(data.get("usage_frequency")),
            "load_weight": float(data.get("load_weight")),
            "vehicle_age": float(data.get("vehicle_age")),
            "breakdown_history": float(data.get("breakdown_history"))
        }])


        # --------------------------------------------------
        # Apply the SAME preprocessing used during training
        # --------------------------------------------------

        processed_data = preprocessor.transform(input_data)


        # --------------------------------------------------
        # Make prediction
        # --------------------------------------------------

        prediction_encoded = model.predict(processed_data)[0]

        prediction = label_encoder.inverse_transform(
            [prediction_encoded]
        )[0]


        # --------------------------------------------------
        # Get prediction probabilities
        # --------------------------------------------------

        probabilities_raw = model.predict_proba(processed_data)[0]

        probabilities = {
            label: round(float(probability * 100), 2)
            for label, probability
            in zip(label_encoder.classes_, probabilities_raw)
        }


        # --------------------------------------------------
        # Generate recommendation
        # --------------------------------------------------

        if prediction == "Good Condition":

            recommendation = (
                "The vehicle is currently in good condition. "
                "Continue regular inspections and preventive maintenance "
                "according to the recommended maintenance schedule."
            )

        elif prediction == "Monitor":

            recommendation = (
                "The vehicle should be monitored closely. "
                "Consider scheduling an inspection and checking "
                "maintenance-related indicators to prevent further issues."
            )

        elif prediction == "Needs Maintenance":

            recommendation = (
                "The vehicle requires maintenance attention. "
                "A maintenance inspection is recommended as soon as possible "
                "to identify and address potential issues."
            )

        else:

            recommendation = (
                "No specific recommendation is available for this prediction."
            )


        # --------------------------------------------------
        # Return result to frontend
        # --------------------------------------------------

        return jsonify({
            "prediction": prediction,
            "probabilities": probabilities,
            "recommendation": recommendation
        })


    except Exception as e:

        print("Prediction error:", str(e))

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Run Flask server
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )