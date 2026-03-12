import pandas as pd
import numpy as np

def generate_low_value_claims_insight(concur_data_path, output_excel_path, amount_threshold=1000, freq_threshold=10):
    """
    Identifies employees who submit a high frequency of low-value claims (under a certain threshold)
    within a single month.
    amount_threshold: The maximum amount to be considered a "low value" claim (Default: 1000).
    freq_threshold: The minimum number of low value claims in a month to flag (Default: 10).
    """
    print("Running High-Frequency Low Value Claims Analysis (PJPA34)...")
    
    # 1. Load Data
    df = df = pd.read_excel(concur_data_path)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure ID is string for clean merging
    df['Employee ID'] = df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    df['Amount Approved Numeric'] = pd.to_numeric(df['Amount Approved'], errors='coerce').fillna(0)
    
    # 2. Extract Date Components for Grouping
    df['Submit_Date_Parsed'] = pd.to_datetime(df['Submit Date'], errors='coerce')
    df['Submit_Date2'] = df['Submit_Date_Parsed'].dt.strftime('%Y-%m-%d')
    df['Year'] = df['Submit_Date_Parsed'].dt.year.astype('Int64').astype(str)
    df['Month (Name)'] = df['Submit_Date_Parsed'].dt.strftime('%B')
    
    # Replicate the duplicated right-side month column from KNIME
    df['Month (Name) (Right)'] = df['Month (Name)']
    
    # 3. Filter for strictly Low Value Claims (< 1000)
    low_value_df = df[
        (df['Amount Approved Numeric'] > 0) & 
        (df['Amount Approved Numeric'] < amount_threshold)
    ].copy()
    
    # 4. Group by Employee, Year, and Month
    grouped = low_value_df.groupby(['Employee ID', 'Employee Name', 'Year', 'Month (Name)']).agg(
        sum_amount=('Amount Approved Numeric', 'sum'),
        count_report=('Report Id', 'count'),
        avg_amount=('Amount Approved Numeric', 'mean')
    ).reset_index()
    
    # 5. Filter for High Frequency (Abuse Logic: 10 or more low-value claims in a single month)
    high_freq_abusers = grouped[grouped['count_report'] >= freq_threshold].copy()
    
    high_freq_abusers.rename(columns={
        'sum_amount': 'Total Amount Approved',
        'count_report': 'Count(Report Id)',
        'avg_amount': 'Average of Amount Approved'
    }, inplace=True)
    
    # 6. Merge back to the Low Value Data to get the granular report details
    # FIXED LOGIC: Joining on Employee ID, Year, AND Month to prevent Cartesian explosion
    final_merged = pd.merge(
        high_freq_abusers,
        low_value_df,
        on=['Employee ID', 'Employee Name', 'Year', 'Month (Name)'],
        how='inner'
    )
    
    # 7. Organize Final Output Structure
    expected_columns = [
        'Employee ID', 'Employee Name', 'Year', 'Month (Name)', 'Total Amount Approved', 
        'Count(Report Id)', 'Average of Amount Approved', 'Report Id', 'Report Number', 
        'Report Start Date', 'Report End Date', 'Currency', 'Payment Status', 'Policy', 
        'Amount Approved', 'Submit_Date2', 'Month (Name) (Right)'
    ]
    
    # Gracefully add missing columns if schema drifts
    for col in expected_columns:
        if col not in final_merged.columns:
            final_merged[col] = np.nan
            
    final_df = final_merged[expected_columns]
    
    # 8. Sort to keep the highest abusers at the top, grouped by month
    final_df.sort_values(by=['Count(Report Id)', 'Employee ID', 'Year', 'Month (Name)'], ascending=[False, True, True, True], inplace=True)
    
    # 9. Construct Insight Meta-Headers
    header_rows = [
        ['Insight ID ', 'PJPA34'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'High-Frequency "Low Value" Claims'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    header_df = pd.DataFrame(header_rows)
    
    # 10. Export seamlessly to matching Excel layout
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        final_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name='Sheet1')
        
    print(f"Insight execution complete. Generated {len(final_df)} exception rows for High-Frequency Low Value Claims.")
    return output_excel_path