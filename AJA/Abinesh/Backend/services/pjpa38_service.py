import pandas as pd
import os

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA38_Generated.xlsx"
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
            
    for col in ['Approved Amount', 'Mode_Count', 'Usage_Pct', 'Total_Trips']:
        if col in df.columns:
            if 'Amount' in col or 'Pct' in col:
                df[col] = df[col].apply(clean_amount)
            else:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
    return df

def apply_filters(df, params):
    if df is None or df.empty:
        return df
    if params.get('employee_id'):
        df = df[df['Employee'].astype(str) == str(params['employee_id'])]
    if params.get('report_id'):
        df = df[df['Report ID'].astype(str) == str(params['report_id'])]
    if params.get('expense_type'):
        df = df[df['Expense Type'].astype(str) == str(params['expense_type'])]
    
    if params.get('startDate') and 'Submit Date' in df.columns:
        df = df[df['Submit Date'] >= pd.to_datetime(params['startDate'])]
    if params.get('endDate') and 'Submit Date' in df.columns:
        df = df[df['Submit Date'] <= pd.to_datetime(params['endDate'])]
        
    if params.get('search'):
        search = str(params['search']).lower()
        mask = df.apply(lambda row: any(search in str(v).lower() for v in row), axis=1)
        df = df[mask]
    return df

def get_kpis(df):
    if df is None or df.empty:
        return {
            "distinct_employee_id": 0, "count_of_report_id": 0, "amount_approved": 0,
            "total_odd_modes": 0, "max_cost_per_odd_mode": 0
        }
    
    distinct_employee_id = int(df['Employee'].nunique()) if 'Employee' in df.columns else 0
    count_of_report_id = int(df['Report ID'].nunique()) if 'Report ID' in df.columns else 0
    amount_approved = float(df['Approved Amount'].sum()) if 'Approved Amount' in df.columns else 0
    
    rare_df = df[df['Flag'].astype(str).str.upper() == 'RARE'] if 'Flag' in df.columns else pd.DataFrame()
    total_odd_modes = int(rare_df['Mode_Count'].sum()) if 'Mode_Count' in rare_df.columns else 0
    max_cost = float(rare_df['Approved Amount'].max()) if not rare_df.empty and 'Approved Amount' in rare_df.columns else 0

    return {
        "distinct_employee_id": distinct_employee_id,
        "count_of_report_id": count_of_report_id,
        "amount_approved": round(amount_approved, 2),
        "total_odd_modes": total_odd_modes,
        "max_cost_per_odd_mode": round(max_cost if pd.notna(max_cost) else 0, 2)
    }

def get_filters(df):
    if df is None or df.empty:
        return {
            "employee_ids": [], "report_ids": [], "expense_types": []
        }
    def safe_unique(col):
        if col in df.columns:
            return sorted([str(x) for x in df[col].dropna().unique().tolist() if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    return {
        "employee_ids": safe_unique('Employee'),
        "report_ids": safe_unique('Report ID'),
        "expense_types": safe_unique('Expense Type')
    }

def get_chart_data(df):
    if df is None or df.empty:
        return {
            "odd_mode_freq": [], "spend_odd_modes": [],
            "top_employees_odd": [], "avg_spend_odd_mode": []
        }

    rare_df = df[df.get('Flag', '').astype(str).str.upper() == 'RARE']

    # 1. Column Chart: Odd mode Frequency by Expense Type
    odd_mode_freq = []
    if not rare_df.empty and 'Expense Type' in rare_df.columns and 'Report ID' in rare_df.columns:
        grp = rare_df.groupby('Expense Type')['Report ID'].nunique().reset_index(name='Count')
        grp = grp.sort_values('Count', ascending=False)
        odd_mode_freq = [{"expense_type": str(r['Expense Type']), "count": int(r['Count'])} for _, r in grp.iterrows()]

    # 2. Pie Chart: Spend on Odd Modes by Expense Type
    spend_odd_modes = []
    if not rare_df.empty and 'Expense Type' in rare_df.columns and 'Approved Amount' in rare_df.columns:
        grp = rare_df.groupby('Expense Type')['Approved Amount'].sum().reset_index()
        spend_odd_modes = [{"expense_type": str(r['Expense Type']), "amount": float(r['Approved Amount'])} for _, r in grp.iterrows()]

    # 3. Horizontal Bar: Top Employees using odd modes
    top_employees_odd = []
    if not rare_df.empty and 'Employee' in rare_df.columns and 'Report ID' in rare_df.columns:
        grp = rare_df.groupby('Employee')['Report ID'].nunique().reset_index(name='Count')
        grp = grp.sort_values('Count', ascending=False).head(15)
        top_employees_odd = [{"employee": str(r['Employee']), "count": int(r['Count'])} for _, r in grp.iterrows()]

    # 4. Column Chart: Average Spend per Odd mode
    avg_spend_odd_mode = []
    if not rare_df.empty and 'Expense Type' in rare_df.columns and 'Approved Amount' in rare_df.columns:
        grp = rare_df.groupby('Expense Type')['Approved Amount'].mean().reset_index()
        grp = grp.sort_values('Approved Amount', ascending=False)
        avg_spend_odd_mode = [{"expense_type": str(r['Expense Type']), "avg_amount": float(r['Approved Amount'])} for _, r in grp.iterrows()]

    return {
        "odd_mode_freq": odd_mode_freq,
        "spend_odd_modes": spend_odd_modes,
        "top_employees_odd": top_employees_odd,
        "avg_spend_odd_mode": avg_spend_odd_mode
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
