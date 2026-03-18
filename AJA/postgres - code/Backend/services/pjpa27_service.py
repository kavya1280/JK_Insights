import pandas as pd
import os
import numpy as np

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA27_Generated.xlsx"
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
            
    for col in ['Amount Approved', 'Report Total', 'Amount Due Employee', 'Notice Period Days']:
        if col in df.columns:
            if col == 'Notice Period Days':
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = df[col].apply(clean_amount)
    # Parse dates
    for col in ['Submit Date', 'Report Date', 'Date of Resignation', 'Employee Last Working Date',
                 'Report Start Date', 'Report End Date', 'DOJ']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    return df

def apply_filters(df, params):
    if df is None or df.empty:
        return df
    if params.get('employee_id'):
        df = df[df['Employee ID'].astype(str) == str(params['employee_id'])]
    if params.get('payment_status'):
        df = df[df['Payment Status'].astype(str) == str(params['payment_status'])]
    if params.get('risk_category'):
        df = df[df['Risk Category'].astype(str) == str(params['risk_category'])]
    if params.get('policy'):
        df = df[df['Policy'].astype(str) == str(params['policy'])]
    if params.get('designation'):
        df = df[df['Designation Name'].astype(str) == str(params['designation'])]
    if params.get('search'):
        search = str(params['search']).lower()
        mask = df.apply(lambda row: any(search in str(v).lower() for v in row), axis=1)
        df = df[mask]
    return df

def get_kpis(df):
    if df is None or df.empty:
        return {
            "total_employees": 0, "critical_risk_count": 0, "high_risk_count": 0,
            "avg_spend_per_person": 0, "high_risk_spend": 0, "critical_risk_spend": 0,
            "total_amount_approved": 0
        }
    emp_col = 'Employee ID' if 'Employee ID' in df.columns else None
    amt_col = 'Amount Approved' if 'Amount Approved' in df.columns else None
    risk_col = 'Risk Category' if 'Risk Category' in df.columns else None

    total_emp = int(df[emp_col].nunique()) if emp_col else 0
    total_amt = float(df[amt_col].sum()) if amt_col else 0

    critical_count = int(df[df[risk_col].astype(str).str.upper() == 'CRITICAL'].shape[0]) if risk_col else 0
    high_count = int(df[df[risk_col].astype(str).str.upper() == 'HIGH'].shape[0]) if risk_col else 0

    critical_spend = float(df[df[risk_col].astype(str).str.upper() == 'CRITICAL'][amt_col].sum()) if (risk_col and amt_col) else 0
    high_spend = float(df[df[risk_col].astype(str).str.upper() == 'HIGH'][amt_col].sum()) if (risk_col and amt_col) else 0

    avg_spend = total_amt / total_emp if total_emp > 0 else 0

    return {
        "total_employees": total_emp,
        "critical_risk_count": critical_count,
        "high_risk_count": high_count,
        "avg_spend_per_person": round(avg_spend, 2),
        "high_risk_spend": round(high_spend, 2),
        "critical_risk_spend": round(critical_spend, 2),
        "total_amount_approved": round(total_amt, 2)
    }

def get_filters(df):
    if df is None or df.empty:
        return {
            "employee_ids": [], "payment_statuses": [], "risk_categories": [],
            "policies": [], "designations": []
        }
    def safe_unique(col):
        if col in df.columns:
            return sorted([str(x) for x in df[col].dropna().unique().tolist() if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    return {
        "employee_ids": safe_unique('Employee ID'),
        "payment_statuses": safe_unique('Payment Status'),
        "risk_categories": safe_unique('Risk Category'),
        "policies": safe_unique('Policy'),
        "designations": safe_unique('Designation Name')
    }

def get_chart_data(df):
    if df is None or df.empty:
        return {
            "risk_distribution": [], "employee_amount": [],
            "separation_days": [], "policy_distribution": [],
            "designation_amount": [], "resignation_trend": []
        }
    amt_col = 'Amount Approved'

    # 1. Donut: Amount by Risk Category
    risk_data = []
    if 'Risk Category' in df.columns and amt_col in df.columns:
        grp = df.groupby('Risk Category')[amt_col].sum().reset_index()
        risk_data = [{"name": str(r['Risk Category']), "value": float(r[amt_col])} for _, r in grp.iterrows()]

    # 2. Horizontal Bar: Amount by Employee (top 15)
    emp_data = []
    if 'Employee Name' in df.columns and amt_col in df.columns:
        grp = df.groupby('Employee Name')[amt_col].sum().reset_index()
        grp = grp.sort_values(amt_col, ascending=False).head(15)
        emp_data = [{"employee": str(r['Employee Name']), "amount": float(r[amt_col])} for _, r in grp.iterrows()]

    # 3. Vertical Bar: Amount by Notice Period Days (bucketed)
    sep_data = []
    if 'Notice Period Days' in df.columns and amt_col in df.columns:
        temp = df[df['Notice Period Days'] > 0].copy()
        if not temp.empty:
            bins = [0, 15, 30, 45, 60, 75, 90, 120, 180, 365, float('inf')]
            labels = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-120', '121-180', '181-365', '365+']
            temp['Bucket'] = pd.cut(temp['Notice Period Days'], bins=bins, labels=labels, right=True)
            grp = temp.groupby('Bucket', observed=True)[amt_col].sum().reset_index()
            sep_data = [{"category": str(r['Bucket']), "amount": float(r[amt_col])} for _, r in grp.iterrows()]

    # 4. Pie: Amount by Policy
    policy_data = []
    if 'Policy' in df.columns and amt_col in df.columns:
        grp = df.groupby('Policy')[amt_col].sum().reset_index()
        policy_data = [{"name": str(r['Policy']), "value": float(r[amt_col])} for _, r in grp.iterrows()]

    # 5. Horizontal Bar: Amount by Designation
    desig_data = []
    if 'Designation Name' in df.columns and amt_col in df.columns:
        grp = df.groupby('Designation Name')[amt_col].sum().reset_index()
        grp = grp.sort_values(amt_col, ascending=False).head(15)
        desig_data = [{"designation": str(r['Designation Name']), "amount": float(r[amt_col])} for _, r in grp.iterrows()]

    # 6. Line: Amount by Date of Resignation (monthly)
    resign_data = []
    if 'Date of Resignation' in df.columns and amt_col in df.columns:
        temp = df.dropna(subset=['Date of Resignation']).copy()
        if not temp.empty:
            temp['Month'] = temp['Date of Resignation'].dt.to_period('M').astype(str)
            grp = temp.groupby('Month')[amt_col].sum().reset_index().sort_values('Month')
            resign_data = [{"month": str(r['Month']), "amount": float(r[amt_col])} for _, r in grp.iterrows()]

    return {
        "risk_distribution": risk_data,
        "employee_amount": emp_data,
        "separation_days": sep_data,
        "policy_distribution": policy_data,
        "designation_amount": desig_data,
        "resignation_trend": resign_data
    }

def get_table_data(df, page=1, page_size=15, search=None):
    if df is None or df.empty:
        return {"data": [], "total": 0}
    
    if search:
        search_lower = search.lower()
        mask = df.apply(lambda row: any(search_lower in str(v).lower() for v in row), axis=1)
        df = df[mask]

    total = len(df)

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end].copy()

    # Convert dates to strings
    for col in page_df.columns:
        if pd.api.types.is_datetime64_any_dtype(page_df[col]):
            page_df[col] = page_df[col].dt.strftime('%Y-%m-%d')
    
    page_df = page_df.fillna("N/A")

    return {"data": page_df.to_dict(orient="records"), "total": total}
