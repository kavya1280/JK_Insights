import os
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Updated CORS to allow all necessary methods for Admin (PUT, DELETE, etc.)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

UPLOAD_FOLDER = 'uploads'
MASTER_EXCEL_FILE = 'Status of Reimbursement of Analysis (2).xlsx'
USER_FILE = 'users.json'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- DATABASE HELPERS ---

def read_db():
    """Reads the raw JSON file."""
    if not os.path.exists(USER_FILE):
        # Create default admin if file doesn't exist
        default = [{"username": "admin", "password": "123", "role": "admin", "status": "Active"}]
        with open(USER_FILE, 'w') as f:
            json.dump(default, f, indent=2)
        return default
    with open(USER_FILE, 'r') as f:
        return json.load(f)

def write_db(data):
    """Writes data to JSON after removing temporary UI IDs."""
    clean_data = []
    for user in data:
        user_copy = user.copy()
        user_copy.pop('id', None)  # Never save the auto-generated ID to the file
        clean_data.append(user_copy)
    
    with open(USER_FILE, 'w') as f:
        json.dump(clean_data, f, indent=2)

# --- ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data received"}), 400
        
    username = str(data.get('username'))
    password = str(data.get('password'))

    users = read_db()
    user = next((u for u in users if str(u['username']) == username and str(u['password']) == password), None)
    
    if user:
        return jsonify({"username": user['username'], "role": user['role']}), 200
    return jsonify({"message": "Invalid Username or Password"}), 401

@app.route('/get_users', methods=['GET'])
def get_users():
    users = read_db()
    # Add a temporary ID for the React frontend mapping
    for i, user in enumerate(users):
        user['id'] = str(i)
    return jsonify(users)

@app.route('/add_user', methods=['POST'])
def add_user():
    new_user = request.get_json()
    users = read_db()
    users.append(new_user)
    write_db(users)
    return jsonify({"message": "User added"}), 201

@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    updated_info = request.get_json()
    users = read_db()
    
    try:
        idx = int(user_id)
        if 0 <= idx < len(users):
            # Update user fields
            users[idx].update(updated_info)
            write_db(users)
            return jsonify({"message": "User updated"})
    except ValueError:
        pass
        
    return jsonify({"message": "User not found"}), 404

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    users = read_db()
    try:
        idx = int(user_id)
        if 0 <= idx < len(users):
            users.pop(idx)
            write_db(users)
            return jsonify({"message": "User deleted"})
    except ValueError:
        pass
        
    return jsonify({"message": "User not found"}), 404

@app.route('/upload_excel', methods=['POST'])
def upload_excel():
    insight_id = request.form.get('insight_id')
    files = request.files.getlist('files')
    
    # Simple Mock for the Analysis Response
    return jsonify({
        "message": f"Analysis for {insight_id} complete",
        "kpis": [{"label": "Files Processed", "value": len(files)}],
        "table": [], # Your actual logic would fill this
        "charts": [] # Your actual logic would fill this
    }), 200

@app.route('/get_insights', methods=['GET'])
def get_insights():
    if not os.path.exists(MASTER_EXCEL_FILE):
        return jsonify({"error": "Master file not found"}), 404
    try:
        df = pd.read_excel(MASTER_EXCEL_FILE, engine='openpyxl')
        if 'ID' in df.columns and 'Insights' in df.columns:
            data = df[['ID', 'Insights']].dropna().to_dict(orient='records')
        else:
            data = df.to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)