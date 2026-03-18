from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
import os
import zipfile
import io
import traceback
import shutil
import json
from datetime import datetime, timezone, timedelta
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
# DATABASE CONFIGURATION & INITIALIZATION
# ══════════════════════════════════════════════════════════════════════════════
# TODO: Update 'postgres' and 'yourpassword' to match your local PG credentials
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:yourpassword@localhost:5432/jk_insights'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

CORS(app,
     resources={r"/*": {"origins": "*"}},
     supports_credentials=False,
     allow_headers=["Content-Type", "X-Username", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# ──────────────────────────────────────────────────────────────────────────────
# BASE DIRECTORIES (For Physical Excel Files)
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

# ══════════════════════════════════════════════════════════════════════════════
# POSTGRESQL DATABASE MODELS
# ══════════════════════════════════════════════════════════════════════════════
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='viewer')
    status = db.Column(db.String(20), nullable=False, default='Active')

class AuthSession(db.Model):
    __tablename__ = 'auth_sessions'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    session_token = db.Column(db.String(120), unique=True, nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    logout_time = db.Column(db.DateTime, nullable=True)
    logout_reason = db.Column(db.String(50), nullable=True)
    expired = db.Column(db.Boolean, default=False)

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    username = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)

class SavedAudit(db.Model):
    __tablename__ = 'saved_audits'
    id = db.Column(db.String(100), primary_key=True) # e.g., session_2026...
    username = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    insights_list = db.Column(db.JSON, nullable=False) # Postgres Native JSON array

# Auto-create tables and default users if database is empty
with app.app_context():
    db.create_all()
    if not User.query.first():
        default_users = [
            User(username="admin", password="password123", role="admin", status="Active"),
            User(username="uploader", password="password123", role="uploader", status="Active"),
            User(username="reviewer", password="password123", role="reviewer", status="Active"),
            User(username="viewer", password="password123", role="viewer", status="Active"),
            User(username="uploader2", password="password123", role="uploader", status="Active")
        ]
        db.session.bulk_save_objects(default_users)
        db.session.commit()
        print("✅ Database Initialized and Default Users Seeded.")

# ──────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS (Now routing to Postgres)
# ──────────────────────────────────────────────────────────────────────────────
SESSION_EXPIRY_HOURS = 24

def record_login(username, role):
    now_local = datetime.now().astimezone()
    session_token = now_local.isoformat()
    new_session = AuthSession(
        username=username,
        role=role,
        session_token=session_token,
        login_time=datetime.now(timezone.utc)
    )
    db.session.add(new_session)
    db.session.commit()
    return session_token

def record_logout(username, session_token, reason="manual"):
    active_session = AuthSession.query.filter_by(username=username, session_token=session_token, logout_time=None).first()
    if active_session:
        active_session.logout_time = datetime.now(timezone.utc)
        active_session.logout_reason = reason
        active_session.expired = (reason == "expired")
        db.session.commit()

def is_session_valid(username, session_token):
    active_session = AuthSession.query.filter_by(username=username, session_token=session_token, logout_time=None).first()
    if not active_session:
        return False
    
    # Check 24-hour limit against DB record
    if datetime.now(timezone.utc).replace(tzinfo=None) - active_session.login_time > timedelta(hours=SESSION_EXPIRY_HOURS):
        record_logout(username, session_token, reason="expired")
        return False
    return True

def log_activity(username, role, action, details=""):
    new_log = ActivityLog(
        username=username,
        role=role,
        action=action,
        details=details,
        timestamp=datetime.now(timezone.utc)
    )
    db.session.add(new_log)
    db.session.commit()

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

# Register Blueprints
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
# FILE UPLOAD & KPI EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════
EXPECTED_FILENAMES = {
    "concurFile":   "Concur_Header_Data.xlsx",
    "leftEmpFile":  "Left_Employees.xlsx",
    "empMasterFile":"Employee_Master.xlsx",
    "lineItemFile": "Line_Item_Data.xlsx",
}

def load_smart_dataframe(file_bytes, filename):
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

        for key, expected_name in EXPECTED_FILENAMES.items():
            if key not in request.files:
                continue
            file = request.files[key]
            if not file.filename:
                continue

            save_path = os.path.join(user_data_dir, expected_name)

            if file.filename.lower().endswith('.zip'):
                dfs = []
                with zipfile.ZipFile(file, 'r') as z:
                    for info in z.infolist():
                        if (not info.filename.startswith('__MACOSX') and info.filename.lower().endswith(('.csv', '.xlsx', '.xls'))):
                            with z.open(info) as f:
                                dfs.append(load_smart_dataframe(f.read(), info.filename))
                if dfs:
                    pd.concat(dfs, ignore_index=True).to_excel(save_path, index=False)
                else:
                    return jsonify({"status": "error", "message": f"No valid data files found in ZIP for '{key}'."}), 400
            else:
                df = load_smart_dataframe(file.read(), file.filename)
                df.to_excel(save_path, index=False)

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

        # Concur Header KPIs (Strict Matching)
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

        # Employee Master KPIs (Strict Matching)
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

        user  = User.query.filter_by(username=username).first()
        role  = user.role if user else "uploader"
        log_activity(username, role, "FILE_UPLOAD", f"Uploaded: {', '.join(request.files.keys())}")

        return jsonify({"status": "success", "message": "Files uploaded successfully!", "kpis": kpis}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# GENERATION & INSIGHT ROUTES
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

        user  = User.query.filter_by(username=username).first()
        role  = user.role if user else "uploader"
        log_activity(username, role, "RUN_INSIGHTS", f"Generated: {', '.join(selected_insights)}")

        return jsonify({"status": "success", "message": "Generation complete."}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

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
                    return jsonify({"status": "error", "message": f"Data not generated yet for '{key}'."}), 404
                df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[key] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        fp = os.path.join(user_out_dir, filename)
        if not os.path.exists(fp):
            return jsonify({"status": "error", "message": "Data not generated yet. Please upload master data first."}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(fp, sheet_name='Anomalies (30-42)', skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})

        excel_file = pd.ExcelFile(fp)
        if len(excel_file.sheet_names) > 1:
            combined_data = {}
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(fp, sheet_name=sheet, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[sheet] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
        df.columns = df.columns.astype(str)
        return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES & USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username, password=password).first()
    
    if user:
        if user.status == 'Inactive':
            return jsonify({"message": "Account is inactive."}), 403
        
        session_token = record_login(username, user.role)
        log_activity(username, user.role, "LOGIN", "Logged in successfully")
        
        return jsonify({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "status": user.status,
            "session_token": session_token,
            "login_time": session_token
        }), 200
        
    return jsonify({"message": "Invalid username or password"}), 401

@app.route('/api/change-password', methods=['POST'])
def change_password():
    data = request.get_json() or {}
    username = data.get('username')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not username or not old_password or not new_password:
        return jsonify({"status": "error", "message": "All fields are required."}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found."}), 404

    if user.password != old_password:
        return jsonify({"status": "error", "message": "Incorrect current password."}), 401

    user.password = new_password
    db.session.commit()
    log_activity(username, user.role, "PASSWORD_CHANGE", "User changed their password")
    
    return jsonify({"status": "success", "message": "Password successfully updated!"}), 200

@app.route('/logout', methods=['POST'])
def logout():
    data          = request.get_json() or {}
    username      = data.get('username')
    session_token = data.get('session_token')
    reason        = data.get('reason', 'manual')
    
    if not username or not session_token:
        return jsonify({"message": "Missing username or session_token."}), 400
        
    record_logout(username, session_token, reason=reason)
    
    user = User.query.filter_by(username=username).first()
    role = user.role if user else 'unknown'
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

@app.route('/get_users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{"id": str(u.id), "username": u.username, "role": u.role, "status": u.status} for u in users]), 200

@app.route('/add_user', methods=['POST'])
def add_user():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role     = data.get('role', 'viewer')
    status   = data.get('status', 'Active')
    
    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400
        
    if User.query.filter(User.username.ilike(username)).first():
        return jsonify({"message": f"Username '{username}' already exists."}), 409
        
    new_user = User(username=username, password=password, role=role, status=status)
    db.session.add(new_user)
    db.session.commit()
    
    log_activity("admin", "admin", "USER_CREATED", f"Created user '{username}' with role '{role}'")
    return jsonify({"id": str(new_user.id), "username": new_user.username, "role": new_user.role, "status": new_user.status}), 201

@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found."}), 404
        
    new_username = data.get('username', user.username).strip()
    existing = User.query.filter(User.username.ilike(new_username)).first()
    if existing and str(existing.id) != str(user_id):
        return jsonify({"message": f"Username '{new_username}' already exists."}), 409
        
    old_username  = user.username
    user.username = new_username
    user.role     = data.get('role',   user.role)
    user.status   = data.get('status', user.status)
    
    if data.get('password'):
        user.password = data['password']
        
    db.session.commit()
    log_activity("admin", "admin", "USER_UPDATED", f"Updated user '{old_username}' → '{new_username}'")
    return jsonify({"id": str(user.id), "username": user.username, "role": user.role, "status": user.status}), 200

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404
        
    if user.role == 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({"message": "Cannot delete the last admin."}), 400
            
    db.session.delete(user)
    db.session.commit()
    
    log_activity("admin", "admin", "USER_DELETED", f"Deleted user '{user.username}'")
    return jsonify({"message": "User deleted successfully."}), 200

# ══════════════════════════════════════════════════════════════════════════════
# SESSION PERSISTENCE (PostgreSQL Database Metadata)
# ══════════════════════════════════════════════════════════════════════════════
@app.route('/api/save-session', methods=['POST'])
def save_session():
    try:
        username           = request.headers.get("X-Username", "default")
        user_sess_dir      = get_user_workspace(SESSIONS_DIR, username)
        user_out_dir       = get_user_workspace(OUTPUT_DIR,   username)
        req_data           = request.get_json() or {}
        requested_insights = req_data.get('insights', [])
        
        now_local    = datetime.now().astimezone()
        session_id   = f"session_{now_local.strftime('%Y%m%d_%H%M%S')}"
        session_name = req_data.get("name", f"Audit Session {now_local.strftime('%d %b %Y %H:%M')}")
        session_path = os.path.join(user_sess_dir, session_id)
        os.makedirs(session_path, exist_ok=True)

        files_saved       = []
        insights_to_check = requested_insights if requested_insights else FILE_MAP.keys()

        # Step 1: Copy physical files into user's isolated folder
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

        # Step 2: Save metadata to PostgreSQL database
        new_audit = SavedAudit(
            id=session_id,
            username=username,
            name=session_name,
            timestamp=datetime.now(timezone.utc),
            insights_list=files_saved
        )
        db.session.add(new_audit)
        db.session.commit()

        user = User.query.filter_by(username=username).first()
        role = user.role if user else 'uploader'
        log_activity(username, role, "SAVE_SESSION", f"Saved session: {session_name}")

        return jsonify({
            "status": "success", 
            "session": {"id": session_id, "name": session_name, "timestamp": now_local.isoformat(), "insights": files_saved}
        }), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    try:
        username = request.headers.get("X-Username", "default")
        
        # Fetch from PostgreSQL!
        audits = SavedAudit.query.filter_by(username=username).order_by(SavedAudit.timestamp.desc()).all()
        
        sessions = [{
            "id": a.id,
            "name": a.name,
            "timestamp": a.timestamp.replace(tzinfo=timezone.utc).astimezone().isoformat(), # Convert back to local for UI
            "insights": a.insights_list
        } for a in audits]
        
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        username = request.headers.get("X-Username", "default")
        
        # Delete from Postgres
        audit = SavedAudit.query.filter_by(id=session_id, username=username).first()
        if audit:
            db.session.delete(audit)
            db.session.commit()
            
        # Delete Physical Files from Disk
        user_sess_dir = get_user_workspace(SESSIONS_DIR, username)
        session_path  = os.path.join(user_sess_dir, session_id)
        if os.path.exists(session_path):
            shutil.rmtree(session_path)
            
        return jsonify({"status": "success", "message": "Session deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sessions/<session_id>/<insight_id>/data', methods=['GET'])
def get_session_data(session_id, insight_id):
    try:
        username      = request.headers.get("X-Username", "default")
        user_sess_dir = get_user_workspace(SESSIONS_DIR, username)

        # Still read the physical excel files from the disk
        if insight_id not in FILE_MAP:
            return jsonify({"status": "error", "message": "Insight not found"}), 404

        filename = FILE_MAP[insight_id]

        if isinstance(filename, dict):
            combined_data = {}
            for key, f in filename.items():
                fp = os.path.join(user_sess_dir, session_id, f)
                if not os.path.exists(fp):
                    return jsonify({"status": "error", "message": "Data not found in this session"}), 404
                df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[key] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        fp = os.path.join(user_sess_dir, session_id, filename)
        if not os.path.exists(fp):
            return jsonify({"status": "error", "message": "Data not found in this session"}), 404

        if insight_id == "PJPA28":
            df = pd.read_excel(fp, sheet_name='Anomalies (30-42)', skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
            df.columns = df.columns.astype(str)
            return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})

        excel_file = pd.ExcelFile(fp)
        if len(excel_file.sheet_names) > 1:
            combined_data = {}
            for sheet in excel_file.sheet_names:
                df = pd.read_excel(fp, sheet_name=sheet, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
                df.columns = df.columns.astype(str)
                combined_data[sheet] = df.fillna("N/A").to_dict(orient='records')
            return jsonify({"status": "success", "insight_id": insight_id, "data": combined_data})

        df = pd.read_excel(fp, skiprows=SKIP_ROWS_MAP.get(insight_id, 0))
        df.columns = df.columns.astype(str)
        return jsonify({"status": "success", "insight_id": insight_id, "data": df.fillna("N/A").to_dict(orient='records')})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/clear-session', methods=['POST'])
def clear_session():
    try:
        username      = request.headers.get("X-Username", "default")
        user_data_dir = get_user_workspace(DATA_DIR,   username)
        user_out_dir  = get_user_workspace(OUTPUT_DIR, username)
        
        for d in [user_data_dir, user_out_dir]:
            if os.path.exists(d):
                for fname in os.listdir(d):
                    fp = os.path.join(d, fname)
                    if os.path.isfile(fp):
                        os.remove(fp)
                        
        return jsonify({"status": "success", "message": "Backend session cleared."}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)