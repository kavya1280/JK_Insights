import pandas as pd
import numpy as np

def generate_short_trip_abuse_insight(concur_data_path, output_excel_path):
    print("Running Short Trip Frequency Abuse Analysis (PJPA30)...")
    
    # 1. Load Data
    df = pd.read_excel(concur_data_path)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # 2. Pre-process amounts
    df['Amount Approved Numeric'] = pd.to_numeric(df['Amount Approved'], errors='coerce').fillna(0)
    
    # 3. Filter for 'Short trip' Policy
    # Using case-insensitive match to ensure no data drops due to manual entry shifts
    short_trip_df = df[df['Policy'].astype(str).str.strip().str.lower() == 'short trip'].copy()
    
    # 4. Group by Employee to calculate frequency and financial variance
    # This replicates the KNIME GroupBy node and subsequent Joiner node
    grouped = short_trip_df.groupby(['Employee Name', 'Employee ID'], as_index=False).agg(
        count_report_id=('Report Id', 'count'),
        sum_amount=('Amount Approved Numeric', 'sum'),
        # Replicate KNIME's Concatenate behavior for strings
        concat_amount=('Amount Approved Numeric', lambda x: ', '.join((x.astype(str)))),
        # Replicate KNIME's "First" aggregation for line-item details
        report_name=('Report Name', 'first'),
        report_id_first=('Report Id', 'first'),
        report_number=('Report Number', 'first'),
        submit_date=('Submit Date', 'first'),
        approval_status=('Approval Status', 'first'),
        report_start_date=('Report Start Date', 'first'),
        report_end_date=('Report End Date', 'first'),
        report_date=('Report Date', 'first'),
        policy=('Policy', 'first'),
        amount_approved_first=('Amount Approved', 'first') 
    )
    
    # 5. Rename to match the expected output schema exactly
    grouped.rename(columns={
        'count_report_id': 'Count(Report Id)',
        'sum_amount': 'Sum(Amount Approved)',
        'concat_amount': 'Concatenate*(Amount Approved)',
        'report_name': 'Report Name',
        'report_id_first': 'Report Id',
        'report_number': 'Report Number',
        'submit_date': 'Submit Date',
        'approval_status': 'Approval Status',
        'report_start_date': 'Report Start Date',
        'report_end_date': 'Report End Date',
        'report_date': 'Report Date',
        'policy': 'Policy',
        'amount_approved_first': 'Amount Approved'
    }, inplace=True)
    
    # Recreate the duplicated right-side name column originating from KNIME's Joiner node
    grouped['Employee Name (Right)'] = grouped['Employee Name']
    
    # 6. Sort by highest frequency descending (Abuse indicator)
    grouped.sort_values(by='Count(Report Id)', ascending=False, inplace=True)
    
    grouped = grouped[grouped['Count(Report Id)'] >= 5]
    
    # 7. Organize Final Output Structure
    expected_columns = [
        'Employee Name', 'Employee ID', 'Count(Report Id)', 'Concatenate*(Amount Approved)', 
        'Sum(Amount Approved)', 'Report Name', 'Report Id', 'Report Number', 'Submit Date', 
        'Employee Name (Right)', 'Approval Status', 'Report Start Date', 'Report End Date', 
        'Report Date', 'Policy', 'Amount Approved'
    ]
    
    # Gracefully handle any unexpected schema shifts
    for col in expected_columns:
        if col not in grouped.columns:
            grouped[col] = np.nan
            
    final_df = grouped[expected_columns]
    
    # 8. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA30'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Short Trip Frequency Abuse'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 9. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} exception rows sorted by trip frequency.")
    return output_excel_path