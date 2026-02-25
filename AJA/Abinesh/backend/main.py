from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import os
import json
from datetime import datetime
import shutil

from processors.pjpa37 import process_pjpa37
from processors.pjpa38 import process_pjpa38
from processors.pjpa39 import process_pjpa39

app = FastAPI(title="AJALabs Analytics API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage for current session data
current_data = {
    "df": None,
    "filename": None,
    "file_type": None  # PJPA37, PJPA38, or PJPA39
}

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class FilterRequest(BaseModel):
    employee_id: Optional[List[str]] = None
    employee_name: Optional[List[str]] = None
    department: Optional[List[str]] = None
    policy: Optional[List[str]] = None
    report_id: Optional[List[str]] = None
    cluster: Optional[List[str]] = None
    expense_type: Optional[List[str]] = None
    state: Optional[List[str]] = None
    date_range: Optional[Dict[str, str]] = None
    amount_range: Optional[Dict[str, float]] = None

class TableRequest(BaseModel):
    page: int = 1
    page_size: int = 25
    search: Optional[str] = None
    sort_column: Optional[str] = None
    sort_direction: Optional[str] = "asc"
    filters: Optional[FilterRequest] = None

# Helper functions
def detect_file_type(filename: str) -> str:
    """Detect file type based on filename"""
    filename_upper = filename.upper()
    if "PJPA37" in filename_upper or "37" in filename_upper:
        return "PJPA37"
    elif "PJPA38" in filename_upper or "38" in filename_upper:
        return "PJPA38"
    elif "PJPA39" in filename_upper or "39" in filename_upper:
        return "PJPA39"
    else:
        return "PJPA37"  # Default

def apply_filters(df: pd.DataFrame, filters: FilterRequest) -> pd.DataFrame:
    """Apply filters to dataframe"""
    if filters is None:
        return df
    
    filtered_df = df.copy()
    filtered_df = filtered_df.loc[:, ~filtered_df.columns.duplicated()]
    
    if filters.employee_id and len(filters.employee_id) > 0:
        emp_col = "Employee ID" if "Employee ID" in filtered_df.columns else "Employee_ID"
        if emp_col in filtered_df.columns:
            filtered_df = filtered_df[filtered_df[emp_col].astype(str).isin(filters.employee_id)]
    
    if filters.employee_name and len(filters.employee_name) > 0:
        name_col = None
        for col in filtered_df.columns:
            if "employee" in col.lower() and "name" in col.lower():
                name_col = col
                break
        if name_col:
            filtered_df = filtered_df[filtered_df[name_col].isin(filters.employee_name)]
    
    if filters.department and len(filters.department) > 0:
        dept_col = "Department" if "Department" in filtered_df.columns else None
        if dept_col:
            filtered_df = filtered_df[filtered_df[dept_col].isin(filters.department)]
    
    if filters.policy and len(filters.policy) > 0:
        policy_col = None
        for col in filtered_df.columns:
            if "policy" in col.lower():
                policy_col = col
                break
        if policy_col:
            filtered_df = filtered_df[filtered_df[policy_col].isin(filters.policy)]
    
    if filters.report_id and len(filters.report_id) > 0:
        report_col = "Report ID" if "Report ID" in filtered_df.columns else "Report_ID"
        if report_col in filtered_df.columns:
            filtered_df = filtered_df[filtered_df[report_col].astype(str).isin(filters.report_id)]
    
    if filters.cluster and len(filters.cluster) > 0:
        cluster_col = "Cluster_ID" if "Cluster_ID" in filtered_df.columns else None
        if cluster_col:
            filtered_df = filtered_df[filtered_df[cluster_col].astype(str).isin(filters.cluster)]
    
    if filters.expense_type and len(filters.expense_type) > 0:
        exp_col = None
        for col in filtered_df.columns:
            if "expense" in col.lower() and "type" in col.lower():
                exp_col = col
                break
        if exp_col:
            filtered_df = filtered_df[filtered_df[exp_col].isin(filters.expense_type)]
    
    if filters.state and len(filters.state) > 0:
        state_col = "State" if "State" in filtered_df.columns else None
        if state_col:
            filtered_df = filtered_df[filtered_df[state_col].isin(filters.state)]
    
    if filters.date_range:
        start_date = filters.date_range.get("start")
        end_date = filters.date_range.get("end")
        date_col = None
        for col in filtered_df.columns:
            if "date" in col.lower():
                date_col = col
                break
        if date_col and start_date and end_date:
            filtered_df[date_col] = pd.to_datetime(filtered_df[date_col], errors='coerce')
            filtered_df = filtered_df[
                (filtered_df[date_col] >= pd.to_datetime(start_date)) & 
                (filtered_df[date_col] <= pd.to_datetime(end_date))
            ]
    
    if filters.amount_range:
        min_amt = filters.amount_range.get("min")
        max_amt = filters.amount_range.get("max")
        amt_col = None
        for col in ["Total Spend Amount", "Approved Amount", "Amount"]:
            if col in filtered_df.columns:
                amt_col = col
                break
        if amt_col and min_amt is not None and max_amt is not None:
            filtered_df = filtered_df[
                (filtered_df[amt_col] >= min_amt) & 
                (filtered_df[amt_col] <= max_amt)
            ]
    
    return filtered_df

# API Endpoints
@app.post("/login")
async def login(request: LoginRequest):
    """Authenticate user"""
    if request.username == "admin" and request.password == "Admin@123":
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "username": request.username,
                "name": "Admin User"
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process Excel file"""
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Detect file type
        file_type = detect_file_type(file.filename)
        
        # Read and process based on type
        if file_type == "PJPA37":
            df = process_pjpa37(file_path)
        elif file_type == "PJPA38":
            df = process_pjpa38(file_path)
        else:  # PJPA39
            df = process_pjpa39(file_path)
        
        # Store in session
        current_data["df"] = df
        current_data["filename"] = file.filename
        current_data["file_type"] = file_type
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "filename": file.filename,
            "file_type": file_type,
            "rows": len(df),
            "columns": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/files")
async def get_files():
    """Get list of available files in uploads folder"""
    try:
        files = []
        for f in os.listdir(UPLOAD_DIR):
            if f.endswith(('.xlsx', '.xls')):
                file_type = detect_file_type(f)
                files.append({
                    "name": f,
                    "type": file_type,
                    "path": os.path.join(UPLOAD_DIR, f)
                })
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/load-file")
async def load_file(request: Dict[str, str]):
    """Load a specific file from uploads"""
    try:
        filename = request.get("filename")
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Detect file type
        file_type = detect_file_type(filename)
        
        # Process based on type
        if file_type == "PJPA37":
            df = process_pjpa37(file_path)
        elif file_type == "PJPA38":
            df = process_pjpa38(file_path)
        else:  # PJPA39
            df = process_pjpa39(file_path)
        
        # Store in session
        current_data["df"] = df
        current_data["filename"] = filename
        current_data["file_type"] = file_type
        
        return {
            "success": True,
            "message": "File loaded successfully",
            "filename": filename,
            "file_type": file_type,
            "rows": len(df),
            "columns": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading file: {str(e)}")

@app.post("/dashboard-data")
async def get_dashboard_data(filters: Optional[FilterRequest] = None):
    """Get dashboard data with KPIs and charts"""
    try:
        if current_data["df"] is None:
            raise HTTPException(status_code=400, detail="No file loaded")
        
        df = current_data["df"].copy()
        file_type = current_data["file_type"]
        
        # Apply filters
        if filters:
            df = apply_filters(df, filters)
        
        # Calculate KPIs and charts based on file type
        if file_type == "PJPA37":
            result = calculate_pjpa37_dashboard(df)
        elif file_type == "PJPA38":
            result = calculate_pjpa38_dashboard(df)
        else:  # PJPA39
            result = calculate_pjpa39_dashboard(df)
        
        result["filename"] = current_data["filename"]
        result["file_type"] = file_type
        result["total_rows"] = len(df)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating dashboard: {str(e)}")

@app.post("/table-data")
async def get_table_data(request: TableRequest):
    """Get paginated table data"""
    try:
        if current_data["df"] is None:
            raise HTTPException(status_code=400, detail="No file loaded")
        
        df = current_data["df"].copy()
        
        # Apply filters
        if request.filters:
            df = apply_filters(df, request.filters)
        
        # Apply search
        if request.search:
            search_mask = df.astype(str).apply(
                lambda x: x.str.contains(request.search, case=False, na=False)
            ).any(axis=1)
            df = df[search_mask]
        
        # Apply sorting
        if request.sort_column and request.sort_column in df.columns:
            ascending = request.sort_direction == "asc"
            df = df.sort_values(by=request.sort_column, ascending=ascending)
        
        # Pagination
        total_rows = len(df)
        start_idx = (request.page - 1) * request.page_size
        end_idx = start_idx + request.page_size
        paginated_df = df.iloc[start_idx:end_idx]
        
        # Convert to records
        records = paginated_df.fillna("").to_dict(orient="records")
        
        # Clean column names for display
        columns = [{"field": col, "header": col} for col in df.columns]
        
        return {
            "data": records,
            "columns": columns,
            "total_rows": total_rows,
            "page": request.page,
            "page_size": request.page_size,
            "total_pages": (total_rows + request.page_size - 1) // request.page_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting table data: {str(e)}")

@app.get("/filter-options")
async def get_filter_options():
    """Get unique values for filter dropdowns"""
    try:
        if current_data["df"] is None:
            return {
                "employee_id": [],
                "employee_name": [],
                "department": [],
                "policy": [],
                "report_id": [],
                "cluster": [],
                "expense_type": [],
                "state": []
            }
        
        df = current_data["df"]
        options = {}
        
        # Employee ID
        emp_col = "Employee ID" if "Employee ID" in df.columns else "Employee_ID"
        if emp_col in df.columns:
            options["employee_id"] = df[emp_col].dropna().astype(str).unique().tolist()[:100]
        else:
            options["employee_id"] = []
        
        # Employee Name
        name_col = None
        for col in df.columns:
            if "employee" in col.lower() and "name" in col.lower():
                name_col = col
                break
        options["employee_name"] = df[name_col].dropna().unique().tolist()[:100] if name_col else []
        
        # Department
        dept_col = "Department" if "Department" in df.columns else None
        options["department"] = df[dept_col].dropna().unique().tolist() if dept_col else []
        
        # Policy
        policy_col = None
        for col in df.columns:
            if "policy" in col.lower():
                policy_col = col
                break
        options["policy"] = df[policy_col].dropna().unique().tolist() if policy_col else []
        
        # Report ID
        report_col = "Report ID" if "Report ID" in df.columns else "Report_ID"
        if report_col in df.columns:
            options["report_id"] = df[report_col].dropna().astype(str).unique().tolist()[:100]
        else:
            options["report_id"] = []
        
        # Cluster
        cluster_col = "Cluster_ID" if "Cluster_ID" in df.columns else None
        if cluster_col in df.columns:
            options["cluster"] = df[cluster_col].dropna().astype(str).unique().tolist()[:100]
        else:
            options["cluster"] = []
        
        # Expense Type
        exp_col = None
        for col in df.columns:
            if "expense" in col.lower() and "type" in col.lower():
                exp_col = col
                break
        options["expense_type"] = df[exp_col].dropna().unique().tolist() if exp_col else []
        
        # State
        state_col = "State" if "State" in df.columns else None
        options["state"] = df[state_col].dropna().unique().tolist() if state_col else []
        
        return options
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting filter options: {str(e)}")

# Dashboard calculation functions
def calculate_pjpa37_dashboard(df: pd.DataFrame) -> Dict:
    """Calculate KPIs and charts for PJPA37"""
    # KPIs
    total_employees = int(df["Employee ID"].nunique()) if "Employee ID" in df.columns else 0
    total_reports = int(df["Report ID"].nunique()) if "Report ID" in df.columns else 0
    cluster_count = int(df["Cluster_ID"].nunique()) if "Cluster_ID" in df.columns else 0
    total_claims = int(df["Total Claims"].sum()) if "Total Claims" in df.columns else 0
    total_spend = float(df["Total Spend Amount"].sum()) if "Total Spend Amount" in df.columns else 0
    
    anomaly_spend = 0
    anomaly_count = 0
    if "Is_Anomaly" in df.columns and "Total Spend Amount" in df.columns:
        anomaly_df = df[df["Is_Anomaly"] == "Yes"]
        if not anomaly_df.empty:
            # Using .sum() and ensuring we get a scalar. 
            # If multiple columns existed, they are now deduplicated, but we still use float() for safety.
            anomaly_spend = float(anomaly_df["Total Spend Amount"].sum())
            anomaly_count = int(len(anomaly_df))
    
    anomaly_rate = (anomaly_count / len(df) * 100) if not df.empty else 0
    
    # Charts data
    # Total Claims by Employee
    claims_by_emp = []
    if "Employee ID" in df.columns and "Total Claims" in df.columns:
        emp_claims = df.groupby("Employee ID")["Total Claims"].sum().nlargest(10)
        claims_by_emp = [{"category": str(k), "value": float(v)} for k, v in emp_claims.items()]
    
    # Total Spend by Employee
    spend_by_emp = []
    if "Employee ID" in df.columns and "Total Spend Amount" in df.columns:
        emp_spend = df.groupby("Employee ID")["Total Spend Amount"].sum().nlargest(10)
        spend_by_emp = [{"category": str(k), "value": float(v)} for k, v in emp_spend.items()]
    
    # Claims by Policy
    claims_by_policy = []
    policy_col = None
    for col in df.columns:
        if "policy" in col.lower():
            policy_col = col
            break
    if policy_col and "Total Claims" in df.columns:
        policy_claims = df.groupby(policy_col)["Total Claims"].sum()
        claims_by_policy = [{"category": str(k), "value": float(v)} for k, v in policy_claims.items()]
    
    # High Risk Employees
    high_risk = []
    if "Employee ID" in df.columns and "Is_Anomaly" in df.columns:
        risk_df = df[df["Is_Anomaly"] == "Yes"]
        if "Total Spend Amount" in df.columns:
            risk_emp = risk_df.groupby("Employee ID")["Total Spend Amount"].sum().nlargest(10)
            high_risk = [{"category": str(k), "value": float(v)} for k, v in risk_emp.items()]
    
    return {
        "kpis": {
            "total_employees": {"value": total_employees, "label": "Total Employees"},
            "total_reports": {"value": total_reports, "label": "Total Reports"},
            "cluster_count": {"value": cluster_count, "label": "Clusters"},
            "total_claims": {"value": total_claims, "label": "Total Claims"},
            "total_spend": {"value": total_spend, "label": "Total Spend", "is_currency": True},
            "anomaly_spend": {"value": anomaly_spend, "label": "Anomaly Spend", "is_currency": True},
            "anomaly_rate": {"value": round(anomaly_rate, 2), "label": "Anomaly Rate %", "is_percentage": True}
        },
        "charts": {
            "claims_by_employee": claims_by_emp,
            "spend_by_employee": spend_by_emp,
            "claims_by_policy": claims_by_policy,
            "high_risk_employees": high_risk
        }
    }

def calculate_pjpa38_dashboard(df: pd.DataFrame) -> Dict:
    """Calculate KPIs and charts for PJPA38"""
    # KPIs
    total_employees = int(df["Employee ID"].nunique()) if "Employee ID" in df.columns else 0
    
    rare_count = 0
    rare_spend = 0
    if "Flag" in df.columns:
        rare_df = df[df["Flag"] == "Rare"]
        rare_count = int(len(rare_df))
        if "Approved Amount" in df.columns and not rare_df.empty:
            rare_spend = float(rare_df["Approved Amount"].sum())
    
    total_trips = int(df["Mode_Count"].sum()) if "Mode_Count" in df.columns else 0
    total_spend = float(df["Approved Amount"].sum()) if "Approved Amount" in df.columns else 0
    
    odd_travel_pct = (rare_count / total_trips * 100) if total_trips > 0 else 0
    
    # Charts data
    # Flag distribution
    flag_dist = []
    if "Flag" in df.columns:
        flag_counts = df["Flag"].value_counts()
        flag_dist = [{"category": str(k), "value": int(v)} for k, v in flag_counts.items()]
    
    # Rare trips by expense type
    rare_by_expense = []
    exp_col = None
    for col in df.columns:
        if "expense" in col.lower() and "type" in col.lower():
            exp_col = col
            break
    if exp_col and "Flag" in df.columns:
        rare_exp = df[df["Flag"] == "Rare"].groupby(exp_col).size()
        rare_by_expense = [{"category": str(k), "value": int(v)} for k, v in rare_exp.items()]
    
    # Rare travellers
    rare_travellers = []
    if "Employee ID" in df.columns and "Flag" in df.columns:
        rare_emp = df[df["Flag"] == "Rare"].groupby("Employee ID").size().nlargest(10)
        rare_travellers = [{"category": str(k), "value": int(v)} for k, v in rare_emp.items()]
    
    # Amount vs usage scatter
    scatter_data = []
    if "Approved Amount" in df.columns and "Mode_Count" in df.columns:
        scatter_df = df[["Approved Amount", "Mode_Count"]].dropna()
        scatter_data = [
            {"x": float(row["Mode_Count"]), "y": float(row["Approved Amount"])}
            for _, row in scatter_df.iterrows()
        ][:100]  # Limit to 100 points
    
    return {
        "kpis": {
            "total_employees": {"value": total_employees, "label": "Total Employees"},
            "rare_count": {"value": rare_count, "label": "Rare Trip Count"},
            "total_trips": {"value": total_trips, "label": "Total Trip Count"},
            "rare_spend": {"value": rare_spend, "label": "Rare Spend", "is_currency": True},
            "total_spend": {"value": total_spend, "label": "Total Spend", "is_currency": True},
            "odd_travel_pct": {"value": round(odd_travel_pct, 2), "label": "Odd Travel %", "is_percentage": True}
        },
        "charts": {
            "flag_distribution": flag_dist,
            "rare_by_expense": rare_by_expense,
            "rare_travellers": rare_travellers,
            "amount_vs_usage": scatter_data
        }
    }

def calculate_pjpa39_dashboard(df: pd.DataFrame) -> Dict:
    """Calculate KPIs and charts for PJPA39"""
    # KPIs
    total_employees = int(df["Employee ID"].nunique()) if "Employee ID" in df.columns else 0
    dept_count = int(df["Department"].nunique()) if "Department" in df.columns else 0
    location_count = int(df["State"].nunique()) if "State" in df.columns else 0
    
    # Average overdue calculation
    avg_overdue = 0
    if "Separation Date" in df.columns:
        df["Separation Date"] = pd.to_datetime(df["Separation Date"], errors='coerce')
        today = datetime.now()
        overdue_df = df[df["Separation Date"] < today].copy()
        if not overdue_df.empty:
            overdue_df["days_diff"] = (today - overdue_df["Separation Date"]).dt.days
            avg_overdue = float(overdue_df["days_diff"].mean())
    
    # Charts data
    # Employees by department
    emp_by_dept = []
    if "Department" in df.columns and "Employee ID" in df.columns:
        dept_emp = df.groupby("Department")["Employee ID"].nunique()
        emp_by_dept = [{"category": str(k), "value": int(v)} for k, v in dept_emp.items()]
    
    # Aging bucket
    aging_data = []
    if "Separation Date" in df.columns:
        df["Separation Date"] = pd.to_datetime(df["Separation Date"], errors='coerce')
        today = datetime.now()
        df["days_overdue"] = (today - df["Separation Date"]).dt.days
        
        buckets = {
            "0-30 Days": int(len(df[df["days_overdue"] <= 30])),
            "31-60 Days": int(len(df[(df["days_overdue"] > 30) & (df["days_overdue"] <= 60)])),
            "61-90 Days": int(len(df[(df["days_overdue"] > 60) & (df["days_overdue"] <= 90)])),
            "90+ Days": int(len(df[df["days_overdue"] > 90]))
        }
        aging_data = [{"category": k, "value": v} for k, v in buckets.items()]
    
    # Year trend
    year_trend = []
    year_col = None
    for col in df.columns:
        if "year" in col.lower():
            year_col = col
            break
    if year_col and "Employee ID" in df.columns:
        year_counts = df.groupby(year_col)["Employee ID"].nunique()
        year_trend = [{"category": str(k), "value": int(v)} for k, v in year_counts.items()]
    
    return {
        "kpis": {
            "total_employees": {"value": total_employees, "label": "Total Employees"},
            "dept_count": {"value": dept_count, "label": "Departments"},
            "location_count": {"value": location_count, "label": "Locations"},
            "avg_overdue": {"value": round(avg_overdue, 1), "label": "Avg Overdue Days"}
        },
        "charts": {
            "emp_by_department": emp_by_dept,
            "aging_bucket": aging_data,
            "year_trend": year_trend
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
