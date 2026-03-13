from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import os
import zipfile
import io
import traceback
import shutil
import json
from datetime import datetime

# Import the updated orchestrator function
from main_orchestrator import run_selected_insights 

from routes.upload import upload_bp
from routes.dashboard import dashboard_bp
from routes.pjpa27 import pjpa27_bp
from routes.pjpa28 import pjpa28_bp
from routes.pjpa32 import pjpa32_bp
from routes.pjpa33 import pjpa33_bp
from routes.pjpa34 import pjpa34_bp
from routes.pjpa35 import pjpa35_bp
from routes.pjpa37 import pjpa37_bp
from routes.pjpa38 import pjpa38_bp
from routes.pjpa39 import pjpa39_bp
from routes.pjpa40 import pjpa40_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True) 

DATA_DIR = r"Data"
OUTPUT_DIR = r"Output"
SESSIONS_DIR = r"Sessions"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)

SKIP_ROWS_MAP = {
    "PJPA10": 5, "PJPA13": 5, "PJPA14": 5, "PJPA16": 5, "PJPA18": 5, 
    "PJPA19": 5, "PJPA20": 5, "PJPA21": 5, "PJPA22": 5, "PJPA23": 5, "PJPA24": 5,
    "PJPA27": 5, "PJPA28": 5, "PJPA29": 5, "PJPA30": 4, "PJPA31": 4,
    "PJPA32": 5, "PJPA33": 4, "PJPA34": 5, "PJPA35": 4, "PJPA36": 5, "PJPA38": 4, "PJPA39": 4, "PJPA40": 4
}

FILE_MAP = {
    "PJPA10": "PJPA10_Generated.xlsx", "PJPA13": "PJPA13_Generated.xlsx",
    "PJPA14": "PJPA14_Generated.xlsx", "PJPA16": "PJPA16_Generated.xlsx",
    "PJPA18": "PJPA18_Generated.xlsx", "PJPA19": "PJPA19_Generated.xlsx",
    "PJPA20": "PJPA20_Generated.xlsx", "PJPA21": "PJPA21_Generated.xlsx",
    "PJPA22": "PJPA22_Generated.xlsx", "PJPA23": "PJPA23_Generated.xlsx",
    "PJPA24": "PJPA24_Generated.xlsx",
    "PJPA27": "PJPA27_Generated.xlsx", "PJPA28": "PJPA28_Generated.xlsx",
    "PJPA29": "PJPA29_Generated.xlsx", "PJPA30": "PJPA30_Generated.xlsx",
    "PJPA31": "PJPA31_Generated.xlsx", 
    "PJPA32": {"holiday": "PJPA32_Holiday_Generated.xlsx", "weekend": "PJPA32_Weekend_Generated.xlsx"},
    "PJPA33": "PJPA33_Generated.xlsx", "PJPA34": "PJPA34_Generated.xlsx", 
    "PJPA35": "PJPA35_Generated.xlsx", "PJPA36": "PJPA36_Generated.xlsx",
    "PJPA38": "PJPA38_Generated.xlsx", "PJPA39": "PJPA39_Generated.xlsx", "PJPA40": "PJPA40_Generated.xlsx"
}

MOCK_USERS = [
    {"id": "1", "username": "admin", "password": "password123", "role": "admin", "status": "Active"},
    {"id": "2", "username": "uploader", "password": "password123", "role": "uploader", "status": "Active"},
    {"id": "3", "username": "reviewer", "password": "password123", "role": "reviewer", "status": "Active"},
    {"id": "4", "username": "viewer", "password": "password123", "role": "viewer", "status": "Active"}
]

# Register Blueprints
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(pjpa27_bp, url_prefix='/api/pjpa27')
app.register_blueprint(pjpa28_bp, url_prefix='/api/pjpa28')
app.register_blueprint(pjpa32_bp, url_prefix='/api/pjpa32')
app.register_blueprint(pjpa33_bp, url_prefix='/api/pjpa33')
app.register_blueprint(pjpa34_bp, url_prefix='/api/pjpa34')
app.register_blueprint(pjpa35_bp, url_prefix='/api/pjpa35')
app.register_blueprint(pjpa37_bp, url_prefix='/api/pjpa37')
app.register_blueprint(pjpa38_bp, url_prefix='/api/pjpa38')
app.register_blueprint(pjpa39_bp, url_prefix='/api/pjpa39')
app.register_blueprint(pjpa40_bp, url_prefix='/api/pjpa40')

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

EXPECTED_FILENAMES = {
    "concurFile": "Concur_Header_Data.xlsx",
    "leftEmpFile": "Left_Employees.xlsx",
    "empMasterFile": "Employee_Master.xlsx",
    "lineItemFile": "Line_Item_Data.xlsx",
}


# ==========================================
# HELPER: SMART DATA READER
# ==========================================
def load_smart_dataframe(file_bytes, filename):
    file_lower = filename.lower()
    if file_lower.endswith('.csv'):
        try:
            return pd.read_csv(io.BytesIO(file_bytes), low_memory=False, encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(io.BytesIO(file_bytes), low_memory=False, encoding='latin1')
    elif file_lower.endswith('.xls'):
        # For older Excel files (.xls) -> Use xlrd
        return pd.read_excel(io.BytesIO(file_bytes), engine='xlrd')
    else:
        # For standard Excel files (.xlsx) -> Use openpyxl
        return pd.read_excel(io.BytesIO(file_bytes), engine='openpyxl')


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
                                        # Use the smart helper to handle engines and encodings!
                                        df = load_smart_dataframe(file_bytes, file_info.filename)
                                        dfs.append(df)
                        if dfs:
                            print(f"📦 Concatenating {len(dfs)} files for {key}...")
                            combined_df = pd.concat(dfs, ignore_index=True)
                            combined_df.to_excel(save_path, index=False)
                        else:
                            return jsonify({"status": "error", "message": f"No valid data files found inside the ZIP for {key}."}), 400
                    else:
                        file_bytes = file.read()
                        df = load_smart_dataframe(file_bytes, file.filename)
                        df.to_excel(save_path, index=False)

        # ==========================================
        # KPI GENERATION FOR UPLOAD SCREEN
        # ==========================================
        kpis = {
            'total_transactions': 0, 'unique_employees': 0, 'total_amount': 0.0,
            'average_claim': 0.0, 'unique_reports': 0, 'master_unique_employees': 0,
            'master_separated_employees': 0, 'master_active_employees': 0, 'master_company_codes': 0
        }
        
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

@app.route('/api/generate', methods=['POST'])
def generate_insights():
    try:
        data = request.get_json()
        selected_insights = data.get('insights', [])
        
        if not selected_insights:
            return jsonify({"status": "error", "message": "No insights selected."}), 400
        
        run_selected_insights(selected_insights)
        return jsonify({"status": "success", "message": "Generation complete."}), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/insights', methods=['GET'])
def get_insights_list():
    insights = [{"id": k, "name": v} for k, v in FILE_MAP.items()]
    return jsonify(insights)

@app.route('/api/insight/<insight_id>/data', methods=['GET'])
def get_insight_data(insight_id):
    try:
        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404

        filename = FILE_MAP[insight_id]
        
        # Handle explicitly dual-file insights (like PJPA32)
        if isinstance(filename, dict):
            combined_data = {}
            for key, f in filename.items():
                file_path = os.path.join(OUTPUT_DIR, f)
                if not os.path.exists(file_path):
                    return jsonify({"status": "error", "message": f"Data not generated yet for {key}."}), 404
                df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP[insight_id])
                df.columns = df.columns.astype(str)
                combined_data[key] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        # Handle standard single files
        file_path = os.path.join(OUTPUT_DIR, filename)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "Data not generated yet. Please upload master data first."}), 404

        # Specific logic for Benford's Law which uses a specific sheet
        if insight_id == "PJPA28":
            df = pd.read_excel(file_path, sheet_name='Anomalies', skiprows=SKIP_ROWS_MAP[insight_id])
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})

        # MULTI-SHEET DYNAMIC READER (Perfect for PJPA10, 13, 14, 16, 18)
        excel_file = pd.ExcelFile(file_path)
        if len(excel_file.sheet_names) > 1:
            combined_data = {}
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[sheet] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})
        else:
            # Single sheet fallback
            df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/save-session', methods=['POST'])
def save_session():
    try:
        from datetime import datetime, timezone
        req_data = request.get_json()
        data = req_data if req_data else {}
        
        # EXACT FIX: Get the strict list of insights the frontend wants to save
        requested_insights = data.get('insights', [])
        
        now_utc = datetime.now(timezone.utc)
        session_id = f"session_{now_utc.strftime('%Y%m%d_%H%M%S')}"
        session_path = os.path.join(SESSIONS_DIR, session_id)
        os.makedirs(session_path, exist_ok=True)
        
        files_saved = []
        
        # ONLY loop through the requested insights, ignore other ghost files in the Output folder
        insights_to_check = requested_insights if requested_insights else FILE_MAP.keys()

        for insight_id in insights_to_check:
            if insight_id not in FILE_MAP:
                continue
                
            filename = FILE_MAP[insight_id]
            if isinstance(filename, dict):
                saved_all = True
                for key, f in filename.items():
                    src_path = os.path.join(OUTPUT_DIR, f)
                    if os.path.exists(src_path):
                        shutil.copy(src_path, os.path.join(session_path, f))
                    else:
                        saved_all = False
                if saved_all: 
                    files_saved.append(insight_id)
            else:
                src_path = os.path.join(OUTPUT_DIR, filename)
                if os.path.exists(src_path):
                    shutil.copy(src_path, os.path.join(session_path, filename))
                    files_saved.append(insight_id)
        
        metadata = {
            "id": session_id,
            "timestamp": now_utc.isoformat(),
            "insights": files_saved,
            "name": data.get("name", f"Audit Session {now_utc.strftime('%d %b %Y %H:%M')} (UTC)")
        }
        with open(os.path.join(session_path, "metadata.json"), "w") as f:
            json.dump(metadata, f)
            
        return jsonify({"status": "success", "session": metadata}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
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

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        session_path = os.path.join(SESSIONS_DIR, session_id)
        if os.path.exists(session_path):
            shutil.rmtree(session_path)
            return jsonify({"status": "success", "message": "Session deleted."}), 200
        else:
            return jsonify({"status": "error", "message": "Session not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/sessions/<session_id>/<insight_id>/data', methods=['GET'])
def get_session_data(session_id, insight_id):
    try:
        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404
            
        filename = FILE_MAP[insight_id]
        
        # Handle dual-file insights
        if isinstance(filename, dict):
            combined_data = {}
            for key, f in filename.items():
                file_path = os.path.join(SESSIONS_DIR, session_id, f)
                if not os.path.exists(file_path):
                    return jsonify({"status": "error", "message": "Data not found in this session"}), 404
                df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[key] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        # Handle standard single files
        file_path = os.path.join(SESSIONS_DIR, session_id, filename)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "Data not found in this session"}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(file_path, sheet_name='Anomalies (30-42)', skiprows=SKIP_ROWS_MAP[insight_id])
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})

        # MULTI-SHEET DYNAMIC READER
        excel_file = pd.ExcelFile(file_path)
        if len(excel_file.sheet_names) > 1:
            combined_data = {}
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[sheet] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})
        else:
            df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})
            
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
