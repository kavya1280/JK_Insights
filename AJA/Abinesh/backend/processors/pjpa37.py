import pandas as pd
import numpy as np

def process_pjpa37(file_path: str) -> pd.DataFrame:
    """
    Process PJPA37 Excel file - Employee Claims Anomaly Detection
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
        elif 'report' in col_lower and 'id' in col_lower:
            column_mapping[col] = 'Report ID'
        elif 'cluster' in col_lower:
            column_mapping[col] = 'Cluster_ID'
        elif 'total' in col_lower and 'claim' in col_lower:
            column_mapping[col] = 'Total Claims'
        elif 'total' in col_lower and 'spend' in col_lower:
            column_mapping[col] = 'Total Spend Amount'
        elif 'anomaly' in col_lower or 'is_anomaly' in col_lower:
            column_mapping[col] = 'Is_Anomaly'
        elif 'policy' in col_lower:
            column_mapping[col] = 'Policy'
        elif 'department' in col_lower:
            column_mapping[col] = 'Department'
        elif 'employee' in col_lower and 'name' in col_lower:
            column_mapping[col] = 'Employee Name'
    
    df = df.rename(columns=column_mapping)
    
    # Handle missing values
    df = df.fillna('')
    
    # Convert numeric columns
    numeric_cols = ['Total Claims', 'Total Spend Amount']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Ensure Is_Anomaly is Yes/No
    if 'Is_Anomaly' in df.columns:
        df['Is_Anomaly'] = df['Is_Anomaly'].apply(
            lambda x: 'Yes' if str(x).lower() in ['yes', 'true', '1', 'y'] else 'No'
        )
    
    # Deduplicate after mapping to ensure unique standard columns
    df = df.loc[:, ~df.columns.duplicated()]
    
    return df
