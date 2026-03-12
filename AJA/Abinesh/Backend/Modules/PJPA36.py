import pandas as pd
import numpy as np

def generate_pjpa36_missing_days(input_excel_path, output_excel_path):
    print("🚀 Running PJPA36: Missing Days Analysis (Submit Date)...")

    # =====================================================
    # 1. LOAD DATA
    # =====================================================
    print("📂 Reading File...")
    df = pd.read_excel(input_excel_path) if input_excel_path.endswith(('.xls', '.xlsx')) else pd.read_csv(input_excel_path, encoding="latin1", low_memory=False)
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    if 'Submit Date' not in df.columns:
        print("❌ 'Submit Date' column not found.")
        return

    # =====================================================
    # 2. CLEAN SUBMIT DATE
    # =====================================================
    # Remove time after T and convert to date
    df['Submit Date'] = df['Submit Date'].astype(str).str.split('T').str[0]
    df['Submit Date'] = pd.to_datetime(df['Submit Date'], errors='coerce').dt.date
    df = df[df['Submit Date'].notna()].copy()

    # =====================================================
    # 3. FIND MISSING DATES
    # =====================================================
    print("📅 Calculating Date Gaps...")
    if df.empty:
        total_dates_count = 0
        missing_dates = []
        daily_status_df = pd.DataFrame(columns=['Date', 'Status', 'Available_Count', 'Missing_Count'])
    else:
        min_date = df['Submit Date'].min()
        max_date = df['Submit Date'].max()
        print(f"   -> Date range: {min_date} to {max_date}")

        full_dates = pd.date_range(start=min_date, end=max_date, freq='D').date
        total_dates_count = len(full_dates)
        present_dates = set(df['Submit Date'].unique())
        missing_dates = sorted(set(full_dates) - present_dates)

        # Create Daily Status DataFrame for Charts
        daily_status_data = []
        for d in full_dates:
            is_present = d in present_dates
            daily_status_data.append({
                'Date': str(d),
                'Status': 'Available' if is_present else 'Missing',
                'Available_Count': 1 if is_present else 0,
                'Missing_Count': 0 if is_present else 1
            })
        daily_status_df = pd.DataFrame(daily_status_data)

    # Summary DataFrame
    summary_df = pd.DataFrame({
        'Metric': ['Total Dates', 'Missing Dates'],
        'Value': [total_dates_count, len(missing_dates)]
    })

    # Missing Dates List DataFrame
    missing_list_df = pd.DataFrame({
        'Missing Submit Date': [str(d) for d in missing_dates],
        'Notes': ['' for _ in missing_dates] 
    })

    # =====================================================
    # 5. EXPORT WITH HEADERS
    # =====================================================
    def _export_sheet(out_df, writer, insight_id, exception_no, exception_type, sheet_name):
        cols = out_df.columns.tolist()
        header_rows = [
            ['Insight ID ', insight_id] + [''] * max(0, len(cols) - 2),
            ['Exception No', exception_no] + [''] * max(0, len(cols) - 2),
            ['Exception Type', exception_type] + [''] * max(0, len(cols) - 2),
            [''] * max(2, len(cols)),
            [''] * max(2, len(cols)),
            cols
        ]
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name=sheet_name)
        out_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name)

    print("💾 Saving Output...")
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        _export_sheet(summary_df, writer, "PJPA36", "1", "Missing Submit Date - Summary", "Summary")
        _export_sheet(daily_status_df, writer, "PJPA36", "2", "Date Presence Analysis", "Daily_Status")
        _export_sheet(missing_list_df, writer, "PJPA36", "3", "Missing Submit Date (Date Gaps)", "Missing_Dates_List")

    print(f"✅ PJPA36 Workflow Completed! Found {len(missing_dates)} missing days.")

# Example to trigger it in orchestrator:
# generate_pjpa36_missing_days(concur_file, "Output/PJPA36_Generated.xlsx")