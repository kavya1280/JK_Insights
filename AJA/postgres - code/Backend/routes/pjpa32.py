from flask import Blueprint, request, jsonify
import pandas as pd
from routes.upload import get_current_data
import services.pjpa32_service as pjpa32

pjpa32_bp = Blueprint('pjpa32', __name__)

def get_filtered_df():
    df = get_current_data()
    if df is None:
        return None
    
    # Extract filters from request.args
    filters = {
        'employee_id': request.args.get('employee_id'),
        'employee': request.args.get('employee'),
        'report_id': request.args.get('report_id'),
        'expense_type': request.args.get('expense_type'),
        'location': request.args.get('location'),
        'startDate': request.args.get('startDate'),
        'endDate': request.args.get('endDate')
    }
    search = request.args.get('search')
    
    df = pjpa32.apply_filters(df, filters)
    df = pjpa32.apply_search(df, search)
    return df

@pjpa32_bp.route("/filters", methods=["GET"])
def get_filters():
    df = get_current_data()
    return jsonify(pjpa32.get_filters(df))

@pjpa32_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    df = get_filtered_df()
    if df is None: return jsonify({})
    return jsonify(pjpa32.get_chart_data(df))

@pjpa32_bp.route("/all-data", methods=["GET"])
def get_all_data():
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=15, type=int)
    
    df = get_filtered_df()
    if df is None:
        return jsonify({"data": [], "total": 0})

    df_clean = df.fillna("N/A")
    for col in df_clean.columns:
        if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d')
            
    data = df_clean.to_dict(orient="records")
    total = len(data)
    start = (page - 1) * page_size
    end = start + page_size
    
    return jsonify({"data": data[start:end], "total": total})

@pjpa32_bp.route("/raw-data", methods=["GET"])
def get_raw_data():
    df = get_current_data()
    if df is None:
        return jsonify({"detail": "No data available"}), 404
    
    df_clean = df.fillna("N/A")
    for col in df_clean.columns:
        if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
            df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d')
            
    return jsonify(df_clean.to_dict(orient="records"))
