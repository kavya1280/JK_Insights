from flask import Blueprint, request, jsonify
import services.pjpa40_service as svc
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pjpa40_bp = Blueprint('pjpa40', __name__)

def get_filtered_df():
    """
    Extract filter parameters from request and return filtered dataframe
    """
    try:
        params = {
            "employee_id": request.args.get('employee_id'),
            "expense_type": request.args.get('expense_type'),
            "policy": request.args.get('policy'),
            "report_id": request.args.get('report_id'),
            "search": request.args.get('search')
        }
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        
        logger.info(f"Applying filters: {params}")
        df = svc._load_data()
        
        if df is None:
            logger.warning("No data loaded")
            return None
            
        return svc.apply_filters(df, params)
        
    except Exception as e:
        logger.error(f"Error in get_filtered_df: {str(e)}")
        return None

@pjpa40_bp.route("/kpis", methods=["GET"])
def get_kpis():
    """
    Endpoint to get KPI data
    """
    try:
        df = get_filtered_df()
        if df is None or df.empty:
            return jsonify({
                "distinct_employee": 0,
                "count_transactions": 0,
                "distinct_expense_type": 0,
                "distinct_policy": 0,
                "total_amount": 0
            })
        
        kpis = svc.get_kpis(df)
        return jsonify(kpis)
        
    except Exception as e:
        logger.error(f"Error in get_kpis: {str(e)}")
        return jsonify({"error": str(e)}), 500

@pjpa40_bp.route("/filters", methods=["GET"])
def get_filters():
    """
    Endpoint to get filter dropdown options
    """
    try:
        df = svc._load_data()
        if df is None:
            return jsonify({
                "employee_ids": [],
                "policies": [],
                "expense_types": [],
                "report_ids": []
            })
        
        filters = svc.get_filters(df)
        return jsonify(filters)
        
    except Exception as e:
        logger.error(f"Error in get_filters: {str(e)}")
        return jsonify({"error": str(e)}), 500

@pjpa40_bp.route("/charts", methods=["GET"])
def get_charts():
    """
    Endpoint to get chart data
    """
    try:
        df = get_filtered_df()
        if df is None or df.empty:
            return jsonify({
                "amount_approved_employee": [],
                "vendor_amount": [],
                "amount_distribution_policy": [],
                "amount_transaction_date": []
            })
        
        charts = svc.get_chart_data(df)
        return jsonify(charts)
        
    except Exception as e:
        logger.error(f"Error in get_charts: {str(e)}")
        return jsonify({"error": str(e)}), 500

@pjpa40_bp.route("/stats", methods=["GET"])
def get_stats():
    """
    Endpoint to get combined KPIs and charts data
    """
    try:
        df = get_filtered_df()
        if df is None or df.empty:
            return jsonify({
                "kpis": {
                    "distinct_employee": 0,
                    "count_transactions": 0,
                    "distinct_expense_type": 0,
                    "distinct_policy": 0,
                    "total_amount": 0
                },
                "charts": {
                    "amount_approved_employee": [],
                    "vendor_amount": [],
                    "amount_distribution_policy": [],
                    "amount_transaction_date": []
                }
            })
        
        return jsonify({
            "kpis": svc.get_kpis(df),
            "charts": svc.get_chart_data(df)
        })
        
    except Exception as e:
        logger.error(f"Error in get_stats: {str(e)}")
        return jsonify({"error": str(e)}), 500

@pjpa40_bp.route("/table", methods=["GET"])
def get_table():
    """
    Endpoint to get paginated table data
    """
    try:
        params = {
            "employee_id": request.args.get('employee_id'),
            "expense_type": request.args.get('expense_type'),
            "policy": request.args.get('policy'),
            "report_id": request.args.get('report_id')
        }
        params = {k: v for k, v in params.items() if v is not None}
        
        page = request.args.get('page', default=1, type=int)
        page_size = request.args.get('page_size', default=15, type=int)
        search = request.args.get('search')
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 15
        
        df = svc._load_data()
        if df is None:
            return jsonify({"data": [], "total": 0})
        
        df = svc.apply_filters(df, params)
        result = svc.get_table_data(df, page=page, page_size=page_size, search=search)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_table: {str(e)}")
        return jsonify({"error": str(e), "data": [], "total": 0}), 500

@pjpa40_bp.route("/table/csv", methods=["GET"])
def get_table_csv():
    """
    Endpoint to get all table data for CSV export
    """
    try:
        params = {
            "employee_id": request.args.get('employee_id'),
            "expense_type": request.args.get('expense_type'),
            "policy": request.args.get('policy'),
            "report_id": request.args.get('report_id')
        }
        params = {k: v for k, v in params.items() if v is not None}
        
        search = request.args.get('search')
        
        df = svc._load_data()
        if df is None:
            return jsonify({"data": [], "total": 0})
        
        df = svc.apply_filters(df, params)
        
        # Get all data for CSV export
        result = svc.get_table_data(df, page=1, page_size=len(df) if df is not None else 0, search=search)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_table_csv: {str(e)}")
        return jsonify({"error": str(e), "data": [], "total": 0}), 500

@pjpa40_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    """
    try:
        df = svc._load_data()
        status = "healthy" if df is not None else "degraded"
        return jsonify({
            "status": status,
            "service": "pjpa40",
            "data_loaded": df is not None
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "service": "pjpa40",
            "error": str(e)
        }), 500