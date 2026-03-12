import pandas as pd
import numpy as np

def generate_new_joiner_insight(concur_data_path, emp_master_path, output_excel_path):
    print("Running New Joiner Early Claims Analysis (PJPA29)...")
    
    # 1. Load Data
    concur_df = pd.read_excel(concur_data_path)
    emp_df = pd.read_excel(emp_master_path)
    
    # Clean up column names 
    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    emp_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Handle duplicate column names in Employee Master (e.g., 'Employee Location' appears twice)
    cols = pd.Series(emp_df.columns)
    for dup in cols[cols.duplicated()].unique():
        cols[cols[cols == dup].index.values.tolist()] = [f"{dup}_{i}" if i != 0 else dup for i in range(sum(cols == dup))]
    emp_df.columns = cols
    
    # Map the duplicated location column to the expected output format
    if 'Employee Location_1' in emp_df.columns:
        emp_df.rename(columns={'Employee Location_1': 'Employee Location (#1)'}, inplace=True)
    
    # 2. Clean Join Keys (Using Supplier ID from Emp Master to match Concur Employee ID)
    emp_df['Supplier'] = emp_df['Supplier'].astype(str).str.strip().str.replace('\.0$', '', regex=True)
    concur_df['Employee ID'] = concur_df['Employee ID'].astype(str).str.strip().str.replace('\.0$', '', regex=True)
    
    # 3. Merge Concur claims with Employee Master
    merged_df = pd.merge(
        concur_df, 
        emp_df, 
        left_on='Employee ID', 
        right_on='Supplier', 
        how='inner'
    )
    
    # 4. Process Dates and Calculate Duration
    merged_df['Submit Date_Parsed'] = pd.to_datetime(merged_df['Submit Date'], errors='coerce')
    merged_df['Joining Date'] = pd.to_datetime(merged_df['Joining Date'], errors='coerce')
    
    # Calculate difference in days
    merged_df['Claim duration'] = (merged_df['Submit Date_Parsed'] - merged_df['Joining Date']).dt.days
    
    # 5. Filter for New Joiners (Claims within 0 to 60 days of joining)
    # Note: >= 0 ensures we don't flag expenses that somehow have a submit date before their official joining date
    valid_mask = (merged_df['Claim duration'] >= 0) & (merged_df['Claim duration'] <= 60)
    exception_df = merged_df[valid_mask].copy()
    
    # 6. Apply Risk Flagging Logic
    exception_df['Amount Approved'] = pd.to_numeric(exception_df['Amount Approved'], errors='coerce').fillna(0)
    
    def calculate_new_joiner_risk(row):
        # High Risk: Claimed > 5000 within the first 5 days
        if row['Claim duration'] <= 5 and row['Amount Approved'] > 5000:
            return 'HIGH'
        return 'LOW'
        
    exception_df['Risk Category'] = exception_df.apply(calculate_new_joiner_risk, axis=1)
    
    # 7. Formatting output dates
    exception_df['Submit_Date'] = exception_df['Submit Date_Parsed'].dt.strftime('%Y-%m-%d')
    exception_df['Joining Date'] = exception_df['Joining Date'].dt.strftime('%Y-%m-%d')
    if 'Employee Separation Date' in exception_df.columns:
        exception_df['Employee Separation Date'] = pd.to_datetime(exception_df['Employee Separation Date'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    # Sort anomalies descending by Submit Date
    exception_df.sort_values(by='Submit Date', ascending=False, inplace=True)
    
    # 8. Organize Final Output Structure
    expected_columns = [
        'Report Name', 'Report Id', 'Report Number', 'Submit Date', 'Employee Name', 
        'Approval Status', 'Report Start Date', 'Report End Date', 'Currency', 
        'Report Total', 'Payment Status', 'Amount Due Employee', 'Report Date', 
        'Policy', 'Employee ID', 'Position Code', 'Personnel Number', 
        'Employee ID(Only ALPHA NUM)', 'Employee Status', 'Supplier', 
        'Position Code Name', 'Full Name', 'Title', 'Employee Email Id', 
        'Phone Number', 'Employee Location', 'Department', 'Company name', 
        'Change Date', 'Joining Date', 'Employee Separation Date', 'Rep. Manager', 
        'HOD Names', 'HOD TMS Names', 'Cost Center', 'Gender', 'Date Of Birth', 
        'Blood Group', 'Country/Region Key', 'Bank Account', 'Bank Country/Region', 
        'Bank Number', 'Postal Code', 'Region', 'Company Code', 'IFSC Code', 
        'Account holder', 'Nationality text', 'State', 'Date', 
        'Employee Location (#1)', 'Submit_Date', 'Claim duration', 'Amount Approved', 
        'Risk Category'
    ]
    
    # Gracefully add missing columns if data shapes drift
    for col in expected_columns:
        if col not in exception_df.columns:
            exception_df[col] = np.nan
            
    final_df = exception_df[expected_columns]
    
    # 9. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA29'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'New Joiner Early Claims'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 10. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} exception rows.")
    return output_excel_path