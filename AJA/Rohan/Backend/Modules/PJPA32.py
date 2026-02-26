import pandas as pd
import numpy as np

def generate_holiday_weekend_travel_insight(line_item_data_path, output_holiday_path, output_weekend_path):
    print("Running Holiday and Weekend Travel Analysis (PJPA32)...")
    
    # 1. Define Delhi Public/Bank Holidays (Format: 'YYYY-MM-DD': 'Holiday Name')
    # This can easily be updated or moved to a database table in the future
    DELHI_HOLIDAYS = {
        '2025-01-26': 'Republic Day',
        '2025-03-14': 'Holi',
        '2025-03-31': 'Id-ul-Fitr',
        '2025-04-10': 'Mahavir Jayanti',
        '2025-04-18': 'Good Friday',
        '2025-05-12': 'Buddha Purnima',
        '2025-06-07': 'Id-ul-Zuha (Bakrid)',
        '2025-07-06': 'Muharram',
        '2025-08-15': 'Independence Day',
        '2025-08-16': 'Janmashtami',
        '2025-09-05': 'Milad-un-Nabi',
        '2025-10-02': 'Mahatma Gandhi Birthday',
        '2025-10-20': 'Diwali',
        '2025-11-05': 'Guru Nanak\'s Birthday',
        '2025-12-25': 'Christmas'
    }
    
    # 2. Load Data
    df = pd.read_csv(line_item_data_path, low_memory=False)
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Ensure standard schema mapping
    if 'Employee ID (Right)' in df.columns and 'Employee ID' not in df.columns:
        df.rename(columns={'Employee ID (Right)': 'Employee ID'}, inplace=True)
        
    # 3. Process Transaction Dates
    df['Transaction Date Parsed'] = pd.to_datetime(df['Transaction Date'], errors='coerce')
    df['Date_String'] = df['Transaction Date Parsed'].dt.strftime('%Y-%m-%d')
    df['Day of Week (Name)'] = df['Transaction Date Parsed'].dt.day_name()
    
    # 4. Map Holidays
    df['Holiday Name'] = df['Date_String'].map(DELHI_HOLIDAYS)
    df['Date'] = df['Date_String']
    df['Year'] = df['Transaction Date Parsed'].dt.year.astype('Int64').astype(str)
    
    expected_columns = [
        'Employee', 'Report Name', 'Expense Type', 'Report ID', 'Approval Status', 
        'Payment Status', 'Report Date', 'Transaction Date', 'Total Approved Amount', 
        'City/Location', 'Payment Type', 'Approved Amount', 'Person Band before PMS', 
        'Employee ID', 'Day of Week (Name)', 'Date', 'Holiday Name', 'Year'
    ]
    
    for col in expected_columns:
        if col not in df.columns:
            df[col] = np.nan
            
    # ---------------------------------------------------------
    # EXCEPTION 1: HOLIDAY TRAVEL
    # ---------------------------------------------------------
    # Filter where a Holiday Name was successfully mapped
    holiday_df = df[df['Holiday Name'].notna()].copy()
    holiday_df = holiday_df[expected_columns]
    holiday_df.sort_values(by='Transaction Date', ascending=False, inplace=True)
    
    header_holiday = [
        ['Insight ID ', 'PJPA32'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '1'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Holiday Travel'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    with pd.ExcelWriter(output_holiday_path, engine='xlsxwriter') as writer:
        pd.DataFrame(header_holiday).to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        holiday_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name='Sheet1')
        
    # ---------------------------------------------------------
    # EXCEPTION 2: WEEKEND TRAVEL
    # ---------------------------------------------------------
    # Filter for Saturday/Sunday, excluding actual public holidays
    weekend_df = df[
        (df['Day of Week (Name)'].isin(['Saturday', 'Sunday'])) & 
        (df['Holiday Name'].isna())
    ].copy()
    
    # Match the KNIME behavior where Date/Holiday/Year are left blank for weekends
    weekend_df['Date'] = np.nan
    weekend_df['Holiday Name'] = np.nan
    weekend_df['Year'] = np.nan
    
    weekend_df = weekend_df[expected_columns]
    weekend_df.sort_values(by='Transaction Date', ascending=False, inplace=True)
    
    header_weekend = [
        ['Insight ID ', 'PJPA32'] + [''] * (len(expected_columns) - 2),
        ['Exception No', '2'] + [''] * (len(expected_columns) - 2),
        ['Exception Type', 'Weekend Travel'] + [''] * (len(expected_columns) - 2),
        [''] * len(expected_columns),
        [''] * len(expected_columns),
        expected_columns
    ]
    
    with pd.ExcelWriter(output_weekend_path, engine='xlsxwriter') as writer:
        pd.DataFrame(header_weekend).to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        weekend_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name='Sheet1')

    print(f"PJPA32 complete: {len(holiday_df)} Holiday exceptions, {len(weekend_df)} Weekend exceptions.")
    return output_holiday_path, output_weekend_path