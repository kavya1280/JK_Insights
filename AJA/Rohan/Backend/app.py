from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import os
import zipfile
import io
import traceback
import shutil
import json
from datetime import datetime, timezone, timedelta
import time as _time
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

# ══════════════════════════════════════════════════════════════════════════════
# CORS — FIXED (supports_credentials=True + origins="*" is invalid per spec)
# ══════════════════════════════════════════════════════════════════════════════
CORS(app,
     resources={r"/*": {"origins": "*"}},
     supports_credentials=False,
     allow_headers=["Content-Type", "X-Username", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# ──────────────────────────────────────────────────────────────────────────────
# BASE DIRECTORIES
# ──────────────────────────────────────────────────────────────────────────────
DATA_DIR     = "Data"
OUTPUT_DIR   = "Output"
SESSIONS_DIR = "Sessions"
os.makedirs(DATA_DIR,     exist_ok=True)
os.makedirs(OUTPUT_DIR,   exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)

def get_user_workspace(base_dir, username):
    user_dir = os.path.join(base_dir, username)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

# ──────────────────────────────────────────────────────────────────────────────
# PERSISTENT USERS FILE  (replaces in-memory MOCK_USERS)
# ──────────────────────────────────────────────────────────────────────────────
USERS_FILE = "users.json"

DEFAULT_USERS = [
    {"id": "1", "username": "admin",     "password": "password123", "role": "admin",    "status": "Active"},
    {"id": "2", "username": "uploader",  "password": "password123", "role": "uploader", "status": "Active"},
    {"id": "3", "username": "reviewer",  "password": "password123", "role": "reviewer", "status": "Active"},
    {"id": "4", "username": "viewer",    "password": "password123", "role": "viewer",   "status": "Active"},
    {"id": "5", "username": "uploader2", "password": "password123", "role": "uploader", "status": "Active"},
]

def load_users():
    if not os.path.exists(USERS_FILE):
        save_users(DEFAULT_USERS)
        return DEFAULT_USERS
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        save_users(DEFAULT_USERS)
        return DEFAULT_USERS

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def get_next_id(users):
    if not users:
        return "1"
    return str(max(int(u["id"]) for u in users) + 1)

# ──────────────────────────────────────────────────────────────────────────────
# USER SESSION LOGGING
# ──────────────────────────────────────────────────────────────────────────────
USER_SESSIONS_FILE   = "user_sessions.json"
SESSION_EXPIRY_HOURS = 24

def load_user_sessions():
    if not os.path.exists(USER_SESSIONS_FILE):
        return []
    try:
        with open(USER_SESSIONS_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def save_user_sessions(sessions):
    with open(USER_SESSIONS_FILE, "w") as f:
        json.dump(sessions, f, indent=2)

def record_login(username, role):
    sessions = load_user_sessions()
    now_local     = datetime.now().astimezone()
    session_token = now_local.isoformat()
    sessions.append({
        "username":      username,
        "role":          role,
        "login_time":    session_token,
        "logout_time":   None,
        "logout_reason": None,
        "expired":       False,
        "activity_log":  [],
    })
    save_user_sessions(sessions)
    return session_token

def record_logout(username, session_token, reason="manual"):
    sessions  = load_user_sessions()
    now_local = datetime.now().astimezone().isoformat()
    for s in reversed(sessions):
        if s["username"] == username and s["login_time"] == session_token and s["logout_time"] is None:
            s["logout_time"]   = now_local
            s["logout_reason"] = reason
            s["expired"]       = (reason == "expired")
            break
    save_user_sessions(sessions)

def is_session_valid(username, session_token):
    sessions = load_user_sessions()
    for s in sessions:
        if s["username"] == username and s["login_time"] == session_token:
            if s["logout_time"] is not None:
                return False
            login_dt = datetime.fromisoformat(s["login_time"])
            if datetime.now().astimezone() - login_dt > timedelta(hours=SESSION_EXPIRY_HOURS):
                record_logout(username, session_token, reason="expired")
                return False
            return True
    return False

# ──────────────────────────────────────────────────────────────────────────────
# ACTIVITY LOGGING
# ──────────────────────────────────────────────────────────────────────────────
ACTIVITY_LOG_FILE = "activity_log.json"

def load_activity_log():
    if not os.path.exists(ACTIVITY_LOG_FILE):
        return []
    try:
        with open(ACTIVITY_LOG_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def save_activity_log(log):
    with open(ACTIVITY_LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)

def log_activity(username, role, action, details=""):
    log = load_activity_log()
    log.append({
        "timestamp": datetime.now().astimezone().isoformat(),
        "username":  username,
        "role":      role,
        "action":    action,
        "details":   details,
    })
    save_activity_log(log)

# ──────────────────────────────────────────────────────────────────────────────
# INSIGHT / FILE MAPS
# ──────────────────────────────────────────────────────────────────────────────
SKIP_ROWS_MAP = {
    "PJPA10": 5, "PJPA13": 5, "PJPA14": 5, "PJPA16": 5, "PJPA18": 5,
    "PJPA19": 5, "PJPA20": 5, "PJPA21": 5, "PJPA22": 5, "PJPA23": 5, "PJPA24": 5,
    "PJPA27": 5, "PJPA28": 5, "PJPA29": 5, "PJPA30": 4, "PJPA31": 4,
    "PJPA32": 5, "PJPA33": 4, "PJPA34": 5, "PJPA35": 4, "PJPA36": 5,
    "PJPA38": 4, "PJPA39": 4, "PJPA40": 4,
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
    "PJPA38": "PJPA38_Generated.xlsx", "PJPA39": "PJPA39_Generated.xlsx",
    "PJPA40": "PJPA40_Generated.xlsx",
}

# ══════════════════════════════════════════════════════════════════════════════
# REGISTER BLUEPRINTS
# Note: /api/upload is defined directly below (avoids trailing-slash 308 issue)
# ══════════════════════════════════════════════════════════════════════════════
app.register_blueprint(upload_bp,    url_prefix='/api/upload')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(pjpa27_bp,    url_prefix='/api/pjpa27')
app.register_blueprint(pjpa28_bp,    url_prefix='/api/pjpa28')
app.register_blueprint(pjpa32_bp,    url_prefix='/api/pjpa32')
app.register_blueprint(pjpa33_bp,    url_prefix='/api/pjpa33')
app.register_blueprint(pjpa34_bp,    url_prefix='/api/pjpa34')
app.register_blueprint(pjpa35_bp,    url_prefix='/api/pjpa35')
app.register_blueprint(pjpa37_bp,    url_prefix='/api/pjpa37')
app.register_blueprint(pjpa38_bp,    url_prefix='/api/pjpa38')
app.register_blueprint(pjpa39_bp,    url_prefix='/api/pjpa39')
app.register_blueprint(pjpa40_bp,    url_prefix='/api/pjpa40')

# ══════════════════════════════════════════════════════════════════════════════
# FILE UPLOAD  — /api/upload
# ──────────────────────────────────────────────────────────────────────────────
# Defined directly on app (not via blueprint) to avoid the trailing-slash
# redirect that breaks CORS preflights.
# Supports: .xlsx, .xls, .csv, .zip  (ZIP is unpacked and merged automatically)
# ══════════════════════════════════════════════════════════════════════════════
EXPECTED_FILENAMES = {
    "concurFile":   "Concur_Header_Data.xlsx",
    "leftEmpFile":  "Left_Employees.xlsx",
    "empMasterFile":"Employee_Master.xlsx",
    "lineItemFile": "Line_Item_Data.xlsx",
}

def load_smart_dataframe(file_bytes, filename):
    """Read CSV / XLS / XLSX from raw bytes — used for both direct uploads and ZIP contents."""
    file_lower = filename.lower()
    if file_lower.endswith('.csv'):
        try:
            return pd.read_csv(io.BytesIO(file_bytes), low_memory=False, encoding='utf-8')
        except UnicodeDecodeError:
            return pd.read_csv(io.BytesIO(file_bytes), low_memory=False, encoding='latin1')
    elif file_lower.endswith('.xls'):
        return pd.read_excel(io.BytesIO(file_bytes), engine='xlrd')
    else:
        return pd.read_excel(io.BytesIO(file_bytes), engine='openpyxl')

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_files():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        username      = request.headers.get("X-Username", "default")
        user_data_dir = get_user_workspace(DATA_DIR, username)

        if not request.files:
            return jsonify({"status": "error", "message": "No files provided."}), 400

        # ── Save each uploaded file (with ZIP support) ────────────────────────
        for key, expected_name in EXPECTED_FILENAMES.items():
            if key not in request.files:
                continue
            file = request.files[key]
            if not file.filename:
                continue

            save_path = os.path.join(user_data_dir, expected_name)

            if file.filename.lower().endswith('.zip'):
                # Unpack ZIP → merge all CSVs/spreadsheets inside into one xlsx
                dfs = []
                with zipfile.ZipFile(file, 'r') as z:
                    for info in z.infolist():
                        if (not info.filename.startswith('__MACOSX') and
                                info.filename.lower().endswith(('.csv', '.xlsx', '.xls'))):
                            with z.open(info) as f:
                                dfs.append(load_smart_dataframe(f.read(), info.filename))
                if dfs:
                    print(f"📦 ZIP: merging {len(dfs)} file(s) for '{key}'")
                    pd.concat(dfs, ignore_index=True).to_excel(save_path, index=False)
                else:
                    return jsonify({"status": "error",
                                    "message": f"No valid data files found in ZIP for '{key}'."}), 400
            else:
                df = load_smart_dataframe(file.read(), file.filename)
                df.to_excel(save_path, index=False)

        # ── KPI EXTRACTION ────────────────────────────────────────────────────
        # All keys must match exactly what Uploader.jsx renderKPIView() expects:
        #   Concur  → total_transactions, unique_employees, total_amount,
        #             average_claim, unique_reports
        #   Master  → master_unique_employees, master_active_employees,
        #             master_separated_employees, master_company_codes
        kpis = {
            'total_transactions':       0,
            'unique_employees':         0,
            'total_amount':             0.0,
            'average_claim':            0.0,
            'unique_reports':           0,
            'master_unique_employees':  0,
            'master_separated_employees': 0,
            'master_active_employees':  0,
            'master_company_codes':     0,
        }

# Concur Header KPIs
        if 'concurFile' in request.files:
            concur_path = os.path.join(user_data_dir, EXPECTED_FILENAMES["concurFile"])
            if os.path.exists(concur_path):
                try:
                    df_c = pd.read_excel(concur_path)
                    df_c.rename(columns=lambda x: str(x).strip(), inplace=True)
                    kpis['total_transactions'] = len(df_c)
                    
                    if 'Employee ID' in df_c.columns:
                        kpis['unique_employees'] = int(df_c['Employee ID'].nunique())
                    
                    if 'Amount Approved' in df_c.columns:
                        total_amt = float(pd.to_numeric(df_c['Amount Approved'], errors='coerce').fillna(0).sum())
                        kpis['total_amount']  = round(total_amt, 2)
                        kpis['average_claim'] = round(total_amt / kpis['total_transactions'], 2) if kpis['total_transactions'] > 0 else 0.0
                    
                    rep_col = 'Report Id' if 'Report Id' in df_c.columns else ('Report ID' if 'Report ID' in df_c.columns else None)
                    if rep_col:
                        kpis['unique_reports'] = int(df_c[rep_col].nunique())
                except Exception as e:
                    print(f"Error calculating Concur KPIs: {e}")

        # Employee Master KPIs
        if 'empMasterFile' in request.files:
            emp_path = os.path.join(user_data_dir, EXPECTED_FILENAMES["empMasterFile"])
            if os.path.exists(emp_path):
                try:
                    df_e = pd.read_excel(emp_path)
                    df_e.rename(columns=lambda x: str(x).strip(), inplace=True)
                    
                    id_col = 'Employee ID(Only ALPHA NUM)' if 'Employee ID(Only ALPHA NUM)' in df_e.columns else 'Supplier'
                    if id_col not in df_e.columns and len(df_e.columns) > 1:
                        id_col = df_e.columns[1] 
                    
                    if id_col in df_e.columns:
                        df_e['Emp_ID_Clean'] = df_e[id_col].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
                        kpis['master_unique_employees'] = int(df_e['Emp_ID_Clean'].nunique())
                        
                        if 'Employee Status' in df_e.columns:
                            df_e['Status_Clean'] = df_e['Employee Status'].astype(str).str.strip().str.upper()
                            separated_emps = df_e[df_e['Status_Clean'] != 'ACTIVE']['Emp_ID_Clean'].unique()
                            kpis['master_separated_employees'] = len(separated_emps)
                            kpis['master_active_employees'] = kpis['master_unique_employees'] - kpis['master_separated_employees']
                    
                    if 'Company Code' in df_e.columns:
                        kpis['master_company_codes'] = int(df_e['Company Code'].nunique())
                        
                except Exception as e:
                    print(f"Error calculating Employee Master KPIs: {e}")

        users = load_users()
        user  = next((u for u in users if u["username"] == username), None)
        role  = user["role"] if user else "uploader"
        log_activity(username, role, "FILE_UPLOAD", f"Uploaded: {', '.join(request.files.keys())}")

        return jsonify({
            "status":  "success",
            "message": "Files uploaded successfully!",
            "kpis":    kpis,
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

# ══════════════════════════════════════════════════════════════════════════════
# INSIGHT GENERATION  — /api/generate
# Called by Uploader.jsx startAnalysis() for each selected insight
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/api/generate', methods=['POST'])
def generate_insights():
    try:
        data              = request.get_json()
        selected_insights = data.get('insights', [])
        username          = request.headers.get("X-Username", "default")

        if not selected_insights:
            return jsonify({"status": "error", "message": "No insights selected."}), 400

        run_selected_insights(selected_insights, username=username)

        users = load_users()
        user  = next((u for u in users if u["username"] == username), None)
        role  = user["role"] if user else "uploader"
        log_activity(username, role, "RUN_INSIGHTS",
                     f"Generated: {', '.join(selected_insights)}")

        return jsonify({"status": "success", "message": "Generation complete."}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# INSIGHT DATA FETCH  — /api/insight/<id>/data
# Called by Uploader.jsx after generate to load results into the UI
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/api/insights', methods=['GET'])
def get_insights_list():
    return jsonify([{"id": k, "name": v} for k, v in FILE_MAP.items()])

@app.route('/api/insight/<insight_id>/data', methods=['GET'])
def get_insight_data_by_id(insight_id):
    try:
        username     = request.headers.get("X-Username", "default")
        user_out_dir = get_user_workspace(OUTPUT_DIR, username)

        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404

        filename = FILE_MAP[insight_id]

        if isinstance(filename, dict):
            combined_data = {}
            for key, f in filename.items():
                fp = os.path.join(user_out_dir, f)
                if not os.path.exists(fp):
                    return jsonify({"status": "error",
                                    "message": f"Data not generated yet for '{key}'."}), 404
                df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[key] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        fp = os.path.join(user_out_dir, filename)
        if not os.path.exists(fp):
            return jsonify({"status": "error",
                            "message": "Data not generated yet. Please upload master data first."}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(fp, sheet_name='Anomalies (30-42)',
                               skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id,
                            "data": df.fillna("N/A").to_dict(orient='records')})

        excel_file = pd.ExcelFile(fp)
        if len(excel_file.sheet_names) > 1:
            combined_data = {}
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(fp, sheet_name=sheet,
                                   skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[sheet] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
        df.columns = df.columns.astype(str)
        return jsonify({"status": "success", "insight_id": insight_id,
                        "data": df.fillna("N/A").to_dict(orient='records')})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    username = data.get('username')
    password = data.get('password')
    users    = load_users()
    user     = next((u for u in users
                     if u['username'] == username and u['password'] == password), None)
    if user:
        if user['status'] == 'Inactive':
            return jsonify({"message": "Account is inactive."}), 403
        session_token = record_login(username, user['role'])
        log_activity(username, user['role'], "LOGIN", "Logged in successfully")
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        safe_user['session_token'] = session_token
        safe_user['login_time']    = session_token
        return jsonify(safe_user), 200
    return jsonify({"message": "Invalid username or password"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    data          = request.get_json() or {}
    username      = data.get('username')
    session_token = data.get('session_token')
    reason        = data.get('reason', 'manual')
    if not username or not session_token:
        return jsonify({"message": "Missing username or session_token."}), 400
    record_logout(username, session_token, reason=reason)
    users = load_users()
    user  = next((u for u in users if u['username'] == username), None)
    role  = user['role'] if user else 'unknown'
    log_activity(username, role, "LOGOUT", f"Reason: {reason}")
    return jsonify({"message": "Logged out successfully.", "reason": reason}), 200

@app.route('/validate_session', methods=['POST'])
def validate_session():
    data          = request.get_json() or {}
    username      = data.get('username')
    session_token = data.get('session_token')
    if not username or not session_token:
        return jsonify({"valid": False, "message": "Missing fields."}), 400
    if is_session_valid(username, session_token):
        return jsonify({"valid": True}), 200
    return jsonify({"valid": False, "message": "Session expired or invalid."}), 401

# ══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT (CRUD) — persistent users.json
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/get_users', methods=['GET'])
def get_users():
    users = load_users()
    return jsonify(users), 200 

@app.route('/add_user', methods=['POST'])
def add_user():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role     = data.get('role', 'viewer')
    status   = data.get('status', 'Active')
    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400
    users = load_users()
    if any(u['username'].lower() == username.lower() for u in users):
        return jsonify({"message": f"Username '{username}' already exists."}), 409
    new_user = {"id": get_next_id(users), "username": username,
                "password": password, "role": role, "status": status}
    users.append(new_user)
    save_users(users)
    log_activity("admin", "admin", "USER_CREATED",
                 f"Created user '{username}' with role '{role}'")
    return jsonify({k: v for k, v in new_user.items() if k != 'password'}), 201

@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    data  = request.get_json()
    users = load_users()
    user  = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({"message": "User not found."}), 404
    new_username = data.get('username', user['username']).strip()
    if any(u['username'].lower() == new_username.lower() and u['id'] != user_id for u in users):
        return jsonify({"message": f"Username '{new_username}' already exists."}), 409
    old_username   = user['username']
    user['username'] = new_username
    user['role']     = data.get('role',   user['role'])
    user['status']   = data.get('status', user['status'])
    if data.get('password'):
        user['password'] = data['password']
        log_activity(
            user['username'],
            user['role'],
            "PASSWORD_CHANGED",
            f"Password updated for user '{user['username']}'"
        )
    save_users(users)
    log_activity("admin", "admin", "USER_UPDATED",
                 f"Updated user '{old_username}' → '{new_username}'")
    return jsonify({k: v for k, v in user.items() if k != 'password'}), 200

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    users = load_users()
    user  = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({"message": "User not found."}), 404
    if (user['role'] == 'admin' and
            len([u for u in users if u['role'] == 'admin']) <= 1):
        return jsonify({"message": "Cannot delete the last admin."}), 400
    users = [u for u in users if u['id'] != user_id]
    save_users(users)
    log_activity("admin", "admin", "USER_DELETED",
                 f"Deleted user '{user['username']}'")
    return jsonify({"message": "User deleted successfully."}), 200

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN MONITORING ROUTES
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/admin/activity_log', methods=['GET'])
def get_activity_log():
    log         = load_activity_log()
    date_filter = request.args.get('date')
    if date_filter:
        log = [e for e in log if e['timestamp'].startswith(date_filter)]
    log.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(log), 200

@app.route('/admin/sessions_summary', methods=['GET'])
def sessions_summary():
    sessions = load_user_sessions()
    sessions.sort(key=lambda x: x['login_time'], reverse=True)
    return jsonify(sessions), 200

@app.route('/admin/daily_report', methods=['GET'])
def daily_report():
    today          = datetime.now().astimezone().strftime('%Y-%m-%d')
    log            = load_activity_log()
    today_log      = [e for e in log if e['timestamp'].startswith(today)]
    sessions       = load_user_sessions()
    today_sessions = [s for s in sessions if s['login_time'].startswith(today)]
    user_summary   = {}
    for entry in today_log:
        u = entry['username']
        if u not in user_summary:
            user_summary[u] = {"username": u, "role": entry['role'], "actions": []}
        user_summary[u]['actions'].append({
            "time":    entry['timestamp'],
            "action":  entry['action'],
            "details": entry['details'],
        })
    return jsonify({
        "date":            today,
        "total_logins":    len([e for e in today_log if e['action'] == 'LOGIN']),
        "active_sessions": len([s for s in today_sessions if s['logout_time'] is None]),
        "total_events":    len(today_log),
        "user_summaries":  list(user_summary.values()),
        "raw_log":         today_log,
    }), 200

@app.route('/log_activity', methods=['POST'])
def log_activity_endpoint():
    data = request.get_json() or {}
    log_activity(data.get('username', 'unknown'), data.get('role', 'unknown'),
                 data.get('action', 'UNKNOWN'), data.get('details', ''))
    return jsonify({"status": "ok"}), 200

# ══════════════════════════════════════════════════════════════════════════════
# SESSION PERSISTENCE
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/api/save-session', methods=['POST'])
def save_session():
    try:
        username           = request.headers.get("X-Username", "default")
        user_sess_dir      = get_user_workspace(SESSIONS_DIR, username)
        user_out_dir       = get_user_workspace(OUTPUT_DIR,   username)
        req_data           = request.get_json() or {}
        requested_insights = req_data.get('insights', [])
        now_local          = datetime.now().astimezone()
        session_id         = f"session_{now_local.strftime('%Y%m%d_%H%M%S')}"
        session_path       = os.path.join(user_sess_dir, session_id)
        os.makedirs(session_path, exist_ok=True)

        files_saved       = []
        insights_to_check = requested_insights if requested_insights else FILE_MAP.keys()

        for insight_id in insights_to_check:
            if insight_id not in FILE_MAP:
                continue
            filename = FILE_MAP[insight_id]
            if isinstance(filename, dict):
                saved_all = True
                for key, f in filename.items():
                    src = os.path.join(user_out_dir, f)
                    if os.path.exists(src):
                        shutil.copy(src, os.path.join(session_path, f))
                    else:
                        saved_all = False
                if saved_all:
                    files_saved.append(insight_id)
            else:
                src = os.path.join(user_out_dir, filename)
                if os.path.exists(src):
                    shutil.copy(src, os.path.join(session_path, filename))
                    files_saved.append(insight_id)

        metadata = {
            "id":        session_id,
            "timestamp": now_local.isoformat(),
            "insights":  files_saved,
            "name":      req_data.get("name",
                         f"Audit Session {now_local.strftime('%d %b %Y %H:%M')}"),
        }
        with open(os.path.join(session_path, "metadata.json"), "w") as f:
            json.dump(metadata, f)

        users = load_users()
        user  = next((u for u in users if u['username'] == username), None)
        role  = user['role'] if user else 'uploader'
        log_activity(username, role, "SAVE_SESSION",
                     f"Saved session: {metadata['name']}")

        return jsonify({"status": "success", "session": metadata}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    try:
        username = request.headers.get("X-Username", "default")
        users    = load_users()
        user_o   = next((u for u in users if u["username"] == username), None)
        role     = user_o["role"] if user_o else "uploader"

        all_sessions = []
        
        # If Viewer, Reviewer, or Admin, they should see sessions from everyone
        if role.lower() in ["viewer", "reviewer", "admin"]:
            if os.path.exists(SESSIONS_DIR):
                for user_folder in os.listdir(SESSIONS_DIR):
                    user_path = os.path.join(SESSIONS_DIR, user_folder)
                    if os.path.isdir(user_path):
                        for sess_folder in os.listdir(user_path):
                            meta_path = os.path.join(user_path, sess_folder, "metadata.json")
                            if os.path.exists(meta_path):
                                with open(meta_path, "r") as f:
                                    try:
                                        sess_meta = json.load(f)
                                        # Add info about who created it
                                        sess_meta["creator"] = user_folder
                                        all_sessions.append(sess_meta)
                                    except: pass
        else:
            # Regular uploaders only see their own
            user_sess_dir = os.path.join(SESSIONS_DIR, username)
            if os.path.exists(user_sess_dir):
                for folder in os.listdir(user_sess_dir):
                    meta_path = os.path.join(user_sess_dir, folder, "metadata.json")
                    if os.path.exists(meta_path):
                        with open(meta_path, "r") as f:
                            try:
                                sess_meta = json.load(f)
                                sess_meta["creator"] = username
                                all_sessions.append(sess_meta)
                            except: pass

        all_sessions.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify(all_sessions), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        username      = request.headers.get("X-Username", "default")
        user_sess_dir = get_user_workspace(SESSIONS_DIR, username)
        session_path  = os.path.join(user_sess_dir, session_id)
        if os.path.exists(session_path):
            shutil.rmtree(session_path)
            return jsonify({"status": "success", "message": "Session deleted."}), 200
        return jsonify({"status": "error", "message": "Session not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions/<session_id>/<insight_id>/data', methods=['GET'])
def get_session_data(session_id, insight_id):
    try:
        username = request.headers.get("X-Username", "default")
        
        # Determine the user folder for this session
        # First check current user's folder
        user_sess_dir = os.path.join(SESSIONS_DIR, username)
        target_path = os.path.join(user_sess_dir, session_id)
        
        if not os.path.exists(target_path):
            # For Viewers/Reviewers/Admins, search globally
            users = load_users()
            user_o = next((u for u in users if u["username"] == username), None)
            role = user_o["role"] if user_o else "uploader"
            
            if role.lower() in ["viewer", "reviewer", "admin"]:
                found = False
                if os.path.exists(SESSIONS_DIR):
                    for user_folder in os.listdir(SESSIONS_DIR):
                        candidate = os.path.join(SESSIONS_DIR, user_folder, session_id)
                        if os.path.exists(candidate):
                            user_sess_dir = os.path.join(SESSIONS_DIR, user_folder)
                            target_path = candidate
                            found = True
                            break
                if not found:
                    return jsonify({"status": "error", "message": "Session not found"}), 404
            else:
                return jsonify({"status": "error", "message": "Session not found"}), 404

        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404

        filename = FILE_MAP[insight_id]

        if isinstance(filename, dict):
            combined_data = {}
            for key, f in filename.items():
                fp = os.path.join(user_sess_dir, session_id, f)
                if not os.path.exists(fp):
                    return jsonify({"status": "error",
                                    "message": "Data not found in this session"}), 404
                df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[key] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        fp = os.path.join(user_sess_dir, session_id, filename)
        if not os.path.exists(fp):
            return jsonify({"status": "error",
                            "message": "Data not found in this session"}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(fp, sheet_name='Anomalies (30-42)',
                               skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id,
                            "data": df.fillna("N/A").to_dict(orient='records')})

        excel_file = pd.ExcelFile(fp)
        if len(excel_file.sheet_names) > 1:
            combined_data = {}
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(fp, sheet_name=sheet,
                                   skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[sheet] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
        df.columns = df.columns.astype(str)
        return jsonify({"status": "success", "insight_id": insight_id,
                        "data": df.fillna("N/A").to_dict(orient='records')})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/clear-session', methods=['POST'])
def clear_session():
    try:
        username      = request.headers.get("X-Username", "default")
        user_data_dir = get_user_workspace(DATA_DIR,   username)
        user_out_dir  = get_user_workspace(OUTPUT_DIR, username)
        for d in [user_data_dir, user_out_dir]:
            for fname in os.listdir(d):
                fp = os.path.join(d, fname)
                if os.path.isfile(fp):
                    os.remove(fp)
        return jsonify({"status": "success", "message": "Backend session cleared."}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)