
# NAEVIS
### Vehicle Maintenance Prediction System

NAEVIS is a vehicle maintenance prediction application that uses a trained XGBoost machine learning model to classify vehicle conditions and provide maintenance recommendations.

## Technologies Used

- Python
- Flask REST API
- XGBoost
- Pandas
- Scikit-learn
- HTML, CSS, and JavaScript
- Chart.js (if used by the frontend)

## Project Structure

```text
NAEVIS/
├── Backend/
│   ├── app.py
│   ├── naevis_xgboost_model.json
│   ├── naevis_preprocessor.pkl
│   └── naevis_label_encoder.pkl
├── Frontend/
│   ├── NAEVIS.html
│   ├── script.js
│   └── style.css
├── .gitignore
└── README.md
```

## Requirements

- Python 3.12 recommended
- pip
- Git

## Setup Instructions

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Create and activate a Python virtual environment.
4. Install the backend dependencies from `Backend/requirements.txt`.
5. Start the Flask API.
6. Serve the frontend using a local web server and open `Frontend/NAEVIS.html`.

## Running Locally

Start the backend from the Backend directory:

```bash
python app.py
```

The local API currently runs at:

`http://127.0.0.1:5000`

Serve the frontend separately using a local web server.

## Machine Learning Model

NAEVIS uses a trained XGBoost classifier and saved preprocessing and label-encoding artifacts to generate vehicle condition predictions.

## Deployment

Deployment instructions and the public application URL will be added after hosting is configured.

## Project Status

Final submission preparation and deployment in progress.
