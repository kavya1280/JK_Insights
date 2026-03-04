from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import os
import zipfile
import io
import traceback
from werkzeug.utils import secure_filename
import shutil
import json
from datetime import datetime

# Import the updated orchestrator function
from main_orchestrator import run_selected_insights 

app = Flask(__name__)
CORS(app) 

DATA_DIR = r"Data"
OUTPUT_DIR = r"Output"
SESSIONS_DIR = r"Sessions"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)

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

# CLEANED FILENAMES: Now Pandas knows they are definitely Excel files!
EXPECTED_FILENAMES = {
    "concurFile": "Concur_Header_Data.xlsx",
    "leftEmpFile": "Left_Employees.xlsx",
    "empMasterFile": "Employee_Master.xlsx",
    "lineItemFile": "Line_Item_Data.xlsx"
}


@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        if not request.files:
            return jsonify({"status": "error", "message": "No files provided."}), 400

        for key, expected_name in EXPECTED_FILENAMES.items():
            if key in request.files:
                file = request.files[key]
                if file.filename != '':
                    save_path = os.path.join(DATA_DIR, expected_name)
                    
                    if file.filename.lower().endswith('.zip'):
                        dfs = []
                        with zipfile.ZipFile(file, 'r') as z:
                            for file_info in z.infolist():
                                if not file_info.filename.startswith('__MACOSX') and file_info.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
                                    with z.open(file_info) as f:
                                        file_bytes = f.read()
                                        if file_info.filename.lower().endswith('.csv'):
                                            try:
                                                df = pd.read_csv(io.BytesIO(file_bytes), low_memory=False)
                                            except UnicodeDecodeError:
                                                df = pd.read_csv(io.BytesIO(file_bytes), encoding='latin1', low_memory=False)
                                        else:
                                            df = pd.read_excel(io.BytesIO(file_bytes))
                                        dfs.append(df)
                        if dfs:
                            combined_df = pd.concat(dfs, ignore_index=True)
                            combined_df.to_excel(save_path, index=False)
                        else:
                            return jsonify({"status": "error", "message": f"No valid data files found inside the ZIP for {key}."}), 400
                    else:
                        file.save(save_path)

        # ==========================================
        # NEW: KPI GENERATION FOR UPLOAD SCREEN
        # ==========================================
        kpis = {
            'total_transactions': 0,
            'unique_employees': 0,
            'total_amount': 0.0,
            'average_claim': 0.0,
            'unique_reports': 0,
            'master_unique_employees': 0,
            'master_separated_employees': 0,
            'master_active_employees': 0,
            'master_company_codes': 0
        }
        
        # 1. Concur Header KPIs - ONLY run if Concur file was just uploaded!
        if 'concurFile' in request.files:
            concur_path = os.path.join(DATA_DIR, EXPECTED_FILENAMES["concurFile"])
            if os.path.exists(concur_path):
                try:
                    df_concur = pd.read_excel(concur_path)
                    df_concur.rename(columns=lambda x: str(x).strip(), inplace=True)
                    
                    kpis['total_transactions'] = len(df_concur)
                    if 'Employee ID' in df_concur.columns:
                        kpis['unique_employees'] = int(df_concur['Employee ID'].nunique())
                    if 'Amount Approved' in df_concur.columns:
                        total_amt = float(pd.to_numeric(df_concur['Amount Approved'], errors='coerce').fillna(0).sum())
                        kpis['total_amount'] = total_amt
                        kpis['average_claim'] = total_amt / kpis['total_transactions'] if kpis['total_transactions'] > 0 else 0
                    
                    rep_col = 'Report Id' if 'Report Id' in df_concur.columns else ('Report ID' if 'Report ID' in df_concur.columns else None)
                    if rep_col:
                        kpis['unique_reports'] = int(df_concur[rep_col].nunique())
                except Exception as e:
                    print(f"Error calculating Concur KPIs: {e}")

        # 2. Employee Master KPIs - ONLY run if Emp Master file was just uploaded!
        if 'empMasterFile' in request.files:
            emp_path = os.path.join(DATA_DIR, EXPECTED_FILENAMES["empMasterFile"])
            if os.path.exists(emp_path):
                try:
                    df_emp = pd.read_excel(emp_path)
                    df_emp.rename(columns=lambda x: str(x).strip(), inplace=True)
                    
                    id_col = 'Employee ID(Only ALPHA NUM)' if 'Employee ID(Only ALPHA NUM)' in df_emp.columns else 'Supplier'
                    if id_col not in df_emp.columns and len(df_emp.columns) > 1:
                        id_col = df_emp.columns[1] 
                    
                    if id_col in df_emp.columns:
                        df_emp['Emp_ID_Clean'] = df_emp[id_col].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
                        kpis['master_unique_employees'] = int(df_emp['Emp_ID_Clean'].nunique())
                        
                        if 'Employee Status' in df_emp.columns:
                            df_emp['Status_Clean'] = df_emp['Employee Status'].astype(str).str.strip().str.upper()
                            separated_emps = df_emp[df_emp['Status_Clean'] != 'ACTIVE']['Emp_ID_Clean'].unique()
                            kpis['master_separated_employees'] = len(separated_emps)
                            kpis['master_active_employees'] = kpis['master_unique_employees'] - kpis['master_separated_employees']
                    
                    if 'Company Code' in df_emp.columns:
                        kpis['master_company_codes'] = int(df_emp['Company Code'].nunique())
                        
                except Exception as e:
                    print(f"Error calculating Employee Master KPIs: {e}")

        return jsonify({"status": "success", "message": "Files uploaded successfully!", "kpis": kpis}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

# --- NEW ENDPOINT: Trigger specific insights ---
@app.route('/api/generate', methods=['POST'])
def generate_insights():
    try:
        data = request.get_json()
        selected_insights = data.get('insights', [])
        
        if not selected_insights:
            return jsonify({"status": "error", "message": "No insights selected."}), 400
        
        # Pass the list of requested modules to the orchestrator
        run_selected_insights(selected_insights)
        
        return jsonify({"status": "success", "message": "Generation complete."}), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

SKIP_ROWS_MAP = {
    "PJPA27": 5, "PJPA28": 5, "PJPA29": 5, "PJPA30": 4, "PJPA31": 4,
    "PJPA32_HOL": 5, "PJPA32_WE": 5, "PJPA33": 4, "PJPA34": 5, "PJPA35": 4, "PJPA36": 5, "PJPA38": 5, "PJPA39": 4, "PJPA40": 4
}

FILE_MAP = {
    "PJPA27": "PJPA27_Generated.xlsx", "PJPA28": "PJPA28_Generated.xlsx",
    "PJPA29": "PJPA29_Generated.xlsx", "PJPA30": "PJPA30_Generated.xlsx",
    "PJPA31": "PJPA31_Generated.xlsx", "PJPA32_HOL": "PJPA32_Holiday_Generated.xlsx",
    "PJPA32_WE": "PJPA32_Weekend_Generated.xlsx", "PJPA33": "PJPA33_Generated.xlsx",
    "PJPA34": "PJPA34_Generated.xlsx", "PJPA35": "PJPA35_Generated.xlsx", "PJPA36": "PJPA36_Generated.xlsx",
    "PJPA38": "PJPA38_Generated.xlsx", "PJPA39": "PJPA39_Generated.xlsx", "PJPA40": "PJPA40_Generated.xlsx"
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
            df = pd.read_excel(file_path, sheet_name='Anomalies (30-42)', skiprows=SKIP_ROWS_MAP[insight_id])
        else:
            df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP[insight_id])
            
        df.columns = df.columns.astype(str)
        df = df.fillna("N/A")
        
        return jsonify({"status": "success", "insight_id": insight_id, "data": df.to_dict(orient='records')})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/save-session', methods=['POST'])
def save_session():
    try:
        req_data = request.get_json()
        data = req_data if req_data else {}
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        session_path = os.path.join(SESSIONS_DIR, session_id)
        os.makedirs(session_path, exist_ok=True)
        
        # Copy files from Output to Session folder
        files_saved = []
        for insight_id, filename in FILE_MAP.items():
            src_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.exists(src_path):
                shutil.copy(src_path, os.path.join(session_path, filename))
                files_saved.append(insight_id)
        
        # Save metadata
        metadata = {
            "id": session_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "insights": files_saved,
            "name": data.get("name", f"Audit Session {datetime.now().strftime('%d %b %Y %H:%M')}")
        }
        with open(os.path.join(session_path, "metadata.json"), "w") as f:
            json.dump(metadata, f)
            
        return jsonify({"status": "success", "session": metadata}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    try:
        sessions = []
        if os.path.exists(SESSIONS_DIR):
            for folder in os.listdir(SESSIONS_DIR):
                meta_path = os.path.join(SESSIONS_DIR, folder, "metadata.json")
                if os.path.exists(meta_path):
                    with open(meta_path, "r") as f:
                        sessions.append(json.load(f))
        
        # Sort by timestamp descending
        sessions.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions/<session_id>/<insight_id>/data', methods=['GET'])
def get_session_data(session_id, insight_id):
    try:
        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404
            
        file_path = os.path.join(SESSIONS_DIR, session_id, FILE_MAP[insight_id])
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "Data not found in this session"}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(file_path, sheet_name='Anomalies (30-42)', skiprows=SKIP_ROWS_MAP[insight_id])
        else:
            df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP[insight_id])
            
        df.columns = df.columns.astype(str)
        df = df.fillna("N/A")
        
        return jsonify({"status": "success", "insight_id": insight_id, "data": df.to_dict(orient='records')})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/clear-session', methods=['POST'])
def clear_session():
    try:
        # Delete all files in the Data directory
        for filename in os.listdir(DATA_DIR):
            file_path = os.path.join(DATA_DIR, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                
        # Also clear the Output directory so old reports don't linger
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                
        return jsonify({"status": "success", "message": "Backend session cleared."}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)