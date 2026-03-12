import pandas as pd
import os

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA37_Generated.xlsx"
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
            
    for col in ['Amount Approved', 'Is_Anomaly']:
        if col in df.columns:
            if col == 'Is_Anomaly':
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
    if params.get('cluster_id'):
        df = df[df['Cluster_ID'].astype(str) == str(params['cluster_id'])]
    if params.get('is_anomaly') is not None and params.get('is_anomaly') != '':
        df = df[df['Is_Anomaly'].astype(str) == str(params['is_anomaly'])]
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
            "distinct_employee_id": 0, "count_of_report_id": 0, "distinct_cluster_id": 0,
            "amount_approved": 0, "total_claims": 0, "anomaly_rate": 0, "anomaly_spend": 0
        }
    
    unique_emp = int(df['Employee ID'].nunique()) if 'Employee ID' in df.columns else 0
    total_reps_unique = int(df['Report Id'].nunique()) if 'Report Id' in df.columns else 0
    unique_clusters = int(df['Cluster_ID'].nunique()) if 'Cluster_ID' in df.columns else 0
    total_amt = float(df['Amount Approved'].sum()) if 'Amount Approved' in df.columns else 0
    total_claims = int(df['Report Id'].count()) if 'Report Id' in df.columns else 0
    
    anomaly_df = df[df['Is_Anomaly'] == 1] if 'Is_Anomaly' in df.columns else pd.DataFrame()
    anomaly_spend = float(anomaly_df['Amount Approved'].sum()) if 'Amount Approved' in anomaly_df.columns else 0
    anomaly_reps = int(anomaly_df['Report Id'].count()) if 'Report Id' in anomaly_df.columns else 0

    anomaly_rate = round((anomaly_reps / total_claims * 100), 2) if total_claims > 0 else 0

    return {
        "distinct_employee_id": unique_emp,
        "count_of_report_id": total_reps_unique,
        "distinct_cluster_id": unique_clusters,
        "amount_approved": round(total_amt, 2),
        "total_claims": total_claims,
        "anomaly_rate": anomaly_rate,
        "anomaly_spend": round(anomaly_spend, 2)
    }

def get_filters(df):
    if df is None or df.empty:
        return {
            "employee_ids": [], "report_ids": [], "cluster_ids": [], "is_anomaly_options": []
        }
    def safe_unique(col):
        if col in df.columns:
            return sorted([str(x) for x in df[col].dropna().unique().tolist() if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    return {
        "employee_ids": safe_unique('Employee ID'),
        "report_ids": safe_unique('Report Id'),
        "cluster_ids": safe_unique('Cluster_ID'),
        "is_anomaly_options": safe_unique('Is_Anomaly')
    }

def get_chart_data(df):
    if df is None or df.empty:
        return {
            "total_claim_employee": [], "total_spend_employee": [],
            "total_claims_policy": [], "high_risk_employee_policy": [],
            "anomaly_count_cluster": [], "anomaly_spend_employee": []
        }

    # 1. Column Chart: Total Claim by Employee
    tot_claim_emp = []
    if 'Employee ID' in df.columns and 'Report Id' in df.columns:
        grp = df.groupby('Employee ID')['Report Id'].nunique().reset_index(name='Count')
        grp = grp.sort_values('Count', ascending=False).head(15)
        tot_claim_emp = [{"employee_id": str(r['Employee ID']), "count": int(r['Count'])} for _, r in grp.iterrows()]

    # 2. Horizontal Bar: Total Spend by Employee
    tot_spend_emp = []
    if 'Employee ID' in df.columns and 'Amount Approved' in df.columns:
        grp = df.groupby('Employee ID')['Amount Approved'].sum().reset_index()
        grp = grp.sort_values('Amount Approved', ascending=False).head(15)
        tot_spend_emp = [{"employee_id": str(r['Employee ID']), "amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    # 3. Pie Chart: Total Claims by Policy
    tot_claims_pol = []
    if 'Policy' in df.columns and 'Report Id' in df.columns:
        grp = df.groupby('Policy')['Report Id'].nunique().reset_index(name='Count')
        tot_claims_pol = [{"name": str(r['Policy']), "value": int(r['Count'])} for _, r in grp.iterrows()]

    # Anomaly Only Data
    anomaly_df = df[df.get('Is_Anomaly', 0) == 1]

    # 4. Horizontal Bar: High Risk Employee by Policy
    hr_emp_pol = []
    if not anomaly_df.empty and 'Policy' in anomaly_df.columns and 'Employee ID' in anomaly_df.columns:
        grp = anomaly_df.groupby('Policy')['Employee ID'].nunique().reset_index(name='Count')
        grp = grp.sort_values('Count', ascending=False)
        hr_emp_pol = [{"policy": str(r['Policy']), "count": int(r['Count'])} for _, r in grp.iterrows()]

    # 5. Column Chart: Anomaly Count by Cluster ID
    anom_cnt_cluster = []
    if not anomaly_df.empty and 'Cluster_ID' in anomaly_df.columns and 'Report Id' in anomaly_df.columns:
        grp = anomaly_df.groupby('Cluster_ID')['Report Id'].nunique().reset_index(name='Count')
        grp = grp.sort_values('Count', ascending=False).head(15)
        anom_cnt_cluster = [{"cluster_id": str(r['Cluster_ID']), "count": int(r['Count'])} for _, r in grp.iterrows()]

    # 6. Horizontal Bar: Anomaly Spend by Employee
    anom_spend_emp = []
    if not anomaly_df.empty and 'Employee ID' in anomaly_df.columns and 'Amount Approved' in anomaly_df.columns:
        grp = anomaly_df.groupby('Employee ID')['Amount Approved'].sum().reset_index()
        grp = grp.sort_values('Amount Approved', ascending=False).head(15)
        anom_spend_emp = [{"employee_id": str(r['Employee ID']), "amount": float(r['Amount Approved'])} for _, r in grp.iterrows()]

    return {
        "total_claim_employee": tot_claim_emp,
        "total_spend_employee": tot_spend_emp,
        "total_claims_policy": tot_claims_pol,
        "high_risk_employee_policy": hr_emp_pol,
        "anomaly_count_cluster": anom_cnt_cluster,
        "anomaly_spend_employee": anom_spend_emp
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
