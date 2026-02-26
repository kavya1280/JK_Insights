from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import os
from werkzeug.utils import secure_filename

# Import your orchestrator function
from main_orchestrator import run_all_insights 

app = Flask(__name__)
# Enable CORS so your React app on port 5173 can talk to Flask on port 5000
CORS(app) 

# --- CONFIGURATION ---
DATA_DIR = r"Data"
OUTPUT_DIR = r"Output"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- 1. MOCK DATABASE FOR AUTHENTICATION ---
MOCK_USERS = [
    {"id": "1", "username": "admin", "password": "password123", "role": "admin", "status": "Active"},
    {"id": "2", "username": "uploader", "password": "password123", "role": "uploader", "status": "Active"},
    {"id": "3", "username": "reviewer", "password": "password123", "role": "reviewer", "status": "Active"},
    {"id": "4", "username": "viewer", "password": "password123", "role": "viewer", "status": "Active"}
]

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = next((u for u in MOCK_USERS if u['username'] == username and u['password'] == password), None)
    
    if user:
        if user['status'] == 'Inactive':
            return jsonify({"message": "Account is inactive."}), 403
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        return jsonify(safe_user), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

@app.route('/get_users', methods=['GET'])
def get_users():
    safe_users = [{k: v for k, v in u.items() if k != 'password'} for u in MOCK_USERS]
    return jsonify(safe_users), 200

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    global MOCK_USERS
    MOCK_USERS = [u for u in MOCK_USERS if u['id'] != user_id]
    return jsonify({"message": "User deleted successfully"}), 200

# --- 2. FILE UPLOAD & ORCHESTRATION ---
EXPECTED_FILENAMES = {
    "concurFile": "Combined SAP Concor Data.xlsx - Combined SAP Concor Data.csv",
    "leftEmpFile": "Engagement Master Format - Audit (1) (2).xlsx - List of left employees.csv",
    "empMasterFile": "Employee Master_ZEMPMASTER_2Feb2026.xlsx - Sheet1.csv",
    "lineItemFile": "Combined all car and bike expenses - Limited.xlsx - Sheet1.csv"
}

@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        if not request.files:
            return jsonify({"status": "error", "message": "No files provided."}), 400

        # Save uploaded files with the exact names the orchestrator expects
        for key, expected_name in EXPECTED_FILENAMES.items():
            if key in request.files:
                file = request.files[key]
                if file.filename != '':
                    save_path = os.path.join(DATA_DIR, expected_name)
                    file.save(save_path)

        # Trigger batch processing now that new data is available
        run_all_insights()

        return jsonify({"status": "success", "message": "Files uploaded and processed successfully!"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 3. DATA PIPELINE ENDPOINTS ---
SKIP_ROWS_MAP = {
    "PJPA27": 5, "PJPA28": 4, "PJPA29": 5, "PJPA30": 4, "PJPA31": 4,
    "PJPA32_HOL": 5, "PJPA32_WE": 5, "PJPA33": 4, "PJPA34": 5, "PJPA35": 4
}

FILE_MAP = {
    "PJPA27": "PJPA27_Generated.xlsx", "PJPA28": "PJPA28_Generated.xlsx",
    "PJPA29": "PJPA29_Generated.xlsx", "PJPA30": "PJPA30_Generated.xlsx",
    "PJPA31": "PJPA31_Generated.xlsx", "PJPA32_HOL": "PJPA32_Holiday_Generated.xlsx",
    "PJPA32_WE": "PJPA32_Weekend_Generated.xlsx", "PJPA33": "PJPA33_Generated.xlsx",
    "PJPA34": "PJPA34_Generated.xlsx", "PJPA35": "PJPA35_Generated.xlsx"
}

@app.route('/api/insights', methods=['GET'])
def get_insights_list():
    insights = [{"id": k, "name": v} for k, v in FILE_MAP.items()]
    return jsonify(insights)

@app.route('/api/insight/<insight_id>/data', methods=['GET'])
def get_insight_data(insight_id):
    try:
        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404
            
        file_path = os.path.join(OUTPUT_DIR, FILE_MAP[insight_id])
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "Data not generated yet. Please upload master data first."}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(file_path, sheet_name='Summary Stats', skiprows=SKIP_ROWS_MAP[insight_id])
        else:
            df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP[insight_id])
            
        df = df.where(pd.notnull(df), None)
        return jsonify({"status": "success", "insight_id": insight_id, "data": df.to_dict(orient='records')})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/insight/<insight_id>/download', methods=['GET'])
def download_excel(insight_id):
    if insight_id not in FILE_MAP:
        return jsonify({"error": "File not found"}), 404
    file_path = os.path.join(OUTPUT_DIR, FILE_MAP[insight_id])
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "File not generated yet"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)