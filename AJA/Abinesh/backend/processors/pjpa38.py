import pandas as pd
import numpy as np

def process_pjpa38(file_path: str) -> pd.DataFrame:
    """
    Process PJPA38 Excel file - Travel Expense Anomaly Detection
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
        elif 'flag' in col_lower:
            column_mapping[col] = 'Flag'
        elif 'mode' in col_lower and 'count' in col_lower:
            column_mapping[col] = 'Mode_Count'
        elif 'approved' in col_lower and 'amount' in col_lower:
            column_mapping[col] = 'Approved Amount'
        elif 'expense' in col_lower and 'type' in col_lower:
            column_mapping[col] = 'Expense Type'
        elif 'department' in col_lower:
            column_mapping[col] = 'Department'
        elif 'employee' in col_lower and 'name' in col_lower:
            column_mapping[col] = 'Employee Name'
    
    df = df.rename(columns=column_mapping)
    
    # Handle missing values
    df = df.fillna('')
    
    # Convert numeric columns
    numeric_cols = ['Mode_Count', 'Approved Amount']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Ensure Flag is Rare/Normal
    if 'Flag' in df.columns:
        df['Flag'] = df['Flag'].apply(
            lambda x: 'Rare' if str(x).lower() in ['rare', 'odd', 'anomaly'] else 'Normal'
        )
    
    # Deduplicate after mapping to ensure unique standard columns
    df = df.loc[:, ~df.columns.duplicated()]
    
    return df
