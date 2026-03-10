from flask import Blueprint, request, jsonify, abort
import os
import pandas as pd
from main_orchestrator import run_selected_insights

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route("/generate", methods=["POST"])
def generate_insights():
    data = request.get_json()
    if not data or 'insights' not in data:
        return jsonify({"detail": "insights list required"}), 400
    try:
        run_selected_insights(data['insights'])
        return jsonify({"status": "success", "message": "Generation complete."})
    except Exception as e:
        return jsonify({"detail": str(e)}), 500

@dashboard_bp.route("/insight/<insight_id>/data", methods=["GET"])
def get_insight_data(insight_id):
    OUTPUT_DIR = "Output"
    FILE_MAP = {
        "PJPA27": "PJPA27_Generated.xlsx", "PJPA28": "PJPA28_Generated.xlsx",
        "PJPA29": "PJPA29_Generated.xlsx", "PJPA30": "PJPA30_Generated.xlsx",
        "PJPA31": "PJPA31_Generated.xlsx", "PJPA32_HOL": "PJPA32_Holiday_Generated.xlsx",
        "PJPA32_WE": "PJPA32_Weekend_Generated.xlsx", "PJPA33": "PJPA33_Generated.xlsx",
        "PJPA34": "PJPA34_Generated.xlsx", "PJPA35": "PJPA35_Generated.xlsx", "PJPA36": "PJPA36_Generated.xlsx",
        "PJPA38": "PJPA38_Generated.xlsx", "PJPA39": "PJPA39_Generated.xlsx", "PJPA40": "PJPA40_Generated.xlsx"
    }
    SKIP_ROWS_MAP = {
        "PJPA27": 5, "PJPA28": 5, "PJPA29": 5, "PJPA30": 4, "PJPA31": 4,
        "PJPA32_HOL": 5, "PJPA32_WE": 5, "PJPA33": 4, "PJPA34": 5, "PJPA35": 4, "PJPA36": 5, "PJPA38": 5, "PJPA39": 4, "PJPA40": 4
    }

    if insight_id not in FILE_MAP:
        return jsonify({"detail": "Insight not found"}), 404
        
    file_path = os.path.join(OUTPUT_DIR, FILE_MAP[insight_id])
    if not os.path.exists(file_path):
        return jsonify({"detail": "Data not generated yet. Please upload master data first."}), 404

    try:
        if insight_id == "PJPA28":
            df = pd.read_excel(file_path, sheet_name='Anomalies (30-42)', skiprows=SKIP_ROWS_MAP[insight_id])
        else:
            df = pd.read_excel(file_path, skiprows=SKIP_ROWS_MAP[insight_id])
            
        df.columns = df.columns.astype(str)
        
        # Robust numeric cleaning for all columns that might contain currency or numbers
        def clean_numeric(val):
            if pd.isna(val) or val == '': return 0
            # If already numeric, return as is
            if isinstance(val, (int, float)): return val
            # Strip currency symbols and commas
            s = str(val).replace('₹', '').replace(',', '').strip()
            try:
                return float(s)
            except:
                return val # Return original if not convertible

        numeric_keywords = ['Amount', 'Total', 'Approved', 'Due', 'Sum', 'Count']
        for col in df.columns:
            if any(key in col for key in numeric_keywords):
                df[col] = df[col].apply(clean_numeric)

        # Handle large datasets by truncating for the dashboard preview
        if len(df) > 2000:
            df = df.head(2000)
            
        # Optimization: convert to dict after truncation
        data = df.fillna("N/A").to_dict(orient='records')
        
        return jsonify({"status": "success", "insight_id": insight_id, "data": data})
    except Exception as e:
        return jsonify({"detail": str(e)}), 500


