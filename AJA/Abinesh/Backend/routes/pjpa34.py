from flask import Blueprint, request, jsonify
import services.pjpa34_service as svc

pjpa34_bp = Blueprint('pjpa34', __name__)

def get_filtered_df():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "report_number": request.args.get('report_number'),
        "payment_status": request.args.get('payment_status'),
        "policy": request.args.get('policy'),
        "month": request.args.get('month'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    return svc.apply_filters(df, params)

@pjpa34_bp.route("/kpis", methods=["GET"])
def get_kpis():
    df = get_filtered_df()
    return jsonify(svc.get_kpis(df))

@pjpa34_bp.route("/filters", methods=["GET"])
def get_filters():
    df = svc._load_data()
    return jsonify(svc.get_filters(df))

@pjpa34_bp.route("/charts", methods=["GET"])
def get_charts():
    df = get_filtered_df()
    return jsonify(svc.get_chart_data(df))

@pjpa34_bp.route("/stats", methods=["GET"])
def get_stats():
    df = get_filtered_df()
    if df is None: return jsonify({})
    return jsonify({
        "kpis": svc.get_kpis(df),
        "charts": svc.get_chart_data(df)
    })

@pjpa34_bp.route("/table", methods=["GET"])
def get_table():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "report_number": request.args.get('report_number'),
        "payment_status": request.args.get('payment_status'),
        "policy": request.args.get('policy'),
        "month": request.args.get('month'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate')
    }
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=15, type=int)
    search = request.args.get('search')
    
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=page, page_size=page_size, search=search))

@pjpa34_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "report_number": request.args.get('report_number'),
        "payment_status": request.args.get('payment_status'),
        "policy": request.args.get('policy'),
        "month": request.args.get('month'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate')
    }
    search = request.args.get('search')
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=1, page_size=100000, search=search))
