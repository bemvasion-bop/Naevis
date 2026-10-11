
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client
from xgboost import XGBClassifier
import pandas as pd
import joblib
import os
import math

# --------------------------------------------------
# Flask application
# --------------------------------------------------

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# Environment variables and Supabase connection
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_KEY in the root .env file."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------------------------------------------
# Load trained NAEVIS files
# --------------------------------------------------

MODEL_PATH = os.path.join(BASE_DIR, "naevis_xgboost_model.json")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "naevis_preprocessor.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "naevis_label_encoder.pkl")

model = XGBClassifier()
model.load_model(MODEL_PATH)

preprocessor = joblib.load(PREPROCESSOR_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)

print("NAEVIS model loaded successfully!")
print("Target classes:", list(label_encoder.classes_))
print("Supabase client initialized successfully!")


# --------------------------------------------------
# Home / health check
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "NAEVIS API is running!",
        "model": "XGBoost",
        "database": "Supabase",
        "status": "ready"
    })


# --------------------------------------------------
# Prediction endpoint
# --------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict) or not data:
            return jsonify({"error": "Please provide vehicle data as JSON."}), 400

        required_fields = [
            "vehicle_type",
            "mileage",
            "fuel_consumption",
            "engine_temperature",
            "maintenance_history",
            "usage_frequency",
            "load_weight",
            "vehicle_age",
            "breakdown_history"
        ]

        missing_fields = [
            field for field in required_fields
            if field not in data or data[field] is None
            or data[field] == ""
        ]

        if missing_fields:
            return jsonify({
                "error": "Missing required fields.",
                "fields": missing_fields
            }), 400

        # Build input using the original model feature names
        numeric_fields = required_fields[1:]

        input_values = {"vehicle_type": str(data["vehicle_type"]).strip()}

        for field in numeric_fields:
            try:
                value = float(data[field])
            except (TypeError, ValueError):
                return jsonify({
                    "error": f"{field} must be a valid number."
                }), 400

            if not math.isfinite(value) or value < 0:
                return jsonify({
                    "error": f"{field} must be a finite, non-negative number."
                }), 400

            input_values[field] = value

        input_data = pd.DataFrame([input_values])

        # Apply trained preprocessing
        processed_data = preprocessor.transform(input_data)

        # Predict vehicle condition
        prediction_encoded = model.predict(processed_data)[0]
        prediction = str(
            label_encoder.inverse_transform([prediction_encoded])[0]
        )

        # Calculate class probabilities
        probabilities_raw = model.predict_proba(processed_data)[0]

        probabilities = {
            str(label): round(float(probability * 100), 2)
            for label, probability
            in zip(label_encoder.classes_, probabilities_raw)
        }

        # Generate recommendation
        recommendations = {
            "Good Condition": (
                "The vehicle is currently in good condition. "
                "Continue regular inspections and preventive maintenance "
                "according to the recommended maintenance schedule."
            ),
            "Monitor": (
                "The vehicle should be monitored closely. "
                "Consider scheduling an inspection and checking "
                "maintenance-related indicators to prevent further issues."
            ),
            "Needs Maintenance": (
                "The vehicle requires maintenance attention. "
                "A maintenance inspection is recommended as soon as possible "
                "to identify and address potential issues."
            )
        }

        recommendation = recommendations.get(
            prediction,
            "No specific recommendation is available for this prediction."
        )

        # Save input and prediction to Supabase
        assessment = {
            **input_values,
            "prediction": prediction,
            "probabilities": probabilities,
            "recommendation": recommendation,
            "source": "manual"
        }

        supabase.table("vehicle_assessments").insert(
            assessment
        ).execute()

        # Return result to the frontend
        return jsonify({
            "prediction": prediction,
            "probabilities": probabilities,
            "recommendation": recommendation,
            "saved": True
        })

    except (TypeError, ValueError):
        return jsonify({
            "error": "Please enter valid numeric values for all vehicle measurements."
        }), 400

    except Exception:
        app.logger.exception("Prediction or database operation failed.")
        return jsonify({
            "error": "The assessment could not be completed or saved. Check the backend terminal."
        }), 500


# --------------------------------------------------
# Run Flask server locally
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )
