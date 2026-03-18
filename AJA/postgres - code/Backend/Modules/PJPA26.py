import pandas as pd
import numpy as np
from decimal import Decimal, getcontext

# --- PRIVATE UTILITIES ---

def _prepare_data(concur_path, line_item_path):
    concur_df = pd.read_excel(concur_path)
    line_item_df = pd.read_excel(line_item_path)
    
    concur_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    line_item_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    
    # Standardize join keys
    c_id = 'Report Id' if 'Report Id' in concur_df.columns else 'Report ID'
    l_id = 'Report Id' if 'Report Id' in line_item_df.columns else 'Report ID'
    
    concur_df['RID_Join'] = concur_df[c_id].astype(str).str.strip()
    line_item_df['RID_Join'] = line_item_df[l_id].astype(str).str.strip()
    
    df = pd.merge(line_item_df, concur_df, on='RID_Join', how='inner', suffixes=('', '_H'))
    
    # Cleaning
    df['Approved Amount'] = pd.to_numeric(df['Approved Amount'], errors='coerce').fillna(0)
    if 'To Location' not in df.columns:
        df['To Location'] = df.get('City/Location', "UNKNOWN")
    df['To Location'] = df['To Location'].fillna("UNKNOWN").astype(str).str.strip()
    
    # Handle Person Band naming variations
    band_col = 'Person Band' if 'Person Band' in df.columns else 'Person Band before PMS'
    df['Band_Ref'] = df[band_col].fillna("UNKNOWN").astype(str).str.strip()
    
    return df, band_col

def _export_excel_with_context(df, output_path, insight_id, exception_type, columns):
    header_rows = [
        ['Insight ID ', insight_id] + [''] * (len(columns) - 2),
        ['Exception No', '1'] + [''] * (len(columns) - 2),
        ['Exception Type', exception_type] + [''] * (len(columns) - 2),
        [''] * len(columns), [''] * len(columns),
        columns
    ]
    header_df = pd.DataFrame(header_rows)
    with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, index=False, header=False, sheet_name='Sheet1')
        df[columns].to_excel(writer, index=False, header=False, startrow=6, sheet_name='Sheet1')

# --- VARIANCE MODULES ---

def run_E1_same_level_variance(concur, line, out):
    """Variance analysis within the same Person Band."""
    df, band_col = _prepare_data(concur, line)
    getcontext().prec = 28 
    
    keys = ["Expense Type", "Band_Ref", "To Location"]
    
    # Calculate Precise Mean
    def precise_mean(s):
        vals = [Decimal(str(v)) for v in s if pd.notna(v)]
        return float(sum(vals) / len(vals)) if vals else 0

    stats = df.groupby(keys)["Approved Amount"].apply(precise_mean).reset_index(name="Avg_app_Amount")
    df = df.merge(stats, on=keys, how="left")
    
    # Variance Calculation
    df["Avg_app_Amount"] = df["Avg_app_Amount"].replace(0, 1)
    df["Variance%"] = ((df["Approved Amount"] - df["Avg_app_Amount"]) / df["Avg_app_Amount"]) * 100
    df["Exception"] = np.where(df["Variance%"] > 20, "Exception", "Normal")
    
    # Reference Row Filter (Context)
    df["Group_ID"] = df[keys[0]] + df[keys[1]] + df[keys[2]]
    exc_groups = df[df["Exception"] == "Exception"]["Group_ID"].unique()
    final_df = df[df["Group_ID"].isin(exc_groups)].sort_values(["Group_ID", "Variance%"], ascending=[True, False])
    
    cols = ['Employee', 'Report Name', 'Report ID', 'Employee ID', 'To Location', 'Transaction Date', 
            'Approved Amount', 'Expense Type', band_col, 'Avg_app_Amount', 'Variance%', 'Exception']
    _export_excel_with_context(final_df, out, "PJPA26_E1", "Category Variance (Same Band) > 20%", cols)

def run_E2_across_level_variance(concur, line, out):
    """Variance analysis across all bands for a specific location/expense."""
    df, band_col = _prepare_data(concur, line)
    
    keys = ["Expense Type", "To Location"]
    
    # Grouped Mean
    stats = df.groupby(keys)["Approved Amount"].agg(["sum", "count"]).reset_index()
    stats["Avg_app_Amount"] = stats["sum"] / stats["count"]
    df = df.merge(stats[keys + ["Avg_app_Amount"]], on=keys, how="left")
    
    # Variance Calculation
    df["Avg_app_Amount"] = df["Avg_app_Amount"].replace(0, 1)
    df["Variance%"] = ((df["Approved Amount"] - df["Avg_app_Amount"]) / df["Avg_app_Amount"]) * 100
    df["Exception"] = np.where(df["Variance%"] > 20, "Exception", "Normal")
    
    # Reference Row Filter (Context)
    df["Group_ID"] = df[keys[0]] + df[keys[1]]
    exc_groups = df[df["Exception"] == "Exception"]["Group_ID"].unique()
    final_df = df[df["Group_ID"].isin(exc_groups)].sort_values(["Group_ID", "Variance%"], ascending=[True, False])
    
    cols = ['Employee', 'Report Name', 'Report ID', 'Employee ID', 'To Location', 'Transaction Date', 
            'Approved Amount', 'Expense Type', band_col, 'Avg_app_Amount', 'Variance%', 'Exception']
    _export_excel_with_context(final_df, out, "PJPA26_E2", "Category Variance (Across Bands) > 20%", cols)