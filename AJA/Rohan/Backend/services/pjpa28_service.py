import pandas as pd
import os
import numpy as np

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA28_Generated.xlsx"

def _load_all_sheets():
    """Load all sheets from PJPA28_Generated.xlsx"""
    path = os.path.join(OUTPUT_DIR, FILE_NAME)
    if not os.path.exists(path):
        return None
    try:
        all_sheets = pd.read_excel(path, sheet_name=None)
        return all_sheets
    except Exception as e:
        print(f"Error loading PJPA28: {e}")
        return None

def _find_anomalies_sheet(sheets):
    """Find the anomalies sheet (name pattern: 'Anomalies (XX-YY)')"""
    if sheets is None:
        return None
    for name, df in sheets.items():
        if 'anomal' in name.lower():
            return name
    return None

def _load_sheet(sheets, sheet_name, skip_rows=0):
    """Load and clean a specific sheet"""
    if sheets is None or sheet_name not in sheets:
        return None
    df = sheets[sheet_name].copy()
    if skip_rows > 0:
        # The header is at skip_rows, data starts after
        if len(df) <= skip_rows:
            return pd.DataFrame()
        headers = df.iloc[skip_rows - 1].astype(str).str.strip().tolist()
        df = df.iloc[skip_rows:].reset_index(drop=True)
        df.columns = headers
    df.columns = df.columns.astype(str).str.strip()
    return df

def _load_anomalies(sheets):
    """Load anomalies sheet with proper skip rows"""
    anomaly_sheet = _find_anomalies_sheet(sheets)
    if anomaly_sheet is None:
        return None
    df = _load_sheet(sheets, anomaly_sheet, skip_rows=5)
    if df is not None:
        def clean_amount(val):
            if pd.isna(val) or val == '': return 0
            s = str(val).replace('₹', '').replace(',', '').strip()
            try:
                return float(s)
            except:
                return 0
                
        for col in ['Amount Approved', 'Report Total', 'Amount Due Employee']:
            if col in df.columns:
                df[col] = df[col].apply(clean_amount)
        for col in ['Submit Date', 'Report Date', 'Report Start Date', 'Report End Date']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
    return df

def _load_stats_sheet(sheets, sheet_name):
    """Load a statistics sheet (Summary, 1st Digit, 2nd Digit, First-2 Digits)"""
    if sheets is None or sheet_name not in sheets:
        return None
    df = sheets[sheet_name].copy()
    # These sheets have 3 header rows then actual column headers then data
    if len(df) < 4:
        return pd.DataFrame()
    headers = df.iloc[2].astype(str).str.strip().tolist()
    df = df.iloc[3:].reset_index(drop=True)
    df.columns = headers
    df.columns = df.columns.astype(str).str.strip()
    # Convert numeric columns
    for col in df.columns:
        if col != 'Analysis Type' and col != 'Critical Finding':
            df[col] = pd.to_numeric(df[col], errors='coerce')
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
    if params.get('submit_date_start') and 'Submit Date' in df.columns:
        start = pd.to_datetime(params['submit_date_start'], errors='coerce')
        if start is not pd.NaT:
            df = df[df['Submit Date'] >= start]
    if params.get('submit_date_end') and 'Submit Date' in df.columns:
        end = pd.to_datetime(params['submit_date_end'], errors='coerce')
        if end is not pd.NaT:
            df = df[df['Submit Date'] <= end]
    if params.get('search'):
        search = str(params['search']).lower()
        mask = df.apply(lambda row: any(search in str(v).lower() for v in row), axis=1)
        df = df[mask]
    return df

def get_kpis(sheets, anomalies_df):
    """Calculate KPIs from all sheets"""
    if sheets is None:
        return {
            "unique_employee_ids": 0, "unique_report_ids": 0,
            "total_report_total": 0, "total_amount_approved": 0,
            "sample_size": 0, "max_mad": 0, "max_p_value": 0
        }

    # From anomalies
    unique_emp = 0
    unique_rep = 0
    total_report_total = 0
    total_amount_approved = 0

    if anomalies_df is not None and not anomalies_df.empty:
        if 'Employee ID' in anomalies_df.columns:
            unique_emp = int(anomalies_df['Employee ID'].nunique())
        if 'Report Id' in anomalies_df.columns:
            unique_rep = int(anomalies_df['Report Id'].nunique())
        if 'Report Total' in anomalies_df.columns:
            total_report_total = float(anomalies_df['Report Total'].sum())
        if 'Amount Approved' in anomalies_df.columns:
            total_amount_approved = float(anomalies_df['Amount Approved'].sum())

    # From summary stats
    sample_size = 0
    max_mad = 0
    max_p_value = 0
    summary_df = _load_stats_sheet(sheets, 'Summary Stats')
    if summary_df is not None and not summary_df.empty:
        if 'Sample Size' in summary_df.columns:
            sample_size = int(summary_df['Sample Size'].max())
        if 'MAD' in summary_df.columns:
            max_mad = float(summary_df['MAD'].max())
        if 'P-Value' in summary_df.columns:
            max_p_value = float(summary_df['P-Value'].max())

    return {
        "unique_employee_ids": unique_emp,
        "unique_report_ids": unique_rep,
        "total_report_total": round(total_report_total, 2),
        "total_amount_approved": round(total_amount_approved, 2),
        "sample_size": sample_size,
        "max_mad": round(max_mad, 6),
        "max_p_value": round(max_p_value, 6)
    }

def get_filters(anomalies_df):
    if anomalies_df is None or anomalies_df.empty:
        return {
            "employee_ids": [], "report_ids": [],
            "approval_statuses": [], "payment_statuses": [],
            "submit_date_range": {"min": None, "max": None}
        }
    def safe_unique(col):
        if col in anomalies_df.columns:
            return sorted([str(x) for x in anomalies_df[col].dropna().unique().tolist()
                          if str(x) != 'N/A' and str(x) != 'nan'])
        return []

    date_range = {"min": None, "max": None}
    if 'Submit Date' in anomalies_df.columns:
        valid = anomalies_df['Submit Date'].dropna()
        if not valid.empty:
            date_range = {
                "min": str(valid.min().strftime('%Y-%m-%d')) if hasattr(valid.min(), 'strftime') else str(valid.min()),
                "max": str(valid.max().strftime('%Y-%m-%d')) if hasattr(valid.max(), 'strftime') else str(valid.max())
            }

    return {
        "employee_ids": safe_unique('Employee ID'),
        "report_ids": safe_unique('Report Id'),
        "approval_statuses": safe_unique('Approval Status'),
        "payment_statuses": safe_unique('Payment Status'),
        "submit_date_range": date_range
    }

def get_chart_data(sheets, anomalies_df=None):
    """Prepare chart data from the Benford analysis sheets"""
    if sheets is None:
        return {
            "first_digit": [], "second_digit": [],
            "first_two_digit_zscore": [], "anomalies_by_employee": []
        }

    # 1st Digit chart
    d1_data = []
    d1_df = _load_stats_sheet(sheets, '1st Digit Analysis')
    if d1_df is not None and not d1_df.empty:
        for _, r in d1_df.iterrows():
            d1_data.append({
                "digit": str(int(r['Digit'])) if pd.notna(r.get('Digit')) else '',
                "actual": round(float(r.get('Actual %', 0)), 2),
                "expected": round(float(r.get('Expected %', 0)), 2),
                "z_score": round(float(r.get('Z-Score', 0)), 2)
            })

    # 2nd Digit chart
    d2_data = []
    d2_df = _load_stats_sheet(sheets, '2nd Digit Analysis')
    if d2_df is not None and not d2_df.empty:
        for _, r in d2_df.iterrows():
            d2_data.append({
                "digit": str(int(r['Digit'])) if pd.notna(r.get('Digit')) else '',
                "actual": round(float(r.get('Actual %', 0)), 2),
                "expected": round(float(r.get('Expected %', 0)), 2),
                "z_score": round(float(r.get('Z-Score', 0)), 2)
            })

    # First-2 Digits Z-Score (top 20 by absolute Z-Score)
    d12_data = []
    d12_df = _load_stats_sheet(sheets, 'First-2 Digits Analysis')
    if d12_df is not None and not d12_df.empty:
        d12_df['abs_z'] = d12_df['Z-Score'].abs()
        top = d12_df.sort_values('abs_z', ascending=False).head(20)
        for _, r in top.iterrows():
            d12_data.append({
                "digit_pair": str(int(r['Digit'])) if pd.notna(r.get('Digit')) else '',
                "z_score": round(float(r.get('Z-Score', 0)), 2),
                "actual": round(float(r.get('Actual %', 0)), 2),
                "expected": round(float(r.get('Expected %', 0)), 2)
            })

    # Anomalies by Employee — uses the filtered anomalies_df if provided
    anomalies_emp_data = []
    claims_by_policy = []
    report_total_vs_approved = []

    if anomalies_df is None:
        anomalies_df = _load_anomalies(sheets)
    
    if anomalies_df is not None and not anomalies_df.empty:
        # Anomalies by Employee
        if 'Employee ID' in anomalies_df.columns:
            grp = anomalies_df.groupby('Employee ID').size().reset_index(name='count')
            grp = grp.sort_values('count', ascending=False).head(15)
            anomalies_emp_data = [{"employee": str(r['Employee ID']), "count": int(r['count'])} for _, r in grp.iterrows()]
        
        # Claims by Policy (Sum of Amount Approved)
        if 'Policy' in anomalies_df.columns and 'Amount Approved' in anomalies_df.columns:
            policy_grp = anomalies_df.groupby('Policy')['Amount Approved'].sum().reset_index()
            policy_grp = policy_grp.sort_values('Amount Approved', ascending=False).head(15)
            claims_by_policy = [{"policy": str(r['Policy']), "amount": round(float(r['Amount Approved']), 2)} for _, r in policy_grp.iterrows()]
            
        # Report Total vs Amount Approved 
        if 'Report Total' in anomalies_df.columns and 'Amount Approved' in anomalies_df.columns:
            # Sort by highest report total to show most significant reports
            rt_df = anomalies_df.copy()
            rt_df['Report Total'] = pd.to_numeric(rt_df['Report Total'], errors='coerce').fillna(0)
            rt_df = rt_df.sort_values('Report Total', ascending=False).head(5)
            
            for _, r in rt_df.iterrows():
                emp_name = str(r.get('Employee ID', 'Unknown'))
                report_total_vs_approved.append({
                    "employee": emp_name,
                    "reportTotal": round(float(r['Report Total']), 2),
                    "amountApproved": round(float(r.get('Amount Approved', 0)), 2)
                })

    return {
        "first_digit": d1_data,
        "second_digit": d2_data,
        "first_two_digit_zscore": d12_data,
        "anomalies_by_employee": anomalies_emp_data,
        "claims_by_policy": claims_by_policy,
        "report_total_vs_approved": report_total_vs_approved
    }

def get_table_data(anomalies_df, page=1, page_size=15, search=None):
    if anomalies_df is None or anomalies_df.empty:
        return {"data": [], "total": 0}

    if search:
        search_lower = search.lower()
        mask = anomalies_df.apply(lambda row: any(search_lower in str(v).lower() for v in row), axis=1)
        anomalies_df = anomalies_df[mask]

    total = len(anomalies_df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = anomalies_df.iloc[start:end].copy()

    for col in page_df.columns:
        if pd.api.types.is_datetime64_any_dtype(page_df[col]):
            page_df[col] = page_df[col].dt.strftime('%Y-%m-%d')

    page_df = page_df.fillna("N/A")
    return {"data": page_df.to_dict(orient="records"), "total": total}
