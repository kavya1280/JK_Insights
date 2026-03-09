import pandas as pd
import numpy as np

def generate_odd_time_submission_insight(concur_data_path, output_excel_path):
    print("🚀 Running PJPA20: Late Night / Early Morning Report Detection...")

    # ==========================================
    # 1. READ & PREP DATA
    # ==========================================
    print("📂 Reading File...")
    # Supports both CSV and Excel seamlessly
    df = pd.read_excel(concur_data_path) if concur_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(concur_data_path, encoding="latin1", low_memory=False)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    # Ensure 'Submit Date' exists
    if 'Submit Date' not in df.columns:
        print("❌ 'Submit Date' column not found. Exiting module.")
        return

    # ==========================================
    # 2. EXTRACT TIME LOGIC
    # ==========================================
    print("📅 Parsing Submit Dates and extracting time...")
    # Parse datetime safely
    df["Submit Date Parsed"] = pd.to_datetime(df["Submit Date"], errors="coerce")
    df["Hour"] = df["Submit Date Parsed"].dt.hour
    
    # Rule Based Row Filter: Hour < 8 OR Hour >= 20
    print("🔎 Filtering Early Morning / Late Night...")
    filtered_df = df[(df["Hour"] < 8) | (df["Hour"] >= 20)].copy()
    
    # Create new columns using vectorized operations (faster than apply/lambda)
    filtered_df["Submit Time"] = filtered_df["Submit Date Parsed"].dt.time
    filtered_df["Shift_Type"] = np.where(filtered_df["Hour"] < 8, "Early Morning", "Late Night")

    # ==========================================
    # 3. SELECT AND ORDER COLUMNS
    # ==========================================
    expected_columns = [
        "Employee ID", "Report Name", "Report Id", "Report Number", "Submit Date",
        "Employee Name", "Approval Status", "Report Start Date", "Report End Date",
        "Currency", "Report Total", "Payment Status", "Amount Due Employee",
        "Report Date", "Policy", "Amount Approved", "Submit Time", "Shift_Type"
    ]
    
    # Gracefully add missing columns if schema drifts over time
    for col in expected_columns:
        if col not in filtered_df.columns:
            filtered_df[col] = np.nan
            
    # Filter columns and drop exact duplicates
    final_df = filtered_df[expected_columns].drop_duplicates()

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
        _export_sheet(final_df, writer, "PJPA20", "1", "Odd Time Submission (Late Night / Early Morning)", "Odd_Time_Submissions")

    print(f"✅ PJPA20 Workflow Completed! Found {len(final_df)} exceptions. Output saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_odd_time_submission_insight(concur_file, "Output/PJPA20_Generated.xlsx")