import pandas as pd
import numpy as np

def generate_zscore_insights(concur_path, line_item_path, output_excel_path):
    print("🚀 Running PJPA24: Z-Score & Modified Z-Score Anomalies...")

    # ==========================================
    # 1. LOAD DATA (ONCE)
    # ==========================================
    print("📂 Reading Files...")
    concur_df = pd.read_excel(concur_path) if concur_path.endswith(('.xls', '.xlsx')) else pd.read_csv(concur_path, encoding="latin1", low_memory=False)
    line_item_df = pd.read_excel(line_item_path) if line_item_path.endswith(('.xls', '.xlsx')) else pd.read_csv(line_item_path, encoding="latin1", low_memory=False)

    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    line_item_df.rename(columns=lambda x: str(x).strip(), inplace=True)

    c_id = 'Report Id' if 'Report Id' in concur_df.columns else 'Report ID'
    l_id = 'Report Id' if 'Report Id' in line_item_df.columns else 'Report ID'

    concur_df['RID_Join'] = concur_df[c_id].astype(str).str.strip()
    line_item_df['RID_Join'] = line_item_df[l_id].astype(str).str.strip()

    df = pd.merge(line_item_df, concur_df, on='RID_Join', how='inner', suffixes=('', '_H'))

    # Basic Cleaning
    df['Approved Amount'] = pd.to_numeric(df['Approved Amount'], errors='coerce').fillna(0)
    df['Employee ID'] = df['Employee ID'].fillna("UNKNOWN").astype(str).str.strip()
    if 'To Location' not in df.columns:
        df['To Location'] = df.get('City/Location', "UNKNOWN")
    df['To Location'] = df['To Location'].fillna("UNKNOWN").astype(str).str.strip()

    df["RD"] = pd.to_datetime(df["Report Date"], errors="coerce")
    df["TD"] = pd.to_datetime(df["Transaction Date"], errors="coerce")

    # ==========================================
    # 2. HELPER FUNCTIONS
    # ==========================================
    def _export_sheet(out_df, writer, insight_id, exception_no, exception_type, sheet_name):
        cols = out_df.columns.tolist()
        header_rows = [
            ['Insight ID ', insight_id] + [''] * max(0, len(cols) - 2),
            ['Exception No', exception_no] + [''] * max(0, len(cols) - 2),
            ['Exception Type', exception_type] + [''] * max(0, len(cols) - 2),
            [''] * max(2, len(cols)), [''] * max(2, len(cols)), cols
        ]
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name=sheet_name)
        out_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name)

    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        
        # Core Z-Score calculation engine
        def calc_z(group_cols, is_mod, threshold, insight_id, ex_no, ex_type, sheet):
            temp = df.copy()
            if is_mod:
                median = temp.groupby(group_cols)["Approved Amount"].transform("median")
                temp["Abs_Dev"] = abs(temp["Approved Amount"] - median)
                mad = temp.groupby(group_cols)["Abs_Dev"].transform("median").replace(0, 1).fillna(1)
                temp["Z_Score"] = 0.6745 * ((temp["Approved Amount"] - median) / mad)
            else:
                mean = temp.groupby(group_cols)["Approved Amount"].transform("mean")
                std = temp.groupby(group_cols)["Approved Amount"].transform("std").replace(0, 1).fillna(1)
                temp["Z_Score"] = (temp["Approved Amount"] - mean) / std

            out = temp[temp["Z_Score"].abs() > threshold].copy()
            out.drop(columns=['RID_Join', 'RD', 'TD', 'Abs_Dev'], inplace=True, errors='ignore')
            
            # Format Z-Score for clean dashboard viewing
            if not out.empty:
                out["Z_Score"] = out["Z_Score"].round(2)
            else:
                # If no anomalies found, generate an empty template so headers don't break UI
                cols = temp.columns.drop(['RID_Join', 'RD', 'TD', 'Abs_Dev'], errors='ignore').tolist() + ["Z_Score"]
                out = pd.DataFrame(columns=cols)

            _export_sheet(out, writer, insight_id, str(ex_no), ex_type, sheet)

        # ==========================================
        # 3. GENERATE ALL 10 EXCEPTIONS INSTANTLY
        # ==========================================
        print("⚡ Calculating Anomalies...")
        
        # 1 & 2: Overall
        overall_cols = ["Employee ID", df["RD"].dt.year, df["RD"].dt.month, "To Location", df["TD"].dt.year, df["TD"].dt.month]
        calc_z(overall_cols, True, 3.5, "PJPA24", 1, "Modified Z-Score Anomaly (>3.5)", "Mod_Z_Overall")
        calc_z(overall_cols, False, 3.0, "PJPA24", 2, "Standard Z-Score Anomaly (>3.0)", "Std_Z_Overall")

        # 3 & 4: Employee
        calc_z(["Employee ID"], True, 3.5, "PJPA24", 3, "Employee Modified Z-Score (>3.5)", "Mod_Z_Emp")
        calc_z(["Employee ID"], False, 3.0, "PJPA24", 4, "Employee Standard Z-Score (>3.0)", "Std_Z_Emp")

        # 5 & 6: Location
        calc_z(["To Location"], True, 3.5, "PJPA24", 5, "Location Modified Z-Score (>3.5)", "Mod_Z_Loc")
        calc_z(["To Location"], False, 3.0, "PJPA24", 6, "Location Standard Z-Score (>3.0)", "Std_Z_Loc")

        # 7 & 8: Report Date (Year/Month)
        rd_cols = [df["RD"].dt.year, df["RD"].dt.month]
        calc_z(rd_cols, True, 3.5, "PJPA24", 7, "Report Date Modified Z-Score (>3.5)", "Mod_Z_RepDate")
        calc_z(rd_cols, False, 3.0, "PJPA24", 8, "Report Date Standard Z-Score (>3.0)", "Std_Z_RepDate")

        # 9 & 10: Transaction Date (Year/Month)
        td_cols = [df["TD"].dt.year, df["TD"].dt.month]
        calc_z(td_cols, True, 3.5, "PJPA24", 9, "Trans Date Modified Z-Score (>3.5)", "Mod_Z_TransDate")
        calc_z(td_cols, False, 3.0, "PJPA24", 10, "Trans Date Standard Z-Score (>3.0)", "Std_Z_TransDate")

    print(f"✅ PJPA24 Workflow Completed! Output saved to {output_excel_path}")