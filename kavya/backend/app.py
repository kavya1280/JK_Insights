import os
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allow CORS so your React app can talk to the Python server
CORS(app)

UPLOAD_FOLDER = 'uploads'
MASTER_EXCEL_FILE = 'Status of Reimbursement of Analysis (2).xlsx'
USER_FILE = 'users.json'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- LOGIN ---
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data received"}), 400
        
    username = data.get('username')
    password = data.get('password')

    if not os.path.exists(USER_FILE):
        return jsonify({"message": "users.json file missing on server"}), 500

    try:
        with open(USER_FILE, 'r') as f:
            users = json.load(f)
        
        # Check credentials
        user = next((u for u in users if u['username'] == username and u['password'] == password), None)
        
        if user:
            # Return role and username to React
            return jsonify({"username": user['username'], "role": user['role']}), 200
        else:
            return jsonify({"message": "Invalid Username or Password"}), 401
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# --- USER MANAGEMENT ---
@app.route('/get_users', methods=['GET'])
def get_users():
    if not os.path.exists(USER_FILE):
        return jsonify([])
    with open(USER_FILE, 'r') as f:
        users = json.load(f)
    # Add an ID field if it doesn't exist for easier React mapping
    for i, user in enumerate(users):
        if 'id' not in user:
            user['id'] = str(i)
    return jsonify(users)

@app.route('/add_user', methods=['POST'])
def add_user():
    new_user = request.get_json()
    with open(USER_FILE, 'r') as f:
        users = json.load(f)
    users.append(new_user)
    with open(USER_FILE, 'w') as f:
        json.dump(users, f, indent=2)
    return jsonify({"message": "User added"}), 201

@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    updated_info = request.get_json()
    with open(USER_FILE, 'r') as f:
        users = json.load(f)
    
    # Simple ID matching based on index if no real ID is present
    idx = int(user_id) if user_id.isdigit() else -1
    if 0 <= idx < len(users):
        users[idx].update(updated_info)
        with open(USER_FILE, 'w') as f:
            json.dump(users, f, indent=2)
        return jsonify({"message": "User updated"})
    return jsonify({"message": "User not found"}), 404

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    with open(USER_FILE, 'r') as f:
        users = json.load(f)
    idx = int(user_id) if user_id.isdigit() else -1
    if 0 <= idx < len(users):
        deleted_user = users.pop(idx)
        with open(USER_FILE, 'w') as f:
            json.dump(users, f, indent=2)
        return jsonify({"message": f"User {deleted_user['username']} deleted"})
    return jsonify({"message": "User not found"}), 404
        
# --- MULTIPLE FILE UPLOAD ---
@app.route('/upload_excel', methods=['POST'])
def upload_excel():
    insight_id = request.form.get('insight_id')
    files = request.files.getlist('files')
    
    # Save files and convert to a dictionary of DataFrames for the script
    df_dict = {}
    for file in files:
        df_dict[file.filename] = pd.read_excel(file)

    # Route to the correct processing logic
    result_data = {"message": "Insight logic not implemented yet"}

    return jsonify(result_data), 200

# --- GET INSIGHTS ---
@app.route('/get_insights', methods=['GET'])
def get_insights():
    if not os.path.exists(MASTER_EXCEL_FILE):
        return jsonify({"error": f"File '{MASTER_EXCEL_FILE}' not found"}), 404
    
    try:
        # We specify engine='openpyxl' to avoid errors with modern Excel files
        df = pd.read_excel(MASTER_EXCEL_FILE, engine='openpyxl')
        
        # We only take the ID and Insights columns as requested
        # We convert them to a list of dictionaries
        if 'ID' in df.columns and 'Insights' in df.columns:
            data = df[['ID', 'Insights']].dropna().to_dict(orient='records')
        else:
            # Fallback if columns aren't named exactly ID/Insights
            data = df.to_dict(orient='records')
            
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Ensure you are running on port 5000 as specified in your React code
    app.run(host='0.0.0.0', port=5000, debug=True)