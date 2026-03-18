import pandas as pd
import numpy as np

def generate_notice_period_insight_updated(concur_data_path, left_employees_path, output_excel_path):
    # 1. Load the master data (low_memory=False for large files)
    concur_df = pd.read_excel(concur_data_path)
    left_emp_df = pd.read_excel(left_employees_path)
    
    # Clean up column names 
    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    left_emp_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure join keys are strictly strings
    left_emp_df['Emp_CODE'] = left_emp_df['Emp_CODE'].astype(str).str.strip()
    concur_df['Employee ID'] = concur_df['Employee ID'].astype(str).str.strip()
    
    # 2. Merge Concur claims with Left Employees
    merged_df = pd.merge(
        left_emp_df, 
        concur_df, 
        left_on='Emp_CODE', 
        right_on='Employee ID', 
        how='inner'
    )
    
    # 3. Process Dates
    merged_df['Date of Resignation'] = pd.to_datetime(merged_df['Date of Resignation'], errors='coerce')
    merged_df['Employee Last Working Date'] = pd.to_datetime(merged_df['Employee Last Working Date'], errors='coerce')
    merged_df['Submit Date_Parsed'] = pd.to_datetime(merged_df['Submit Date'], errors='coerce')
    
    # --- NEW LOGIC FIX: Filter out expenses submitted BEFORE resignation ---
    merged_df = merged_df[merged_df['Submit Date_Parsed'] >= merged_df['Date of Resignation']].copy()
    
    # 4. Derive specific insight columns
    merged_df['Employee Separation Date'] = merged_df['Employee Last Working Date'].dt.strftime('%Y-%m-%d')
    merged_df['Submit_Date_2'] = merged_df['Submit Date_Parsed'].dt.strftime('%Y-%m-%d')
    merged_df['Notice Period Days'] = (merged_df['Employee Last Working Date'] - merged_df['Date of Resignation']).dt.days
    merged_df['Amount Approved'] = pd.to_numeric(merged_df['Amount Approved'], errors='coerce').fillna(0)
    
    # 5. Define Risk Category Logic
    def calculate_risk(row):
        if pd.isna(row['Notice Period Days']):
            return 'UNKNOWN'
        elif row['Notice Period Days'] <= 0:
            return 'Critical'
        elif row['Amount Approved'] >= 7000:
            return 'HIGH'
        elif row['Amount Approved'] >= 3750:
            return 'MEDIUM'
        else:
            return 'LOW'
            
    merged_df['Risk Category'] = merged_df.apply(calculate_risk, axis=1)
    
    # Revert date types back to string format for standardizing the output
    merged_df['Date of Resignation'] = merged_df['Date of Resignation'].dt.strftime('%Y-%m-%d')
    merged_df['Employee Last Working Date'] = merged_df['Employee Last Working Date'].dt.strftime('%Y-%m-%d')
    
    # Sort the data descending by Submit Date
    merged_df.sort_values(by='Submit Date', ascending=False, inplace=True)
    
    # 6. Organize Final Output Structure
    expected_columns = [
        'Designation Name', 'Job Level', 'DOJ', 'Separation Reason', 'Date of Resignation', 
        'Employee Last Working Date', 'Employee ID', 'Report Name', 'Report Id', 'Report Number', 
        'Submit Date', 'Employee Name', 'Approval Status', 'Report Start Date', 'Report End Date', 
        'Currency', 'Report Total', 'Payment Status', 'Amount Due Employee', 'Report Date', 
        'Policy', 'Amount Approved', 'Employee Separation Date', 'Submit_Date_2', 
        'Notice Period Days', 'Risk Category'
    ]
    
    # Gracefully add missing columns if data shapes drift
    for col in expected_columns:
        if col not in merged_df.columns:
            merged_df[col] = np.nan
            
    final_df = merged_df[expected_columns]
    
    # 7. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA27'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Notice Period Spending Spree - Employees spending money during the last 30-90 days '] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 8. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} valid exception rows after fixing logic.")
    return output_excel_path

# Example execution:
# generate_notice_period_insight_updated(
#     concur_data_path='Combined SAP Concor Data.csv', 
#     left_employees_path='Engagement Master Format - Audit (1) (2).xlsx - List of left employees.csv', 
#     output_excel_path='Exception01_PJPA27_FixedLogic.xlsx'
# )

#if __name__ == "__main__":
    # Define your input files (ensure these are in the same folder as your Python script)
    #concur_file = r"C:\Users\kinir\OneDrive\Desktop\JK Data\Files for upload into API\Combined SAP Concor Data.xlsx"
    #left_emp_file = r"C:\Users\kinir\OneDrive\Desktop\JK Data\only for refrence\Inactive Employees.xlsx"
    
    # Define what you want the output file to be named
    #output_file = "PJPA27_Notice_Period_Generated.xlsx"
    
    # Run the function
    #print("Starting insight generation...")
    #generate_notice_period_insight_updated(
        #concur_data_path=concur_file, 
        #left_employees_path=left_emp_file, 
        #output_excel_path=output_file
    #)
    #print(f"Done! Check your folder for {output_file}")