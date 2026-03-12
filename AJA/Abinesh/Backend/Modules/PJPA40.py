import pandas as pd
import numpy as np

def generate_transaction_date_anomaly_insight(concur_data_path, line_item_data_path, output_excel_path):
    print("Running Transaction Date Anomaly Analysis (PJPA40)...")
    
    # 1. Load Data
    concur_df = pd.read_excel(concur_data_path)
    line_item_df = pd.read_excel(line_item_data_path)
    
    # Clean column names
    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    line_item_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Standardize join keys (handle potential slight naming variations)
    report_id_col_concur = 'Report Id' if 'Report Id' in concur_df.columns else 'Report ID'
    concur_df['Report ID_Join'] = concur_df[report_id_col_concur].astype(str).str.strip()
    concur_df['Employee ID_Join'] = concur_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    
    report_id_col_line = 'Report Id' if 'Report Id' in line_item_df.columns else 'Report ID'
    line_item_df['Report ID_Join'] = line_item_df[report_id_col_line].astype(str).str.strip()
    line_item_df['Employee ID_Join'] = line_item_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    
    # 2. Merge Line Items with Concur Headers to get the bounding dates
    merged_df = pd.merge(
        line_item_df, 
        concur_df, 
        on=['Report ID_Join', 'Employee ID_Join'], 
        how='inner', 
        suffixes=('', '_header')
    )
    
    # 3. Process Dates for Comparison
    merged_df['Transaction Date Parsed'] = pd.to_datetime(merged_df['Transaction Date'], errors='coerce')
    merged_df['Report Start Date Parsed'] = pd.to_datetime(merged_df['Report Start Date'], errors='coerce')
    
    # CRITICAL RULE: If Report End Date is missing, assume it equals Report Start Date
    merged_df['Report End Date Parsed'] = pd.to_datetime(merged_df['Report End Date'], errors='coerce')
    merged_df['Report End Date Parsed'] = merged_df['Report End Date Parsed'].fillna(merged_df['Report Start Date Parsed'])
    
    # Filter out rows missing core comparative dates
    valid_dates = merged_df.dropna(subset=['Transaction Date Parsed', 'Report Start Date Parsed']).copy()
    
    # 4. Apply Exception Logic
    # Case 1: Transaction happened AFTER the trip ended
    case1_df = valid_dates[valid_dates['Transaction Date Parsed'] > valid_dates['Report End Date Parsed']].copy()
    
    # Case 2: Transaction happened BEFORE the trip started
    case2_df = valid_dates[valid_dates['Transaction Date Parsed'] < valid_dates['Report Start Date Parsed']].copy()
    
    # 5. Format Output Columns
    expected_columns = [
        'Employee', 'Report Name', 'Expense Type', 'Report ID', 'Approval Status', 'Payment Status',
        'Report Date', 'Transaction Date', 'Total Approved Amount', 'City/Location', 'Payment Type', 
        'Approved Amount', 'Employee ID', 'Report Number', 'Submit Date', 'Report Start Date', 
        'Report End Date', 'Currency', 'Report Total', 'Amount Due Employee', 'Policy'
    ]
    
    # Safely add any missing columns to prevent errors
    for col in expected_columns:
        if col not in case1_df.columns: case1_df[col] = np.nan
        if col not in case2_df.columns: case2_df[col] = np.nan
            
    case1_final = case1_df[expected_columns].sort_values(by=['Transaction Date', 'Employee ID'], ascending=[False, True])
    case2_final = case2_df[expected_columns].sort_values(by=['Transaction Date', 'Employee ID'], ascending=[False, True])
    
    # 6. Construct Insight Meta-Headers
    header_case1 = [
        ['Insight ID ', 'PJPA40'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Cases where transaction date is after Report End Date'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_case2 = [
        ['Insight ID ', 'PJPA40'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '2'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Cases where transaction date is before Report Start Date'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    # 7. Export seamlessly to two sheets in one Excel file
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        pd.DataFrame(header_case1).to_excel(writer, index=False, header=False, sheet_name='After End Date')
        case1_final.to_excel(writer, index=False, header=False, startrow=5, sheet_name='After End Date')
        
        pd.DataFrame(header_case2).to_excel(writer, index=False, header=False, sheet_name='Before Start Date')
        case2_final.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Before Start Date')
        
    print(f"PJPA40 complete: {len(case1_final)} claims after end date, {len(case2_final)} claims before start date.")