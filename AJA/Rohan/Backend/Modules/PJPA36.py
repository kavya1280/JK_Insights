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
        missing_dates = []
    else:
        min_date = df['Submit Date'].min()
        max_date = df['Submit Date'].max()
        print(f"   -> Date range: {min_date} to {max_date}")

        full_dates = pd.date_range(start=min_date, end=max_date, freq='D').date
        present_dates = set(df['Submit Date'].unique())
        missing_dates = sorted(set(full_dates) - present_dates)

    # =====================================================
    # 4. CREATE DATAFRAME (WITH 2 COLUMNS TO FIX UI BUG)
    # =====================================================
    # We add an empty 'Notes' column so the table is 2 columns wide. 
    # This prevents Pandas from naming the empty metadata column "Unnamed: 1"
    missing_df = pd.DataFrame({
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
        _export_sheet(missing_df, writer, "PJPA36", "1", "Missing Submit Date (Date Gaps)", "Missing_Dates")

    print(f"✅ PJPA36 Workflow Completed! Found {len(missing_dates)} missing days.")

# Example to trigger it in orchestrator:
# generate_pjpa36_missing_days(concur_file, "Output/PJPA36_Generated.xlsx")