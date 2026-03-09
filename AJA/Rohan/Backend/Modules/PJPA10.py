import pandas as pd
import numpy as np

def generate_junior_senior_insight(concur_data_path, line_item_data_path, emp_master_path, output_excel_path):
    print("🚀 Running PJPA10: Junior vs. Senior Analysis...")

    # ==========================================
    # 1. READ & PREP SHARED DATA
    # ==========================================
    print("📂 Reading Files...")
    sap_df = pd.read_excel(concur_data_path)
    expense_df = pd.read_excel(line_item_data_path)
    emp_df = pd.read_excel(emp_master_path, usecols=["Personnel Number", "Employee Location", "Rep. Manager"])

    # Clean Column Names
    sap_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    expense_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    emp_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    expense_df.rename(columns={"Report ID": "Report Id", "To Location": "City/Location"}, inplace=True)

    # Clean IDs
    sap_df["Employee ID"] = sap_df["Employee ID"].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    expense_df["Employee ID"] = expense_df["Employee ID"].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    sap_df["Report Id"] = sap_df["Report Id"].astype(str).str.strip()
    expense_df["Report Id"] = expense_df["Report Id"].astype(str).str.strip()
    emp_df["Personnel Number"] = emp_df["Personnel Number"].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    emp_df["Rep. Manager"] = emp_df["Rep. Manager"].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)

    # Base Join
    joined_df = pd.merge(sap_df, expense_df, on=["Report Id", "Employee ID"], how="inner")
    
    # Safe Numeric Casts
    joined_df["Approved Amount"] = pd.to_numeric(joined_df["Approved Amount"], errors="coerce").fillna(0)
    joined_df["Total Approved Amount"] = pd.to_numeric(joined_df.get("Total Approved Amount", 0), errors="coerce").fillna(0)

    # Build Base Junior
    junior_base = pd.merge(emp_df, joined_df, left_on="Personnel Number", right_on="Employee ID", how="inner")
    junior_base.rename(columns={
        "Rep. Manager": "Manager ID", "Report Id": "Employee Report ID", 
        "Employee": "Employee Name", "Approved Amount": "Approved Amount Employee", 
        "Report Date": "Employee Report Date"
    }, inplace=True)

    # Build Base Senior
    senior_base = joined_df.copy()
    senior_base.rename(columns={"Employee ID": "Manager ID", "Employee": "Manager Name"}, inplace=True)
    senior_base = pd.merge(senior_base, emp_df, left_on="Manager ID", right_on="Personnel Number", how="left")
    senior_base.rename(columns={"Approved Amount": "Approved Amount_Manager", "Report Id": "Report ID_Manager"}, inplace=True)

    # Helper for Excel output
    def _export_sheet(df, writer, insight_id, exception_no, exception_type, sheet_name):
        cols = df.columns.tolist()
        header_rows = [
            ['Insight ID ', insight_id] + [''] * (len(cols) - 2),
            ['Exception No', exception_no] + [''] * (len(cols) - 2),
            ['Exception Type', exception_type] + [''] * (len(cols) - 2),
            [''] * len(cols), [''] * len(cols), cols
        ]
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name=sheet_name)
        df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name)

    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        
        # ==========================================
        # EXCEPTION 1: Same Transaction Date & Loc
        # ==========================================
        print("⚡ Processing Exception 1 (Transaction Date Match)...")
        j1 = junior_base.copy()
        s1 = senior_base.copy()
        
        j1["Unique_ID"] = j1["Manager ID"].astype(str) + "_" + j1["Transaction Date"].astype(str) + "_" + j1["Expense Type"].astype(str) + "_" + j1["City/Location"].astype(str)
        s1["Unique_ID"] = s1["Manager ID"].astype(str) + "_" + s1["Transaction Date"].astype(str) + "_" + s1["Expense Type"].astype(str) + "_" + s1["City/Location"].astype(str)
        
        # Vectorized Merge (replaces the slow loop)
        e1_merged = pd.merge(j1, s1, on="Unique_ID", how="inner", suffixes=("", "_Manager"))
        e1_merged = e1_merged[e1_merged["Approved Amount Employee"] > e1_merged["Approved Amount_Manager"]].copy()
        e1_merged["Difference"] = e1_merged["Approved Amount Employee"] - e1_merged["Approved Amount_Manager"]
        
        e1_cols = ["Employee ID", "Employee Name", "Currency", "Submit Date", "Approval Status", "Payment Type", "Report Date", "Transaction Date", "City/Location", "Employee Report ID", "Report Name", "Report Start Date", "Report End Date", "Employee Report Date", "Expense Type", "Approved Amount Employee", "Manager ID", "Manager Name", "Submit Date_Manager", "Report ID_Manager", "Transaction Date_Manager", "City/Location_Manager", "Report Name_Manager", "Approval Status_Manager", "Payment Type_Manager", "Expense Type_Manager", "Approved Amount_Manager", "Difference"]
        e1_final = e1_merged[[c for c in e1_cols if c in e1_merged.columns]].drop_duplicates()
        _export_sheet(e1_final, writer, "PJPA10", "1", "Junior claim > Senior (Same Date & Loc)", "Exception_1")

        # ==========================================
        # FAST DATE EXPANSION (For E2 & E3)
        # ==========================================
        print("⚡ Expanding Dates for E2 and E3 using Vectorization...")
        def fast_expand(df):
            df["Start"] = pd.to_datetime(df["Report Start Date"], errors="coerce")
            df["End"] = pd.to_datetime(df["Report End Date"], errors="coerce").fillna(df["Start"])
            # Calculate day diff early
            df["Days_Difference"] = (df["End"] - df["Start"]).dt.days + 1
            
            # Vectorized date explosion
            df = df.dropna(subset=["Start", "End"])
            df["Expand Date"] = df.apply(lambda r: pd.date_range(r["Start"], r["End"]).strftime("%d.%m.%Y").tolist(), axis=1)
            return df.explode("Expand Date").drop(columns=["Start", "End"])

        j_exp = fast_expand(junior_base.copy())
        s_exp = fast_expand(senior_base.copy())
        
        j_exp["Unique_ID"] = j_exp["Manager ID"].astype(str) + "_" + j_exp["Employee Location"].astype(str) + "_" + j_exp["Expand Date"].astype(str) + "_" + j_exp["City/Location"].astype(str)
        s_exp["Unique_ID"] = s_exp["Manager ID"].astype(str) + "_" + s_exp["Employee Location"].astype(str) + "_" + s_exp["Expand Date"].astype(str) + "_" + s_exp["City/Location"].astype(str)

        # Base merge for expanded data
        exp_merged = pd.merge(j_exp, s_exp, on="Unique_ID", how="inner", suffixes=("", "_Manager"))
        
        # ==========================================
        # EXCEPTION 2: Expanded Date Daily Averages
        # ==========================================
        print("⚡ Processing Exception 2 (Expanded Date Averages)...")
        e2_merged = exp_merged.copy()
        
        e2_merged["Employee Amount"] = e2_merged["Total Approved Amount"] / e2_merged["Days_Difference"]
        e2_merged["Manager Amount"] = e2_merged["Total Approved Amount_Manager"] / e2_merged["Days_Difference_Manager"]
        
        e2_merged = e2_merged[e2_merged["Employee Amount"] > e2_merged["Manager Amount"]].copy()
        e2_merged.rename(columns={"Employee Amount": "Average of Amount_Employee", "Manager Amount": "Average of Amount_Manager"}, inplace=True)
        
        e2_cols = ["Employee ID", "Employee Name", "Manager ID", "Manager Name", "Employee Report ID", "Report ID_Manager", "Employee Location", "City/Location", "Employee Location_Manager", "City/Location_Manager", "Report Start Date", "Report End Date", "Report Start Date_Manager", "Report End Date_Manager", "Report Name", "Report Number", "Report Total", "Payment Status", "Amount Due Employee", "Policy", "Expense Type", "Person Band", "Approval Status_Manager", "Currency_Manager", "Report Total_Manager", "Payment Status_Manager", "Amount Due Employee_Manager", "Report Date", "Expense Type_Manager", "Days_Difference", "Days_Difference_Manager", "Total Approved Amount", "Total Approved Amount_Manager", "Average of Amount_Employee", "Average of Amount_Manager"]
        e2_final = e2_merged[[c for c in e2_cols if c in e2_merged.columns]].drop_duplicates()
        _export_sheet(e2_final, writer, "PJPA10", "2", "Junior Daily Avg > Senior (Expanded Dates)", "Exception_2")

        # ==========================================
        # EXCEPTION 3: Expanded Date Same Expense Type
        # ==========================================
        print("⚡ Processing Exception 3 (Expanded Date Same Type)...")
        e3_merged = exp_merged.copy()
        
        e3_merged = e3_merged[e3_merged["Expense Type"] == e3_merged["Expense Type_Manager"]]
        e3_merged = e3_merged[e3_merged["Approved Amount Employee"] > e3_merged["Approved Amount_Manager"]].copy()
        e3_merged["Difference"] = e3_merged["Approved Amount Employee"] - e3_merged["Approved Amount_Manager"]
        
        e3_cols = ["Employee ID", "Employee Name", "Currency", "Submit Date", "Approval Status", "Payment Type", "Report Date", "Transaction Date", "City/Location", "Employee Report ID", "Report Name", "Report Start Date", "Report End Date", "Employee Report Date", "Expense Type", "Approved Amount Employee", "Manager ID", "Manager Name", "Submit Date_Manager", "Report ID_Manager", "Transaction Date_Manager", "City/Location_Manager", "Report Name_Manager", "Approval Status_Manager", "Payment Type_Manager", "Expense Type_Manager", "Approved Amount_Manager", "Employee Location", "Report Start Date_Manager", "Report End Date_Manager", "Employee Location_Manager", "Difference"]
        e3_final = e3_merged[[c for c in e3_cols if c in e3_merged.columns]].drop_duplicates()
        _export_sheet(e3_final, writer, "PJPA10", "3", "Junior claim > Senior (Same Expanded Date & Type)", "Exception_3")

    print(f"✅ PJPA10 Workflow Completed! Saved to {output_excel_path}")

# Example to trigger it in orchestrator:
# generate_junior_senior_insight(concur_file, line_item_file, emp_master_file, "Output/PJPA10_Generated.xlsx")