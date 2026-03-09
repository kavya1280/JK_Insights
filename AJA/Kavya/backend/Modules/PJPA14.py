import pandas as pd
import numpy as np

def generate_duplicate_claims_insight(line_item_data_path, output_excel_path):
    print("🚀 Running PJPA14: Duplicate Claims Analysis...")

    # ==========================================
    # 1. READ & PREP DATA (Done Once)
    # ==========================================
    print("📂 Reading File...")
    # Using low_memory=False to handle mixed types gracefully in large datasets
    df = pd.read_excel(line_item_data_path) if line_item_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(line_item_data_path, encoding="latin1", low_memory=False)
    
    # Clean column names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    # Standardize types for accurate grouping
    report_col = 'Report Id' if 'Report Id' in df.columns else 'Report ID'
    df['Report ID_Clean'] = df[report_col].astype(str).str.strip()
    df['Employee ID_Clean'] = df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    
    # Convert amounts to float, then format to string with 2 decimals to avoid matching errors (e.g., "150" != "150.0")
    df['Approved Amount_Numeric'] = pd.to_numeric(df['Approved Amount'], errors='coerce').fillna(0)
    df['Approved Amount_Str'] = df['Approved Amount_Numeric'].apply(lambda x: f"{x:.2f}")

    # Standardize Dates
    df["Transaction Date_Parsed"] = pd.to_datetime(df["Transaction Date"], errors="coerce")
    df["Transaction Date_Str"] = df["Transaction Date_Parsed"].dt.strftime('%Y-%m-%d').fillna("Unknown")
    df["Transaction Month_Str"] = df["Transaction Date_Parsed"].dt.month.fillna(-1).astype(int).astype(str)

    # Helper for Excel output
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
        # EXCEPTION 1: Same Report ID, Employee ID, Amount
        # ==========================================
        print("⚡ Processing Exception 1 (Exact Line-Item Duplicates)...")
        e1_df = df.copy()
        e1_df["Unique ID"] = e1_df["Report ID_Clean"] + "_" + e1_df["Approved Amount_Str"] + "_" + e1_df["Employee ID_Clean"]
        
        # Keep only valid unique IDs and find exact duplicates
        e1_df = e1_df[~e1_df["Unique ID"].str.contains("nan", case=False, na=True)]
        e1_dupes = e1_df[e1_df.duplicated(subset=["Unique ID"], keep=False)].copy()
        
        _export_sheet(e1_dupes.drop(columns=['Report ID_Clean', 'Employee ID_Clean', 'Approved Amount_Numeric', 'Approved Amount_Str', 'Transaction Date_Parsed', 'Transaction Date_Str', 'Transaction Month_Str']), 
                      writer, "PJPA14", "1", "Same Employee ID, Report ID, and Amount", "Exact_Duplicates")

        # ==========================================
        # EXCEPTION 2: Same Date, Emp ID, Amount -> DIFFERENT Expense Type
        # ==========================================
        print("⚡ Processing Exception 2 (Cross-Category Duplicates Same Day)...")
        e2_df = df.copy()
        e2_df["Unique ID_Day"] = e2_df["Transaction Date_Str"] + "_" + e2_df["Approved Amount_Str"] + "_" + e2_df["Employee ID_Clean"]
        
        # Find groups with more than 1 UNIQUE expense type
        e2_grouped = e2_df.groupby("Unique ID_Day")["Expense Type"].nunique().reset_index(name="Unique Count Expense Type")
        e2_flagged_ids = e2_grouped[e2_grouped["Unique Count Expense Type"] > 1]["Unique ID_Day"]
        
        # Filter original dataframe for flagged groups and merge the count back
        e2_dupes = e2_df[e2_df["Unique ID_Day"].isin(e2_flagged_ids)].copy()
        e2_dupes = pd.merge(e2_grouped[e2_grouped["Unique Count Expense Type"] > 1], e2_dupes, on="Unique ID_Day", how="left")
        
        _export_sheet(e2_dupes.drop(columns=['Report ID_Clean', 'Employee ID_Clean', 'Approved Amount_Numeric', 'Approved Amount_Str', 'Transaction Date_Parsed', 'Transaction Date_Str', 'Transaction Month_Str']), 
                      writer, "PJPA14", "2", "Same Date, Amount, Employee ID but Different Expense Type", "Different_Type_Same_Day")

        # ==========================================
        # EXCEPTION 3: Same Month, Emp ID, Amount -> DIFFERENT Expense Type
        # ==========================================
        print("⚡ Processing Exception 3 (Cross-Category Duplicates Same Month)...")
        e3_df = df.copy()
        # Exclude unknown months
        e3_df = e3_df[e3_df["Transaction Month_Str"] != "-1"]
        e3_df["Unique ID_Month"] = e3_df["Transaction Month_Str"] + "_" + e3_df["Approved Amount_Str"] + "_" + e3_df["Employee ID_Clean"]
        
        # Find groups with more than 1 UNIQUE expense type
        e3_grouped = e3_df.groupby("Unique ID_Month")["Expense Type"].nunique().reset_index(name="Unique Count Expense Type")
        e3_flagged_ids = e3_grouped[e3_grouped["Unique Count Expense Type"] > 1]["Unique ID_Month"]
        
        e3_dupes = e3_df[e3_df["Unique ID_Month"].isin(e3_flagged_ids)].copy()
        e3_dupes = pd.merge(e3_grouped[e3_grouped["Unique Count Expense Type"] > 1], e3_dupes, on="Unique ID_Month", how="left")
        
        _export_sheet(e3_dupes.drop(columns=['Report ID_Clean', 'Employee ID_Clean', 'Approved Amount_Numeric', 'Approved Amount_Str', 'Transaction Date_Parsed', 'Transaction Date_Str', 'Transaction Month_Str']), 
                      writer, "PJPA14", "3", "Same Month, Amount, Employee ID but Different Expense Type", "Different_Type_Same_Month")

    print(f"✅ PJPA14 Workflow Completed! Output saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_duplicate_claims_insight(line_item_file, "Output/PJPA14_Generated.xlsx")