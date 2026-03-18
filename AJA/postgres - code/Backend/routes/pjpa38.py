from flask import Blueprint, request, jsonify
import services.pjpa38_service as svc

pjpa38_bp = Blueprint('pjpa38', __name__)

@pjpa38_bp.route("/kpis", methods=["GET"])
def get_kpis():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "expense_type": request.args.get('expense_type'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_kpis(df))

@pjpa38_bp.route("/filters", methods=["GET"])
def get_filters():
    df = svc._load_data()
    return jsonify(svc.get_filters(df))

@pjpa38_bp.route("/charts", methods=["GET"])
def get_charts():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "expense_type": request.args.get('expense_type'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_chart_data(df))

@pjpa38_bp.route("/table", methods=["GET"])
def get_table():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "expense_type": request.args.get('expense_type'),
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

@pjpa38_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "expense_type": request.args.get('expense_type'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate')
    }
    search = request.args.get('search')
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=1, page_size=100000, search=search))
