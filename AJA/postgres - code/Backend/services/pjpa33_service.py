import pandas as pd
import os

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA33_Generated.xlsx"
SKIP_ROWS = 4

def _load_data():
    path = os.path.join(OUTPUT_DIR, FILE_NAME)
    if not os.path.exists(path):
        return None
    df = pd.read_excel(path, skiprows=SKIP_ROWS)
    df.columns = df.columns.astype(str).str.strip()
    
    # Parse numeric
    def clean_amount(val):
        if pd.isna(val) or val == '': return 0
        s = str(val).replace('₹', '').replace(',', '').strip()
        try:
            return float(s)
        except:
            return 0
            
    for col in ['Count(Report Id)', 'Sum(Report Total)', 'Report Total', 'Amount Due Employee', 'Amount Approved']:
        if col in df.columns:
            if col.startswith('Count'):
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = df[col].apply(clean_amount)
            
    # Parse dates
    for col in ['Submit_Date_2', 'Submit Date', 'Report Start Date', 'Report End Date', 'Report Date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    return df

def apply_filters(df, params):
    if df is None or df.empty:
        return df
    if params.get('employee_id'):
        df = df[df['Employee ID'].astype(str) == str(params['employee_id'])]
    if params.get('employee'):
        df = df[df['Employee Name'].astype(str) == str(params['employee'])]
    if params.get('report_id'):
        df = df[df['Report Id'].astype(str) == str(params['report_id'])]
    if params.get('approval_status'):
        df = df[df['Approval Status'].astype(str) == str(params['approval_status'])]
    if params.get('payment_status'):
        df = df[df['Payment Status'].astype(str) == str(params['payment_status'])]
    if params.get('startDate'):
        df = df[df['Submit Date'] >= pd.to_datetime(params['startDate'])]
    if params.get('endDate'):
        df = df[df['Submit Date'] <= pd.to_datetime(params['endDate'])]
    if params.get('search'):
        search = str(params['search']).lower()
        mask = df.apply(lambda row: any(search in str(v).lower() for v in row), axis=1)
        df = df[mask]
    return df

def get_kpis(df):
    if df is None or df.empty:
        return {
            "distinct_employee_id": 0, "distinct_employee_name": 0, "approval_status_count": 0,
            "payment_status_count": 0, "total_report_amount": 0, "amount_due_employee": 0,
            "amount_approved": 0
        }
    
    emp_ids = int(df['Employee ID'].nunique()) if 'Employee ID' in df.columns else 0
    emp_names = int(df['Employee Name'].nunique()) if 'Employee Name' in df.columns else 0
    app_status = int(df['Approval Status'].count()) if 'Approval Status' in df.columns else 0
    pay_status = int(df['Payment Status'].count()) if 'Payment Status' in df.columns else 0
    
    rep_total = float(df['Report Total'].sum()) if 'Report Total' in df.columns else 0
    amt_due = float(df['Amount Due Employee'].sum()) if 'Amount Due Employee' in df.columns else 0
    amt_app = float(df['Amount Approved'].sum()) if 'Amount Approved' in df.columns else 0

    return {
        "distinct_employee_id": emp_ids,
        "distinct_employee_name": emp_names,
        "approval_status_count": app_status,
        "payment_status_count": pay_status,
        "total_report_amount": round(rep_total, 2),
        "amount_due_employee": round(amt_due, 2),
        "amount_approved": round(amt_app, 2)
    }

def get_filters(df):
    if df is None or df.empty:
        return {
            "employee_ids": [], "employees": [], "report_ids": [],
            "approval_statuses": [], "payment_statuses": []
        }
    def safe_unique(col):
        if col in df.columns:
            return sorted([str(x) for x in df[col].dropna().unique().tolist() if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    return {
        "employee_ids": safe_unique('Employee ID'),
        "employees": safe_unique('Employee Name'),
        "report_ids": safe_unique('Report Id'),
        "approval_statuses": safe_unique('Approval Status'),
        "payment_statuses": safe_unique('Payment Status')
    }

def get_chart_data(df):
    if df is None or df.empty:
        return {
            "report_name_count": [], "employee_report_count": [],
            "submit_date_trend": [], "policy_amount": [],
            "employee_amount": [], "approval_status_distribution": []
        }

    # 1. Horizontal Bar: Report Count by Report Name
    rep_name_data = []
    if 'Report Name' in df.columns and 'Report Id' in df.columns:
        grp = df.groupby('Report Name')['Report Id'].count().reset_index()
        grp = grp.sort_values('Report Id', ascending=False).head(15)
        rep_name_data = [{"report_name": str(r['Report Name']), "count": int(r['Report Id'])} for _, r in grp.iterrows()]

    # 2. Horizontal Bar: Report Count by Employee
    emp_count_data = []
    if 'Employee Name' in df.columns and 'Report Id' in df.columns:
        grp = df.groupby('Employee Name')['Report Id'].count().reset_index()
        grp = grp.sort_values('Report Id', ascending=False).head(15)
        emp_count_data = [{"employee": str(r['Employee Name']), "count": int(r['Report Id'])} for _, r in grp.iterrows()]

    # 3. Line Chart: Report Count by Submit Date
    date_data = []
    if 'Submit Date' in df.columns and 'Report Id' in df.columns:
        temp = df.dropna(subset=['Submit Date']).copy()
        if not temp.empty:
            temp['Date'] = temp['Submit Date'].dt.strftime('%Y-%m-%d')
            grp = temp.groupby('Date')['Report Id'].count().reset_index().sort_values('Date')
            date_data = [{"date": str(r['Date']), "count": int(r['Report Id'])} for _, r in grp.iterrows()]

    # 4. Column Chart: Total Amount by Policy
    policy_data = []
    if 'Policy' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Policy')['Amount Approved'].sum().reset_index()
        grp = grp.sort_values('Amount Approved', ascending=False)
        policy_data = [{"policy": str(r['Policy']), "amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 5. Horizontal Bar: Total Amount by Employee
    emp_amt_data = []
    if 'Employee Name' in df.columns and 'Report Total' in df.columns:
        grp = df.groupby('Employee Name')['Report Total'].sum().reset_index()
        grp = grp.sort_values('Report Total', ascending=False).head(15)
        emp_amt_data = [{"employee": str(r['Employee Name']), "amount": float(r['Report Total'])} for _, r in grp.iterrows()]

    # 6. Donut Chart: Report Count by Approval Status
    app_status_data = []
    if 'Approval Status' in df.columns and 'Report Id' in df.columns:
        grp = df.groupby('Approval Status')['Report Id'].count().reset_index()
        app_status_data = [{"name": str(r['Approval Status']), "value": int(r['Report Id'])} for _, r in grp.iterrows()]

    return {
        "report_count_by_name": rep_name_data,
        "report_count_by_employee": emp_count_data,
        "report_count_by_date": date_data,
        "total_amount_by_policy": policy_data,
        "total_amount_by_employee": emp_amt_data,
        "report_count_by_approval_status": app_status_data
    }

def get_table_data(df, page=1, page_size=15, search=None):
    if df is None or df.empty:
        return {"data": [], "total": 0}
    
    if search:
        search_lower = search.lower()
        mask = df.apply(lambda row: any(search_lower in str(v).lower() for v in row), axis=1)
        df = df[mask]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end].copy()

    for col in page_df.columns:
        if pd.api.types.is_datetime64_any_dtype(page_df[col]):
            page_df[col] = page_df[col].dt.strftime('%Y-%m-%d')
    
    page_df = page_df.fillna("N/A")

    return {"data": page_df.to_dict(orient="records"), "total": total}
