import pandas as pd
import numpy as np

def generate_submit_before_start_insight(concur_data_path, output_excel_path):
    print("🚀 Running PJPA23: Submit Date Before Report Start Date Analysis...")

    # ==========================================
    # 1. READ & PREP DATA
    # ==========================================
    print("📂 Reading File...")
    # Supports both CSV and Excel seamlessly
    df = pd.read_excel(concur_data_path) if concur_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(concur_data_path, encoding="latin1", low_memory=False)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    # ==========================================
    # 2. DATE PARSING & FILTERING
    # ==========================================
    print("📅 Parsing Dates...")
    # .dt.normalize() sets the time to midnight so we only compare the calendar day!
    df["Submit_Date_Parsed"] = pd.to_datetime(df["Submit Date"], errors="coerce").dt.normalize()
    df["Report_Start_Date_Parsed"] = pd.to_datetime(df["Report Start Date"], errors="coerce").dt.normalize()

    print("🔎 Filtering Exceptions...")
    # Exception: Submit Date is strictly before Report Start Date
    exceptions = df[df["Submit_Date_Parsed"] < df["Report_Start_Date_Parsed"]].copy()

    # Compute Difference
    exceptions["Days_Difference"] = (exceptions["Report_Start_Date_Parsed"] - exceptions["Submit_Date_Parsed"]).dt.days

    # Clean up output date formatting to match the clean 'YYYY-MM-DD' structure
    exceptions["Submit Date"] = exceptions["Submit_Date_Parsed"].dt.strftime('%Y-%m-%d')
    exceptions["Report Start Date"] = exceptions["Report_Start_Date_Parsed"].dt.strftime('%Y-%m-%d')

    # ==========================================
    # 3. FORMAT FINAL OUTPUT
    # ==========================================
    # Sort by the most egregious differences first
    exceptions.sort_values("Days_Difference", ascending=False, inplace=True)

    expected_columns = [
        "Employee ID", "Report Name", "Report Id", "Report Number", "Employee Name",
        "Approval Status", "Report End Date", "Currency", "Report Total",
        "Payment Status", "Amount Due Employee", "Report Date", "Policy",
        "Amount Approved", "Submit Date", "Report Start Date", "Days_Difference"
    ]

    # Gracefully add missing columns to prevent crashes if the schema drifts
    for col in expected_columns:
        if col not in exceptions.columns:
            exceptions[col] = np.nan

    final_df = exceptions[expected_columns]

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
        _export_sheet(final_df, writer, "PJPA23", "1", "Submit Date Before Report Start Date", "Submit_Before_Start")

    print(f"✅ PJPA23 Workflow Completed! Found {len(final_df)} exceptions. Output saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_submit_before_start_insight(concur_file, "Output/PJPA23_Generated.xlsx")