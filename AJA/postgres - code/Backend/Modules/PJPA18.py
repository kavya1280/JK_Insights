import pandas as pd
import numpy as np

def generate_multiple_submits_insight(concur_data_path, line_item_data_path, output_excel_path):
    print("🚀 Running PJPA18: Multiple Submits for Same Travel Analysis...")

    # ==========================================
    # 1. READ & PREP DATA (Done Once)
    # ==========================================
    print("📂 Reading Files...")
    # Supports both CSV and Excel seamlessly
    sap_df = pd.read_excel(concur_data_path) if concur_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(concur_data_path, encoding="latin1", low_memory=False)
    expense_df = pd.read_excel(line_item_data_path) if line_item_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(line_item_data_path, encoding="latin1", low_memory=False)

    # Clean column names
    sap_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    expense_df.rename(columns=lambda x: str(x).strip(), inplace=True)

    # Standardize Join Keys
    c_id = 'Report Id' if 'Report Id' in sap_df.columns else 'Report ID'
    l_id = 'Report Id' if 'Report Id' in expense_df.columns else 'Report ID'
    
    sap_df['Report Id_Join'] = sap_df[c_id].astype(str).str.strip()
    expense_df['Report Id_Join'] = expense_df[l_id].astype(str).str.strip()
    
    sap_df['Employee ID_Join'] = sap_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    expense_df['Employee ID_Join'] = expense_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)

    # ==========================================
    # 2. MASTER JOIN
    # ==========================================
    print("🔗 Performing Master Join...")
    joined_df = pd.merge(sap_df, expense_df, left_on=["Report Id_Join", "Employee ID_Join"], right_on=["Report Id_Join", "Employee ID_Join"], how="inner", suffixes=('', '_Right'))

    # Convert dates to string safely for grouping
    joined_df["Report Start Date_Str"] = joined_df["Report Start Date"].astype(str).str.strip()
    joined_df["Report End Date_Str"] = joined_df["Report End Date"].astype(str).str.strip()
    joined_df["Transaction Date_Str"] = joined_df["Transaction Date"].astype(str).str.strip()

    # Define standard output columns
    final_columns = [
        "Report Name", "Report Id", "Report Number", "Submit Date", "Employee Name",
        "Approval Status", "Report Start Date", "Report End Date", "Currency", "Report Total",
        "Payment Status", "Amount Due Employee", "Report Date", "Policy", "Amount Approved",
        "Employee ID", "Transaction Date", "City/Location", "Approved Amount", "Unique ID"
    ]

    # Helper for Excel output formatting
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

    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        
        # ==========================================
        # EXCEPTION 1: Same Report Start/End Dates
        # ==========================================
        print("⚡ Processing Exception 1 (Same Travel Dates across multiple reports)...")
        e1_df = joined_df.copy()
        e1_df["Unique ID"] = e1_df["Employee ID_Join"] + "_" + e1_df["Report Start Date_Str"] + "_" + e1_df["Report End Date_Str"]
        
        e1_grouped = e1_df.groupby("Unique ID")["Report Id_Join"].nunique().reset_index(name="Unique Count")
        e1_flagged = e1_grouped[e1_grouped["Unique Count"] > 1]["Unique ID"]
        
        e1_final = e1_df[e1_df["Unique ID"].isin(e1_flagged)].drop_duplicates()
        
        e1_cols = [c for c in final_columns if c in e1_final.columns]
        if "Unique ID" not in e1_cols: e1_cols.append("Unique ID")
        e1_final = e1_final[e1_cols]
        
        _export_sheet(e1_final, writer, "PJPA18", "1", "Multiple Submits for Same Travel (Start/End Date)", "Same_Travel_Dates")

        # ==========================================
        # EXCEPTION 2: Same Transaction Date
        # ==========================================
        print("⚡ Processing Exception 2 (Same Transaction Date across multiple reports)...")
        e2_df = joined_df.copy()
        e2_df["Unique ID"] = e2_df["Employee ID_Join"] + "_" + e2_df["Transaction Date_Str"]
        
        e2_grouped = e2_df.groupby("Unique ID")["Report Id_Join"].nunique().reset_index(name="Unique Count")
        e2_flagged = e2_grouped[e2_grouped["Unique Count"] > 1]["Unique ID"]
        
        e2_final = e2_df[e2_df["Unique ID"].isin(e2_flagged)].drop_duplicates()
        
        e2_cols = [c for c in final_columns if c in e2_final.columns]
        if "Unique ID" not in e2_cols: e2_cols.append("Unique ID")
        e2_final = e2_final[e2_cols]
        
        _export_sheet(e2_final, writer, "PJPA18", "2", "Multiple Submits for Same Travel (Transaction Date)", "Same_Transaction_Date")

    print(f"✅ PJPA18 Workflow Completed! Output saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_multiple_submits_insight(concur_file, line_item_file, "Output/PJPA18_Generated.xlsx")