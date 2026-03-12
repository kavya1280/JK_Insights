from flask import Blueprint, request, jsonify
import services.pjpa28_service as svc

pjpa28_bp = Blueprint('pjpa28', __name__)

@pjpa28_bp.route("/kpis", methods=["GET"])
def get_kpis():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "submit_date_start": request.args.get('submit_date_start'),
        "submit_date_end": request.args.get('submit_date_end')
    }
    sheets = svc._load_all_sheets()
    anomalies_df = svc._load_anomalies(sheets)
    anomalies_df = svc.apply_filters(anomalies_df, params)
    return jsonify(svc.get_kpis(sheets, anomalies_df))

@pjpa28_bp.route("/filters", methods=["GET"])
def get_filters():
    sheets = svc._load_all_sheets()
    anomalies_df = svc._load_anomalies(sheets)
    return jsonify(svc.get_filters(anomalies_df))

@pjpa28_bp.route("/charts", methods=["GET"])
def get_charts():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "submit_date_start": request.args.get('submit_date_start'),
        "submit_date_end": request.args.get('submit_date_end')
    }
    sheets = svc._load_all_sheets()
    anomalies_df = svc._load_anomalies(sheets)
    anomalies_df = svc.apply_filters(anomalies_df, params)
    return jsonify(svc.get_chart_data(sheets, anomalies_df))


@pjpa28_bp.route("/table", methods=["GET"])
def get_table():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "submit_date_start": request.args.get('submit_date_start'),
        "submit_date_end": request.args.get('submit_date_end')
    }
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=15, type=int)
    search = request.args.get('search')
    
    sheets = svc._load_all_sheets()
    anomalies_df = svc._load_anomalies(sheets)
    anomalies_df = svc.apply_filters(anomalies_df, params)
    return jsonify(svc.get_table_data(anomalies_df, page=page, page_size=page_size, search=search))

@pjpa28_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "submit_date_start": request.args.get('submit_date_start'),
        "submit_date_end": request.args.get('submit_date_end')
    }
    search = request.args.get('search')
    sheets = svc._load_all_sheets()
    anomalies_df = svc._load_anomalies(sheets)
    anomalies_df = svc.apply_filters(anomalies_df, params)
    return jsonify(svc.get_table_data(anomalies_df, page=1, page_size=100000, search=search))
