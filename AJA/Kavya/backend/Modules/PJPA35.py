import pandas as pd
import numpy as np

def generate_duplicate_report_id_insight(concur_data_path, output_excel_path):
    print("Running Duplicate Report ID Analysis (PJPA35)...")
    
    # 1. Load Data
    df = df = pd.read_excel(concur_data_path)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure IDs are strings for accurate grouping
    df['Report Id'] = df['Report Id'].astype(str).str.strip()
    df['Employee ID'] = df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    
    # 2. Group by Report ID and Employee ID to count occurrences
    report_counts = df.groupby(['Report Id', 'Employee ID']).size().reset_index(name='Count_Report')
    
    # Replicate the KNIME output column mapping
    report_counts['Count_Employee'] = report_counts['Count_Report']
    
    # 3. Filter for Duplicate Reports (Count >= 2)
    duplicates = report_counts[report_counts['Count_Report'] >= 2].copy()
    
    # 4. Merge back to original data to pull in all the line-item details
    final_merged = pd.merge(
        duplicates, 
        df, 
        on=['Report Id', 'Employee ID'], 
        how='inner'
    )
    
    # 5. Organize Final Output Structure
    expected_columns = [
        'Employee ID', 'Report Id', 'Count_Report', 'Count_Employee', 'Report Name', 
        'Report Number', 'Submit Date', 'Employee Name', 'Approval Status', 
        'Report Start Date', 'Report End Date', 'Currency', 'Report Total', 
        'Payment Status', 'Amount Due Employee', 'Report Date', 'Policy', 'Amount Approved'
    ]
    
    # Gracefully add missing columns if schema drifts
    for col in expected_columns:
        if col not in final_merged.columns:
            final_merged[col] = np.nan
            
    final_df = final_merged[expected_columns]
    
    # 6. Sort to group duplicates cleanly by highest count first, then by Report ID
    final_df.sort_values(by=['Count_Report', 'Report Id', 'Employee ID'], ascending=[False, True, True], inplace=True)
    
    # 7. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA35'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Duplicate Report ID'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 8. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} exception rows for Duplicate Reports.")
    return output_excel_path