import pandas as pd
import os
from utils.header_detection import clean_dataframe
from utils.column_mapper import map_columns, validate_required_columns

REQUIRED_COLUMNS = [
    "Employee ID", 
    "Employee Name", 
    "Expense Type", 
    "Amount Approved", 
    "Transaction Date", 
    "Location"
]

def process_excel_files(file_paths):
    """
    Processes a list of Excel files, cleans them, maps columns, and merges them.
    """
    processed_dfs = []
    errors = []
    
    for path in file_paths:
        try:
            # Read excel
            df = pd.read_excel(path)
            
            # Clean
            df = clean_dataframe(df)
            
            # Map columns
            df = map_columns(df)
            
            # Check for required columns
            missing = validate_required_columns(df, REQUIRED_COLUMNS)
            if missing:
                # If some columns are missing, we might still want to keep it if it contributes some data
                # but for PJPA32 we want strictness
                print(f"Warning: File {path} missing required columns: {missing}")
                # We can choose to skip or continue with what we have
            
            processed_dfs.append(df)
            
        except Exception as e:
            errors.append(f"Error processing {os.path.basename(path)}: {str(e)}")
    
    if not processed_dfs:
        return None, errors or ["No valid data found in uploaded files."]
    
    # Merge all
    final_df = pd.concat(processed_dfs, ignore_index=True)
    
    # Post-merge cleaning
    # Convert types
    if "Amount Approved" in final_df.columns:
        final_df["Amount Approved"] = pd.to_numeric(final_df["Amount Approved"], errors="coerce").fillna(0)
    
    if "Transaction Date" in final_df.columns:
        final_df["Transaction Date"] = pd.to_datetime(final_df["Transaction Date"], errors="coerce")
        # Add Weekend column
        final_df["Weekend"] = final_df["Transaction Date"].dt.dayofweek >= 5
        
    return final_df, errors
