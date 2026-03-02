import pandas as pd
import numpy as np

def generate_odd_travels_insight(line_item_data_path, output_excel_path, rare_threshold_pct=5):
    """
    Identifies 'Odd Travels' by calculating the percentage breakdown of travel modes 
    (Expense Types) per employee. If a mode constitutes a very small percentage of 
    their total trips (<= threshold), it is flagged as a Rare anomaly.
    """
    print("Running Odd Travels Analysis (PJPA38)...")
    
    # 1. Load Data
    df = pd.read_excel(line_item_data_path)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure ID is a clean string
    if 'Employee ID' in df.columns:
        df['Employee ID'] = df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    else:
        df['Employee ID'] = "UNKNOWN"
        
    # Ensure Approved Amount is numeric
    if 'Approved Amount' in df.columns:
        df['Approved Amount Numeric'] = pd.to_numeric(df['Approved Amount'], errors='coerce').fillna(0)
    else:
        df['Approved Amount'] = 0

    if 'Expense Type' not in df.columns:
        df['Expense Type'] = "Unknown"
        
    # 2. Grouping to find Mode_Count and Total_Trips
    # Calculate how many times each employee used each travel mode
    mode_counts = df.groupby(['Employee ID', 'Expense Type']).size().reset_index(name='Mode_Count')
    
    # Calculate total trips per employee
    total_trips = df.groupby('Employee ID').size().reset_index(name='Total_Trips')
    
    # 3. Merge to calculate Usage Percentage
    counts_df = pd.merge(mode_counts, total_trips, on='Employee ID')
    counts_df['Usage_Pct'] = (counts_df['Mode_Count'] / counts_df['Total_Trips']) * 100
    
    # 4. Assign Flag (Adjust the rare_threshold_pct parameter if you want <10% instead of <5%)
    counts_df['Flag'] = np.where(counts_df['Usage_Pct'] <= rare_threshold_pct, 'Rare', 'Dominant')
    
    # 5. Merge stats back to the original line item dataframe
    final_merged = pd.merge(df, counts_df, on=['Employee ID', 'Expense Type'], how='left')
    
    # 6. Prepare Output Structure matching your requested columns
    expected_columns = [
        'Expense Type', 'Employee ID', 'Mode_Count', 'Total_Trips', 
        'Employee', 'Report Name', 'Report ID', 'Report Date', 
        'Transaction Date', 'Approved Amount', 'Usage_Pct', 'Flag'
    ]
    
    # Gracefully handle missing columns
    for col in expected_columns:
        if col not in final_merged.columns:
            final_merged[col] = np.nan
            
    # Filter the dataset
    final_df = final_merged[expected_columns].copy()
    
    # Sort for readability (Group by Employee, then put highest Usage Pct first)
    final_df.sort_values(by=['Employee ID', 'Usage_Pct', 'Transaction Date'], ascending=[True, False, False], inplace=True)
    
    # 7. Create the two data subsets requested
    sheet1_df = final_df.copy() # Sheet 1: Context and anomaly data
    sheet2_df = final_df[final_df['Flag'] == 'Rare'].copy() # Sheet 2: Anomaly Only
    
    # 8. Construct Insight Meta-Headers
    header_rows_1 = [
        ['Insight ID ', 'PJPA38'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Odd_Travels'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_rows_2 = [
        ['Insight ID ', 'PJPA38'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Odd_Travels (Anomalies Only)'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    # 9. Export to Excel with 2 sheets
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        pd.DataFrame(header_rows_1).to_excel(writer, index=False, header=False, sheet_name='Context and Anomaly')
        sheet1_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Context and Anomaly')
        
        pd.DataFrame(header_rows_2).to_excel(writer, index=False, header=False, sheet_name='Anomaly Only')
        sheet2_df.to_excel(writer, index=False, header=False, startrow=5, sheet_name='Anomaly Only')
        
    print(f"PJPA38 complete: {len(sheet2_df)} anomaly rows detected out of {len(sheet1_df)} total trips.")