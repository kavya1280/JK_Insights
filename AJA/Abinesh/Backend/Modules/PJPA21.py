import pandas as pd
import numpy as np

def generate_overlapping_travel_dates_insight(concur_data_path, output_excel_path):
    print("🚀 Running PJPA21: Overlapping Dates for Travel Analysis...")

    # ==========================================
    # 1. READ & PREP DATA
    # ==========================================
    print("📂 Reading File...")
    # Supports both CSV and Excel seamlessly
    df = pd.read_excel(concur_data_path) if concur_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(concur_data_path, encoding="latin1", low_memory=False)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    # Required columns for the analysis
    required_cols = [
        'Employee ID', 'Employee Name', 'Report Id', 'Report Name', 'Submit Date', 
        'Report Date', 'Report Total', 'Amount Approved', 'Report Start Date', 'Report End Date'
    ]
    
    # Ensure all required columns exist (fill with NaN if missing)
    for col in required_cols:
        if col not in df.columns:
            df[col] = np.nan
            
    base_df = df[required_cols].copy()

    # Clean IDs and Parse Dates
    base_df['Employee ID'] = base_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    base_df['Report Id'] = base_df['Report Id'].astype(str).str.strip()
    
    print("📅 Parsing Dates...")
    base_df['Start'] = pd.to_datetime(base_df['Report Start Date'], errors='coerce')
    base_df['End'] = pd.to_datetime(base_df['Report End Date'], errors='coerce')
    
    # Drop rows without valid start and end dates
    base_df = base_df.dropna(subset=['Start', 'End'])

    # ==========================================
    # 2. SELF-JOIN TO FIND OVERLAPS
    # ==========================================
    print("🔗 Performing Self-Join on Employee ID...")
    # Merge the dataframe with itself on Employee ID to compare every report against every other report for that employee
    merged = pd.merge(base_df, base_df, on=['Employee ID', 'Employee Name'], suffixes=('_1', '_Overlap'))

    print("🔎 Filtering Overlapping Dates...")
    # Overlap Logic: (Start A <= End B) AND (Start B <= End A)
    # Also ensure Report ID 1 < Report ID 2 to prevent duplicate mirrored pairs (A-B and B-A)
    overlap_mask = (
        (merged['Report Id_1'] < merged['Report Id_Overlap']) &
        (merged['Start_1'] <= merged['End_Overlap']) &
        (merged['Start_Overlap'] <= merged['End_1'])
    )
    
    overlaps = merged[overlap_mask].copy()

    # ==========================================
    # 3. FORMAT FINAL OUTPUT
    # ==========================================
    # Rename columns to match the requested target output
    rename_mapping = {
        'Report Name_1': 'Report Name',
        'Submit Date_1': 'Submit Date',
        'Report Date_1': 'Report Date',
        'Report Total_1': 'Report Total',
        'Amount Approved_1': 'Amount Approved'
    }
    overlaps.rename(columns=rename_mapping, inplace=True)

    # Define the exact output column order
    final_columns = [
        'Employee ID', 'Employee Name', 'Report Id_1', 'Report Name', 'Submit Date', 'Report Date', 
        'Report Total', 'Amount Approved', 'Report Start Date_1', 'Report End Date_1', 
        'Report Id_Overlap', 'Report Name_Overlap', 'Report Start Date_Overlap', 'Report End Date_Overlap', 
        'Submit Date_Overlap', 'Report Date_Overlap', 'Report Total_Overlap', 'Amount Approved_Overlap'
    ]
    
    # Keep only target columns
    final_df = overlaps[[c for c in final_columns if c in overlaps.columns]].drop_duplicates()

    # ==========================================
    # 4. EXPORT WITH HEADERS
    # ==========================================
    def _export_sheet(out_df, writer, insight_id, exception_no, exception_type, sheet_name):
        cols = out_df.columns.tolist()
        header_rows = [
            ['Insight ID ', insight_id] + [''] * (len(cols) - 2),
            ['Exception No', exception_no] + [''] * (len(cols) - 2),
            ['Exception Type', exception_type] + [''] * (len(cols) - 2),
            [''] * len(cols), [''] * len(cols), cols
        ]
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name=sheet_name)
        out_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name)

    print("💾 Saving Output...")
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        _export_sheet(final_df, writer, "PJPA21", "1", "Overlapping Dates for Travel", "Overlapping_Travel")

    print(f"✅ PJPA21 Workflow Completed! Found {len(final_df)} overlaps. Output saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_overlapping_travel_dates_insight(concur_file, "Output/PJPA21_Generated.xlsx")