import pandas as pd
import numpy as np

def generate_structural_splitting_insight(concur_data_path, line_item_data_path, output_excel_path):
    print("Running Structural Splitting Analysis (PJPA31)...")
    
    # 1. Load Data
    concur_df = pd.read_excel(concur_data_path)
    line_item_df = pd.read_excel(line_item_data_path)
    
    # Clean column names
    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    line_item_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure IDs are strings for clean merging
    concur_df['Employee ID'] = concur_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    concur_df['Report Id'] = concur_df['Report Id'].astype(str).str.strip()
    
    if 'Employee ID' in line_item_df.columns:
        line_item_df.rename(columns={'Employee ID': 'Employee ID (Right)'}, inplace=True)
    line_item_df['Employee ID (Right)'] = line_item_df['Employee ID (Right)'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    line_item_df['Report ID'] = line_item_df['Report ID'].astype(str).str.strip()
    
    # 2. Extract strictly the Date component from the Submit Date
    concur_df['Submit_Date_Parsed'] = pd.to_datetime(concur_df['Submit Date'], errors='coerce')
    concur_df['Submit_Date2'] = concur_df['Submit_Date_Parsed'].dt.strftime('%Y-%m-%d')
    concur_df['Report Total Numeric'] = pd.to_numeric(concur_df['Report Total'], errors='coerce').fillna(0)
    
    # 3. Group by Employee and Submit Date to find split submissions
    grouped = concur_df.groupby(['Employee ID', 'Submit_Date2']).agg(
        sum_report_total=('Report Total Numeric', 'sum'),
        count_report_id=('Report Id', 'nunique')
    ).reset_index()
    
    # 4. Filter for Structural Splitting (Abuse logic: 2 or more reports submitted on the same day)
    # This mirrors the KNIME Row Filter node behavior
    splitters = grouped[grouped['count_report_id'] >= 2].copy()
    splitters.rename(columns={
        'sum_report_total': 'Sum(Report Total)',
        'count_report_id': 'Count(Report Id)'
    }, inplace=True)
    
    # 5. Merge back to Header Data to get the specific report details
    header_merged = pd.merge(
        splitters,
        concur_df,
        on=['Employee ID', 'Submit_Date2'],
        how='inner'
    )
    
    # 6. Merge with Line Item Data to get the granular expense breakdown
    # Using Report ID as the primary key bridging the two datasets
    final_merged = pd.merge(
        header_merged,
        line_item_df,
        left_on='Report Id',
        right_on='Report ID',
        how='inner'
    )
    
    # Map right-side column names exactly as outputted by KNIME's Joiner node
    rename_mapping = {
        'Report Name_y': 'Report Name (Right)',
        'Report Name_x': 'Report Name',
        'Approval Status_y': 'Approval Status (Right)',
        'Approval Status_x': 'Approval Status',
        'Payment Status_y': 'Payment Status (Right)',
        'Payment Status_x': 'Payment Status',
        'Report Date_y': 'Report Date (Right)',
        'Report Date_x': 'Report Date'
    }
    final_merged.rename(columns=rename_mapping, inplace=True)
    
    # 7. Organize Final Output Structure
    expected_columns = [
        'Employee ID', 'Submit_Date2', 'Sum(Report Total)', 'Count(Report Id)', 'Report Name', 
        'Report Id', 'Report Number', 'Submit Date', 'Employee Name', 'Approval Status', 
        'Report Start Date', 'Report End Date', 'Currency', 'Report Total', 'Payment Status', 
        'Amount Due Employee', 'Report Date', 'Policy', 'Amount Approved', 'Employee', 
        'Report Name (Right)', 'Expense Type', 'Report ID', 'Approval Status (Right)', 
        'Payment Status (Right)', 'Report Date (Right)', 'Transaction Date', 'Total Approved Amount', 
        'City/Location', 'Payment Type', 'Approved Amount', 'Employee ID (Right)', 
        'Person Band before PMS', 'Predicted_Range'
    ]
    
    # Gracefully add missing columns (like Predicted_Range if it was statically generated previously)
    for col in expected_columns:
        if col not in final_merged.columns:
            final_merged[col] = np.nan
            
    final_df = final_merged[expected_columns]
    
    # 8. Sort to keep employee split clusters cleanly grouped together
    final_df.sort_values(by=['Count(Report Id)', 'Employee ID', 'Submit_Date2'], ascending=[False, True, True], inplace=True)
    
    # 9. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA31'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Structural Splitting (Structuring) - Detect multiple claims submitted by the same employee on the same day (or adjacent days) that sum up to a large amount.'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 10. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} exception rows mapping headers to line items.")
    return output_excel_path