import pandas as pd
import numpy as np

def generate_multiple_travel_modes_insight(line_item_data_path, output_excel_path):
    print("🚀 Running PJPA19: Dynamic Multiple Travel Mode Analysis...")

    df = pd.read_excel(line_item_data_path) if line_item_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(line_item_data_path, encoding="latin1", low_memory=False)
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    report_col = 'Report Id' if 'Report Id' in df.columns else 'Report ID'
    df['Report ID_Clean'] = df[report_col].astype(str).str.strip()

    travel_types = ["AIRFARE", "AUTO/ METRO/ SHARED TAXI (LOCAL CONVEYANCE)", "BUS", "HIRED TAXI", "METRO", "PERSONAL BIKE", "PERSONAL CAR", "TRAIN"]
    df["Expense Type Clean"] = df["Expense Type"].astype(str).str.strip().str.upper()
    df_travel = df[df["Expense Type Clean"].isin(travel_types)].copy()

    report_combos = df_travel.groupby("Report ID_Clean")["Expense Type"].unique().apply(lambda x: ", ".join(sorted(x))).reset_index(name="Travel Combination")
    
    toxic_reports = report_combos[report_combos["Travel Combination"].str.contains(",")].copy()
    combo_counts = toxic_reports.groupby("Travel Combination")["Report ID_Clean"].count().reset_index(name="Combo Occurrence Count")
    toxic_reports = pd.merge(toxic_reports, combo_counts, on="Travel Combination", how="left")

    final_df = pd.merge(toxic_reports, df_travel, on="Report ID_Clean", how="inner")
    
    if final_df.empty:
        final_df = pd.DataFrame(columns=["Report ID", "Travel Combination", "Combo Occurrence Count", "Employee", "Report Name", "Total Approved Amount", "City/Location"])
    else:
        # --- FIX: DROP THE TEMP COLUMN SO WE DON'T CREATE DUPLICATE NAMES ---
        final_df.drop(columns=['Report ID_Clean', 'Expense Type Clean'], inplace=True, errors='ignore')
        final_df.sort_values(by=['Combo Occurrence Count', report_col], ascending=[False, True], inplace=True)

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
        _export_sheet(final_df, writer, "PJPA19", "1", "Multiple Travel Modes For Same Trip", "Toxic_Combinations")