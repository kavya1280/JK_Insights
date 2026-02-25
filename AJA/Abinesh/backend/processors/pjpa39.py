import pandas as pd
import numpy as np

def process_pjpa39(file_path: str) -> pd.DataFrame:
    """
    Process PJPA39 Excel file - Employee Separation Analytics
    """
    # Read Excel file
    df = pd.read_excel(file_path)
    
    # Clean column names
    df.columns = df.columns.str.strip()
    
    # Standardize column names
    column_mapping = {}
    for col in df.columns:
        col_lower = col.lower()
        if 'employee' in col_lower and 'id' in col_lower:
            column_mapping[col] = 'Employee ID'
        elif 'department' in col_lower:
            column_mapping[col] = 'Department'
        elif 'state' in col_lower or 'location' in col_lower:
            column_mapping[col] = 'State'
        elif 'separation' in col_lower and 'date' in col_lower:
            column_mapping[col] = 'Separation Date'
        elif 'employee' in col_lower and 'name' in col_lower:
            column_mapping[col] = 'Employee Name'
        elif 'year' in col_lower:
            column_mapping[col] = 'Year'
    
    df = df.rename(columns=column_mapping)
    
    # Handle missing values
    df = df.fillna('')
    
    # Convert date columns
    if 'Separation Date' in df.columns:
        df['Separation Date'] = pd.to_datetime(df['Separation Date'], errors='coerce')
    
    # Deduplicate after mapping to ensure unique standard columns
    df = df.loc[:, ~df.columns.duplicated()]
    
    return df
