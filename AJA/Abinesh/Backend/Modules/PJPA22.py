import pandas as pd
import numpy as np

def generate_cross_employee_duplicate_insight(line_item_data_path, output_excel_path):
    print("🚀 Running PJPA22: Same Expenses Claimed by Multiple Employees...")

    df = pd.read_excel(line_item_data_path) if line_item_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(line_item_data_path, encoding="latin1", low_memory=False)
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    report_col = 'Report Id' if 'Report Id' in df.columns else 'Report ID'
    df['Report ID_Clean'] = df[report_col].astype(str).str.strip()
    df['Employee ID_Clean'] = df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)

    exclude_expense = ["DAILY ALLOWANCE", "DAILY ALLOWANCE (INCIDENTALS)", "SHORT VISIT", "PERSONAL BIKE", "PERSONAL CAR"]
    df['Expense Type Clean'] = df['Expense Type'].astype(str).str.strip().str.upper()
    filtered_df = df[~df['Expense Type Clean'].isin(exclude_expense)].copy()

    filtered_df['Approved Amount Numeric'] = pd.to_numeric(filtered_df['Approved Amount'], errors='coerce').fillna(0)
    filtered_df['Approved Amount Str'] = filtered_df['Approved Amount Numeric'].apply(lambda x: f"{x:.2f}")

    filtered_df['Transaction Date Parsed'] = pd.to_datetime(filtered_df['Transaction Date'], errors='coerce')
    filtered_df['Transaction Date Str'] = filtered_df['Transaction Date Parsed'].dt.strftime('%d-%m-%Y').fillna("Unknown")

    grouped = filtered_df.groupby(['Transaction Date Str', 'Approved Amount Str']).agg(
        Report_ID_Unique_Count=('Report ID_Clean', 'nunique'),
        Employee_ID_Unique_Count=('Employee ID_Clean', 'nunique')
    ).reset_index()

    flagged_groups = grouped[(grouped['Report_ID_Unique_Count'] > 1) & (grouped['Employee_ID_Unique_Count'] > 1)]
    joined_df = pd.merge(flagged_groups, filtered_df, on=['Transaction Date Str', 'Approved Amount Str'], how='inner')
    
    expected_columns = [
        "Transaction Date", "Approved Amount", "Report ID Unique Count", "Employee ID Unique Count",
        "Employee", "Report Name", "Expense Type", "Report ID", "Approval Status",
        "Payment Status", "Report Date", "Total Approved Amount", "City/Location",
        "Payment Type", "Employee ID", "Unique ID"
    ]

    if joined_df.empty:
        final_df = pd.DataFrame(columns=expected_columns)
    else:
        joined_df['Unique ID'] = joined_df['Transaction Date Str'] + "_" + joined_df['Approved Amount Str']
        joined_df.rename(columns={
            'Report_ID_Unique_Count': 'Report ID Unique Count',
            'Employee_ID_Unique_Count': 'Employee ID Unique Count'
        }, inplace=True)

        # --- FIX: DROP TEMP COLUMNS TO AVOID DUPLICATE COLUMN NAMES ---
        joined_df.drop(columns=['Report ID_Clean', 'Employee ID_Clean', 'Transaction Date Str', 'Approved Amount Str', 'Approved Amount Numeric', 'Transaction Date Parsed', 'Expense Type Clean'], inplace=True, errors='ignore')

        if 'Employee' not in joined_df.columns and 'Employee Name' in joined_df.columns:
            joined_df['Employee'] = joined_df['Employee Name']
            
        for col in expected_columns:
            if col not in joined_df.columns: joined_df[col] = np.nan

        # Sort values cleanly using the original data columns
        final_df = joined_df[expected_columns].sort_values(by=['Transaction Date', 'Approved Amount', 'Employee ID'])

    def _export_sheet(out_df, writer, insight_id, exception_no, exception_type, sheet_name):
        cols = out_df.columns.tolist()
        header_rows = [
            ['Insight ID ', insight_id] + [''] * max(0, len(cols) - 2),
            ['Exception No', exception_no] + [''] * max(0, len(cols) - 2),
            ['Exception Type', exception_type] + [''] * max(0, len(cols) - 2),
            [''] * max(2, len(cols)), [''] * max(2, len(cols)), cols
        ]
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name=sheet_name)
        out_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name)

    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        _export_sheet(final_df, writer, "PJPA22", "1", "Same Expenses Claimed by Multiple Employees", "Cross_Employee_Dupes")