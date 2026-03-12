from flask import Blueprint, request, jsonify
import services.pjpa37_service as svc

pjpa37_bp = Blueprint('pjpa37', __name__)

@pjpa37_bp.route("/kpis", methods=["GET"])
def get_kpis():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "cluster_id": request.args.get('cluster_id'),
        "is_anomaly": request.args.get('is_anomaly'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_kpis(df))

@pjpa37_bp.route("/filters", methods=["GET"])
def get_filters():
    df = svc._load_data()
    return jsonify(svc.get_filters(df))

@pjpa37_bp.route("/charts", methods=["GET"])
def get_charts():
    params = {
        "employee_id": request.args.get('employee_id'),
        "report_id": request.args.get('report_id'),
        "cluster_id": request.args.get('cluster_id'),
        "is_anomaly": request.args.get('is_anomaly'),
        "startDate": request.args.get('startDate'),
        "endDate": request.args.get('endDate'),
        "search": request.args.get('search')
    }
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_chart_data(df))

@pjpa37_bp.route("/table", methods=["GET"])
def get_table():
    params = {
        "employee_id": request.args.get('employee_id'),
        "policy": request.args.get('policy'),
        "cluster_id": request.args.get('cluster_id'),
        "is_anomaly": request.args.get('is_anomaly')
    }
    page = request.args.get('page', default=1, type=int)
    page_size = request.args.get('page_size', default=15, type=int)
    search = request.args.get('search')
    
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=page, page_size=page_size, search=search))

@pjpa37_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    params = {
        "employee_id": request.args.get('employee_id'),
        "policy": request.args.get('policy'),
        "cluster_id": request.args.get('cluster_id'),
        "is_anomaly": request.args.get('is_anomaly')
    }
    search = request.args.get('search')
    df = svc._load_data()
    df = svc.apply_filters(df, params)
    return jsonify(svc.get_table_data(df, page=1, page_size=100000, search=search))
