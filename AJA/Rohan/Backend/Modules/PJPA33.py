import pandas as pd
import numpy as np

def generate_bulk_booker_insight(concur_data_path, output_excel_path, bulk_threshold=5):
    """
    Identifies employees who hoard receipts and submit multiple reimbursement 
    reports on a single day (Bulk Bookers).
    bulk_threshold: Minimum number of reports submitted on the same day to flag as an exception.
    """
    print("Running Bulk Booker Analysis (PJPA33)...")
    
    # 1. Load Data
    concur_df = df = pd.read_excel(concur_data_path)
    
    # Clean column names
    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure IDs are strings
    concur_df['Employee ID'] = concur_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    concur_df['Report Id'] = concur_df['Report Id'].astype(str).str.strip()
    
    # 2. Extract strictly the Date component from the Submit Date
    concur_df['Submit_Date_Parsed'] = pd.to_datetime(concur_df['Submit Date'], errors='coerce')
    concur_df['Submit_Date_2'] = concur_df['Submit_Date_Parsed'].dt.strftime('%Y-%m-%d')
    concur_df['Report Total Numeric'] = pd.to_numeric(concur_df['Report Total'], errors='coerce').fillna(0)
    
    # 3. Group by Employee and Submit Date to count the number of DISTINCT reports submitted that day
    grouped = concur_df.groupby(['Employee ID', 'Submit_Date_2']).agg(
        count_report_id=('Report Id', 'nunique'),
        # Note: If the base data has multiple rows per report, we should group by Report Id first to get accurate sums,
        # but to maintain consistency with the established pipeline, we aggregate the row totals here.
        sum_report_total=('Report Total Numeric', 'sum') 
    ).reset_index()
    
    # 4. Filter for Bulk Bookers (Abuse logic: 5 or more reports submitted on the same day)
    bulk_bookers = grouped[grouped['count_report_id'] >= bulk_threshold].copy()
    
    bulk_bookers.rename(columns={
        'count_report_id': 'Count(Report Id)',
        'sum_report_total': 'Sum(Report Total)'
    }, inplace=True)
    
    # 5. Merge back to Header Data to get the specific report details
    # FIXED LOGIC: Joining on BOTH Employee ID and Submit_Date_2 to prevent Cartesian explosion
    final_merged = pd.merge(
        bulk_bookers,
        concur_df,
        on=['Employee ID', 'Submit_Date_2'],
        how='inner',
        suffixes=('', ' (Right)')
    )
    
    # Replicate KNIME's right-side suffix behavior for the output format
    final_merged['Employee ID (Right)'] = final_merged['Employee ID']
    final_merged['Submit_Date_2 (Right)'] = final_merged['Submit_Date_2']
    
    # 6. Organize Final Output Structure
    expected_columns = [
        'Employee ID', 'Submit_Date_2', 'Count(Report Id)', 'Sum(Report Total)', 
        'Report Name', 'Report Id', 'Report Number', 'Submit Date', 'Employee Name', 
        'Approval Status', 'Report Start Date', 'Report End Date', 'Currency', 
        'Report Total', 'Payment Status', 'Amount Due Employee', 'Report Date', 
        'Policy', 'Amount Approved', 'Employee ID (Right)', 'Submit_Date_2 (Right)'
    ]
    
    # Gracefully add missing columns if schema drifts
    for col in expected_columns:
        if col not in final_merged.columns:
            final_merged[col] = np.nan
            
    final_df = final_merged[expected_columns]
    
    # 7. Sort to keep the highest abusers at the top, grouped by day
    final_df.sort_values(by=['Count(Report Id)', 'Employee ID', 'Submit_Date_2'], ascending=[False, True, True], inplace=True)
    
    # 8. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA33'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', ' Employees who hoard their receipts and submit them all on a single day (often Mondays) , could have error in amounts due to many receipts'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 9. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} exception rows for Bulk Bookers.")
    return output_excel_path