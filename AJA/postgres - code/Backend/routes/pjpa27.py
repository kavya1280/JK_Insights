from flask import Blueprint, request, jsonify
import services.pjpa27_service as svc

pjpa27_bp = Blueprint('pjpa27', __name__)

@pjpa27_bp.route("/kpis", methods=["GET"])
def get_kpis():
    params = {
        "employee_id": request.args.get('employee_id'),
        "payment_status": request.args.get('payment_status'),
        "risk_category": request.args.get('risk_category'),
        "policy": request.args.get('policy'),
        "designation": request.args.get('designation'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_kpis(df))

@pjpa27_bp.route("/filters", methods=["GET"])
def get_filters():
    df = svc._load_data()
    return jsonify(svc.get_filters(df))

@pjpa27_bp.route("/charts", methods=["GET"])
def get_charts():
    params = {
        "employee_id": request.args.get('employee_id'),
        "payment_status": request.args.get('payment_status'),
        "risk_category": request.args.get('risk_category'),
        "policy": request.args.get('policy'),
        "designation": request.args.get('designation'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_chart_data(df))

@pjpa27_bp.route("/table", methods=["GET"])
def get_table():
    params = {
        "employee_id": request.args.get('employee_id'),
        "payment_status": request.args.get('payment_status'),
        "risk_category": request.args.get('risk_category'),
        "policy": request.args.get('policy'),
        "designation": request.args.get('designation')
    }
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=15, type=int)
    search = request.args.get('search')
    
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=page, page_size=page_size, search=search))

@pjpa27_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    params = {
        "employee_id": request.args.get('employee_id'),
        "payment_status": request.args.get('payment_status'),
        "risk_category": request.args.get('risk_category'),
        "policy": request.args.get('policy'),
        "designation": request.args.get('designation')
    }
    search = request.args.get('search')
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=1, page_size=100000, search=search))
