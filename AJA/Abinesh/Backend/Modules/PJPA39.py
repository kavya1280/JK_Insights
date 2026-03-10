import pandas as pd
import numpy as np

def generate_active_with_sep_date_insight(emp_master_path, output_excel_path):
    print("Running Active Employees with Separation Date Analysis (PJPA39)...")
    
    # 1. Load Data
    df = pd.read_excel(emp_master_path)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    original_cols = df.columns.tolist()
    
    # 2. Identify the Employee ID column dynamically based on the master file
    id_col = 'Employee ID(Only ALPHA NUM)' if 'Employee ID(Only ALPHA NUM)' in df.columns else 'Supplier'
    if id_col not in df.columns:
        id_col = df.columns[1] # Fallback to Personnel Number
        
    df['Emp_ID_Clean'] = df[id_col].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    df['Status_Clean'] = df['Employee Status'].astype(str).str.strip().str.upper()
    
    # 3. Apply the "Strictly Active" Rule
    # First, find any employee ID that has a non-active record (e.g., 'INACTIVE', 'SEPARATED', etc.)
    non_active_emps = df[df['Status_Clean'] != 'ACTIVE']['Emp_ID_Clean'].unique()
    
    # Then, filter our dataframe to ONLY include employees who do not appear in the non-active list
    strictly_active_df = df[~df['Emp_ID_Clean'].isin(non_active_emps)].copy()
    
    # 4. Apply the Separation Date Rule
    # Convert separation dates to datetime objects so we can easily filter out the blanks/nulls
    strictly_active_df['Sep_Date_Parsed'] = pd.to_datetime(strictly_active_df['Employee Separation Date'], errors='coerce')
    
    # The exceptions are the strictly active employees who actually have a parsed separation date
    exception_df = strictly_active_df[strictly_active_df['Sep_Date_Parsed'].notna()].copy()
    
    # 5. Format the Output
    final_df = exception_df[original_cols].copy()
    
    # Sort the exceptions by Separation Date (newest first)
    if 'Employee Separation Date' in final_df.columns:
        final_df.sort_values(by=['Employee Separation Date', id_col], ascending=[False, True], inplace=True)
        
    # 6. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA39'] + [''] * (len(original_cols) - 2),
        ['Exception No', '1'] + [''] * (len(original_cols) - 2),
        ['Exception Type', 'Active Employees with Separation Date'] + [''] * (len(original_cols) - 2),
        [''] * len(original_cols),
        original_cols
    ]
    
    # 7. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Sheet1')
        
    print(f"PJPA39 complete: {len(final_df)} exceptions found.")