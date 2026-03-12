import pandas as pd
import os

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA35_Generated.xlsx"
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
            
    for col in ['Amount Approved', 'Count_Report', 'Count(Employee ID)']:
        if col in df.columns:
            if col.startswith('Count'):
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = df[col].apply(clean_amount)
            
    # Parse dates
    for col in ['Submit Date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    return df

def apply_filters(df, params):
    if df is None or df.empty:
        return df
    if params.get('employee_id'):
        df = df[df['Employee ID'].astype(str) == str(params['employee_id'])]
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
            "distinct_employee_id": 0, "count_of_report_id": 0,
            "report_total": 0, "amount_due_employee": 0, "amount_approved": 0
        }
    
    unique_emp = int(df['Employee ID'].nunique()) if 'Employee ID' in df.columns else 0
    total_rep = int(df['Report Id'].count()) if 'Report Id' in df.columns else 0
    rep_total = float(df['Report Total'].sum()) if 'Report Total' in df.columns else 0
    amt_due = float(df['Amount Due Employee'].sum()) if 'Amount Due Employee' in df.columns else 0
    amt_app = float(df['Amount Approved'].sum()) if 'Amount Approved' in df.columns else 0

    return {
        "distinct_employee_id": unique_emp,
        "count_of_report_id": total_rep,
        "report_total": round(rep_total, 2),
        "amount_due_employee": round(amt_due, 2),
        "amount_approved": round(amt_app, 2)
    }

def get_filters(df):
    if df is None or df.empty:
        return {
            "employee_ids": [], "report_ids": [], "approval_statuses": [], "payment_statuses": []
        }
    def safe_unique(col):
        if col in df.columns:
            return sorted([str(x) for x in df[col].dropna().unique().tolist() if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    return {
        "employee_ids": safe_unique('Employee ID'),
        "report_ids": safe_unique('Report Id'),
        "approval_statuses": safe_unique('Approval Status'),
        "payment_statuses": safe_unique('Payment Status')
    }

def get_chart_data(df):
    if df is None or df.empty:
        return {
            "policy_amount_approved": [], "amount_spent_employee": [],
            "amount_spent_date": [], "employee_count_policy": [],
            "duplicate_count_report": [], "duplicate_count_employee": []
        }

    # 1. Pie Chart: Policy by Amount Approved
    pol_amt_app = []
    if 'Policy' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Policy')['Amount Approved'].sum().reset_index()
        pol_amt_app = [{"name": str(r['Policy']), "value": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 2. Horizontal Bar: Amount Spent by Employee
    amt_spent_emp = []
    if 'Employee Name' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Employee Name')['Amount Approved'].sum().reset_index()
        grp = grp.sort_values('Amount Approved', ascending=False).head(15)
        amt_spent_emp = [{"employee": str(r['Employee Name']), "amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 3. Area Chart: Amount Spent by Date
    amt_spent_date = []
    if 'Submit Date' in df.columns and 'Amount Approved' in df.columns:
        temp = df.dropna(subset=['Submit Date']).copy()
        if not temp.empty:
            temp['Date'] = temp['Submit Date'].dt.strftime('%Y-%m-%d')
            grp = temp.groupby('Date')['Amount Approved'].sum().reset_index().sort_values('Date')
            amt_spent_date = [{"date": str(r['Date']), "amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 4. Horizontal Bar: Count of Employee by Policy
    emp_cnt_pol = []
    if 'Policy' in df.columns and 'Employee ID' in df.columns:
        grp = df.groupby('Policy')['Employee ID'].nunique().reset_index(name='Count')
        grp = grp.sort_values('Count', ascending=False)
        emp_cnt_pol = [{"policy": str(r['Policy']), "count": int(r['Count'])} for _, r in grp.iterrows()]

    # 5. Column Chart: Duplicate Report Count by Report ID
    dup_cnt_rep = []
    if 'Report Id' in df.columns and 'Count_Report' in df.columns:
        grp = df.groupby('Report Id')['Count_Report'].sum().reset_index()
        grp = grp.sort_values('Count_Report', ascending=False).head(15)
        dup_cnt_rep = [{"report_id": str(r['Report Id']), "count": int(r['Count_Report'])} for _, r in grp.iterrows()]

    # 6. Column Chart: Duplicate Reports by Employee
    dup_cnt_emp = []
    if 'Employee Name' in df.columns and 'Count_Report' in df.columns:
        grp = df.groupby('Employee Name')['Count_Report'].sum().reset_index()
        grp = grp.sort_values('Count_Report', ascending=False).head(15)
        dup_cnt_emp = [{"employee": str(r['Employee Name']), "count": int(r['Count_Report'])} for _, r in grp.iterrows()]

    return {
        "policy_amount_approved": pol_amt_app,
        "amount_spent_employee": amt_spent_emp,
        "amount_spent_date": amt_spent_date,
        "employee_count_policy": emp_cnt_pol,
        "duplicate_count_report": dup_cnt_rep,
        "duplicate_count_employee": dup_cnt_emp
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
