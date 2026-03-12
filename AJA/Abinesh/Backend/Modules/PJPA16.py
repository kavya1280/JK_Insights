import pandas as pd
import numpy as np

def generate_duplicate_employee_insight(emp_master_path, output_excel_path):
    print("🚀 Running PJPA16: Employee Master Duplicate Check...")

    # ==========================================
    # 1. READ & CLEAN DATA (Done Once)
    # ==========================================
    print("📂 Reading Employee Master File...")
    df = pd.read_excel(emp_master_path)
    
    # Clean Column Names
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    # Clean the crucial string columns for accurate grouping
    print("🧹 Cleaning String Columns...")
    df["Full Name"] = df["Full Name"].astype(str).str.strip().str.replace(r"\s+", " ", regex=True).str.upper()
    df["Employee Email Id"] = df["Employee Email Id"].astype(str).str.strip().str.lower()
    df["Phone Number"] = df["Phone Number"].astype(str).str.strip().str.replace(r"\.0$", "", regex=True)
    df["Bank Account"] = df["Bank Account"].astype(str).str.strip().str.replace(r"\.0$", "", regex=True)

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

    # Helper for processing duplicates
    def get_duplicates(group_cols):
        # Group by the target columns and count unique Personnel Numbers
        grouped = df.groupby(group_cols)["Personnel Number"].nunique().reset_index(name="Unique Count")
        
        # Filter where count > 1
        filtered = grouped[grouped["Unique Count"] > 1]
        
        # Merge back to get the full rows for those duplicates
        result = pd.merge(filtered, df, on=group_cols, how="left")
        
        # Create the Combined ID dynamically
        result["Combined ID"] = result[group_cols].astype(str).agg('_'.join, axis=1)
        return result

    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        
        # ==========================================
        # EXCEPTION 1: Duplicate by Full Name Only
        # ==========================================
        print("⚡ Processing Exception 1 (Duplicate Full Name)...")
        e1_dupes = get_duplicates(["Full Name"])
        _export_sheet(e1_dupes, writer, "PJPA16", "1", "Duplicate Name but different Employee ID", "Duplicate_Name")

        # ==========================================
        # EXCEPTION 2: Duplicate by Full Name + Email
        # ==========================================
        print("⚡ Processing Exception 2 (Duplicate Name & Email)...")
        # Ensure 'nan' emails are not falsely grouped together
        df_e2 = df[df["Employee Email Id"] != "nan"].copy()
        e2_dupes = get_duplicates(["Full Name", "Employee Email Id"])
        _export_sheet(e2_dupes, writer, "PJPA16", "2", "Duplicate Name and Email", "Duplicate_Name_Email")

        # ==========================================
        # EXCEPTION 3: Duplicate by Full Name + Phone Number
        # ==========================================
        print("⚡ Processing Exception 3 (Duplicate Name & Phone)...")
        df_e3 = df[df["Phone Number"] != "nan"].copy()
        e3_dupes = get_duplicates(["Full Name", "Phone Number"])
        _export_sheet(e3_dupes, writer, "PJPA16", "3", "Duplicate Name and Phone Number", "Duplicate_Name_Phone")

        # ==========================================
        # EXCEPTION 4: Duplicate by Full Name + Bank Account
        # ==========================================
        print("⚡ Processing Exception 4 (Duplicate Name & Bank Account)...")
        df_e4 = df[df["Bank Account"] != "nan"].copy()
        e4_dupes = get_duplicates(["Full Name", "Bank Account"])
        _export_sheet(e4_dupes, writer, "PJPA16", "4", "Duplicate Name and Bank Account", "Duplicate_Name_Bank")

        # ==========================================
        # EXCEPTION 5: Duplicate by Name + Bank + Email + Phone
        # ==========================================
        print("⚡ Processing Exception 5 (Duplicate Across 4 Fields)...")
        df_e5 = df[(df["Bank Account"] != "nan") & (df["Employee Email Id"] != "nan") & (df["Phone Number"] != "nan")].copy()
        e5_dupes = get_duplicates(["Full Name", "Bank Account", "Employee Email Id", "Phone Number"])
        _export_sheet(e5_dupes, writer, "PJPA16", "5", "Duplicate Name, Bank, Email, and Phone", "Duplicate_All_Four")

    print(f"✅ PJPA16 Workflow Completed! Output saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_duplicate_employee_insight(emp_master_file, "Output/PJPA16_Generated.xlsx")