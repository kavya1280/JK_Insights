from flask import Blueprint, request, jsonify
import services.pjpa35_service as svc

pjpa35_bp = Blueprint('pjpa35', __name__)

@pjpa35_bp.route("/kpis", methods=["GET"])
def get_kpis():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_kpis(df))

@pjpa35_bp.route("/filters", methods=["GET"])
def get_filters():
    df = svc._load_data()
    return jsonify(svc.get_filters(df))

@pjpa35_bp.route("/charts", methods=["GET"])
def get_charts():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_chart_data(df))

@pjpa35_bp.route("/table", methods=["GET"])
def get_table():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=15, type=int)
    search = request.args.get('search')
    
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=page, page_size=page_size, search=search))

@pjpa35_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "approval_status": request.args.get('approval_status'),
        "payment_status": request.args.get('payment_status'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate')
    }
    search = request.args.get('search')
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=1, page_size=100000, search=search))
