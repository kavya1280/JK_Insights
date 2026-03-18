import pandas as pd
import os

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA34_Generated.xlsx"
SKIP_ROWS = 5

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
            
    for col in ['Report Id', 'Amount Approved']:
        if col in df.columns:
            if col == 'Report Id':
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = df[col].apply(clean_amount)
            
    return df

def apply_filters(df, params):
    if df is None or df.empty:
        return df
    if params.get('employee_id'):
        df = df[df['Employee ID'].astype(str) == str(params['employee_id'])]
    if params.get('report_id'):
        df = df[df['Report Id'].astype(str) == str(params['report_id'])]
    if params.get('report_number'):
        df = df[df['Report Number'].astype(str) == str(params['report_number'])]
    if params.get('payment_status'):
        df = df[df['Payment Status'].astype(str) == str(params['payment_status'])]
    if params.get('policy'):
        df = df[df['Policy'].astype(str) == str(params['policy'])]
    if params.get('month'):
        df = df[df['Month (Name)'].astype(str) == str(params['month'])]
    
    # Date Filtering - ensure Submit_Date2 is compared as datetime
    if 'Submit_Date2' in df.columns:
        submit_dates = pd.to_datetime(df['Submit_Date2'], errors='coerce')
        if params.get('startDate'):
            start_date = pd.to_datetime(params['startDate'], errors='coerce')
            if not pd.isna(start_date):
                df = df[submit_dates >= start_date]
        if params.get('endDate'):
            end_date = pd.to_datetime(params['endDate'], errors='coerce')
            if not pd.isna(end_date):
                df = df[submit_dates <= end_date]

    if params.get('search'):
        search = str(params['search']).lower()
        mask = df.apply(lambda row: any(search in str(v).lower() for v in row), axis=1)
        df = df[mask]
    return df

def get_kpis(df):
    if df is None or df.empty:
        return {
            "distinct_employee_id": 0, "distinct_report_id": 0, "total_spend": 0,
            "avg_claim_value": 0, "avg_frequency": 0, "monthly_claim_count": 0,
            "monthly_total_amount": 0
        }
    
    emp_ids = int(df['Employee ID'].nunique()) if 'Employee ID' in df.columns else 0
    rep_ids = int(df['Report Id'].nunique()) if 'Report Id' in df.columns else 0
    total_spend = float(df['Amount Approved'].sum()) if 'Amount Approved' in df.columns else 0
    avg_claim = float(df['Amount Approved'].mean()) if 'Amount Approved' in df.columns else 0
    
    # Avg Frequency: Total Reports / Total Employees
    avg_freq = rep_ids / emp_ids if emp_ids > 0 else 0
    
    # Monthly averages (Average per month across the dataset)
    monthly_count = 0
    monthly_amt = 0
    if 'Month (Name)' in df.columns:
        months_count = df['Month (Name)'].nunique()
        if months_count > 0:
            monthly_count = rep_ids / months_count
            monthly_amt = total_spend / months_count

    return {
        "distinct_employee_id": emp_ids,
        "distinct_report_id": rep_ids,
        "total_spend": round(total_spend, 2),
        "avg_claim_value": round(avg_claim, 2),
        "avg_frequency": round(avg_freq, 2),
        "monthly_claim_count": round(monthly_count, 1),
        "monthly_total_amount": round(monthly_amt, 2)
    }

def get_filters(df):
    if df is None or df.empty:
        return {
            "employee_ids": [], "report_ids": [], "report_numbers": [],
            "payment_statuses": [], "policies": [], "months": []
        }
    def safe_unique(col):
        if col in df.columns:
            return sorted([str(x) for x in df[col].dropna().unique().tolist() if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    return {
        "employee_ids": safe_unique('Employee ID'),
        "report_ids": safe_unique('Report Id'),
        "report_numbers": safe_unique('Report Number'),
        "payment_statuses": safe_unique('Payment Status'),
        "policies": safe_unique('Policy'),
        "months": safe_unique('Month (Name)')
    }

def get_chart_data(df):
    if df is None or df.empty:
        return {
            "monthly_claim_amount_employee": [], "frequency_cost": [],
            "report_claim_map": [], "monthly_claim_count": [],
            "avg_claim_employee": [], "policy_claim_amount": []
        }

    # 1. Monthly Claim Amount by Employee (Horizontal Bar)
    monthly_amt_emp = []
    if 'Employee Name' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Employee Name')['Amount Approved'].sum().reset_index()
        grp = grp.sort_values('Amount Approved', ascending=False).head(15)
        monthly_amt_emp = [{"employee": str(r['Employee Name']), "amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 2. Frequency vs Cost (Horizontal Bar) - using Total Amount Approved per employee
    freq_cost_data = []
    if 'Employee Name' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Employee Name').agg({'Amount Approved': ['count', 'sum']}).reset_index()
        grp.columns = ['Employee Name', 'count', 'total']
        grp = grp.sort_values('total', ascending=False).head(15)
        freq_cost_data = [{"employee": str(r['Employee Name']), "amount": float(r['total']), "count": int(r['count'])} for _, r in grp.iterrows()]

    # 3. Report ID Claim Map (Column Chart)
    report_map = []
    if 'Report Id' in df.columns:
        grp = df.groupby('Report Id').size().reset_index(name='count')
        grp = grp.sort_values('count', ascending=False).head(20)
        report_map = [{"report_id": str(r['Report Id']), "count": int(r['count'])} for _, r in grp.iterrows()]

    # 4. Monthly Claim Count (Area Chart)
    monthly_trend = []
    if 'Month (Name)' in df.columns:
        month_order = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        grp = df.groupby('Month (Name)').size().reset_index(name='count')
        # Sort by calendar month order
        grp['Month (Name)'] = pd.Categorical(grp['Month (Name)'], categories=month_order, ordered=True)
        grp = grp.sort_values('Month (Name)')
        monthly_trend = [{"month": str(r['Month (Name)']), "count": int(r['count'])} for _, r in grp.iterrows()]

    # 5. Average Claim Amount by Employee (Horizontal Bar)
    avg_amt_emp = []
    if 'Employee Name' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Employee Name')['Amount Approved'].mean().reset_index()
        grp = grp.sort_values('Amount Approved', ascending=False).head(15)
        avg_amt_emp = [{"employee": str(r['Employee Name']), "avg_amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 6. Total Claim Amount by Policy (Donut Chart)
    policy_donut = []
    if 'Policy' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Policy')['Amount Approved'].sum().reset_index()
        policy_donut = [{"name": str(r['Policy']), "value": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    return {
        "monthly_claim_amount_employee": monthly_amt_emp,
        "frequency_cost": freq_cost_data,
        "report_claim_map": report_map,
        "monthly_claim_count": monthly_trend,
        "avg_claim_employee": avg_amt_emp,
        "policy_claim_amount": policy_donut
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
