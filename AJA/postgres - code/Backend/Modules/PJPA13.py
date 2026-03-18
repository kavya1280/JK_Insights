import pandas as pd
import numpy as np
import time
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

def generate_policy_validation_insight(concur_data_path, line_item_data_path, emp_master_path, output_excel_path):
    print("🚀 Running PJPA13: Company Policy Validation (Allowances & Mileage)...")

    print("📂 Reading Files...")
    claims_df = pd.read_excel(line_item_data_path) if line_item_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(line_item_data_path, encoding="latin1", low_memory=False)
    sap_df = pd.read_excel(concur_data_path) if concur_data_path.endswith(('.xls', '.xlsx')) else pd.read_csv(concur_data_path, encoding="latin1", low_memory=False)
    emp_df = pd.read_excel(emp_master_path) if emp_master_path.endswith(('.xls', '.xlsx')) else pd.read_csv(emp_master_path, encoding="latin1", low_memory=False)

    claims_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    sap_df.rename(columns=lambda x: str(x).strip(), inplace=True)
    emp_df.rename(columns=lambda x: str(x).strip(), inplace=True)

    c_id = 'Report Id' if 'Report Id' in claims_df.columns else 'Report ID'
    s_id = 'Report Id' if 'Report Id' in sap_df.columns else 'Report ID'
    
    claims_df['Employee ID'] = claims_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    sap_df['Employee ID'] = sap_df['Employee ID'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)
    claims_df['Report ID_Join'] = claims_df[c_id].astype(str).str.strip()
    sap_df['Report ID_Join'] = sap_df[s_id].astype(str).str.strip()
    
    emp_df['Personnel Number'] = emp_df['Personnel Number'].astype(str).str.strip().str.replace(r'\.0$', '', regex=True)

    sap_df["Report Start Date"] = pd.to_datetime(sap_df["Report Start Date"], errors="coerce")
    sap_df["Report End Date"] = pd.to_datetime(sap_df["Report End Date"], errors="coerce")

    merged_df = pd.merge(claims_df, sap_df[["Employee ID", "Report ID_Join", "Report Start Date", "Report End Date"]], 
                         left_on=["Employee ID", "Report ID_Join"], right_on=["Employee ID", "Report ID_Join"], how="inner")
    
    merged_df = merged_df.dropna(subset=["Report Start Date", "Report End Date"])
    merged_df["days_difference"] = (merged_df["Report End Date"] - merged_df["Report Start Date"]).dt.days + 1

    base_df = pd.merge(merged_df, emp_df[["Personnel Number", "Employee Location", "Gender"]], 
                       left_on="Employee ID", right_on="Personnel Number", how="left")
    base_df.rename(columns={"Employee Location": "From Location"}, inplace=True)
    base_df["Gender"] = base_df["Gender"].astype(str).str.upper().str.strip()

    # Dynamic Person Band 
    band_col = [c for c in base_df.columns if 'Person Band' in c]
    if band_col:
        base_df['Person Band'] = base_df[band_col[0]].astype(str).str.upper().str.strip()
    else:
        base_df['Person Band'] = "UNKNOWN"

    # --- FIX: DYNAMIC LOCATION COLUMN ---
    if 'To Location' not in base_df.columns and 'City/Location' in base_df.columns:
        base_df.rename(columns={'City/Location': 'To Location'}, inplace=True)
    if 'To Location' not in base_df.columns:
        base_df['To Location'] = 'UNKNOWN'

    grp = base_df.groupby("Report ID_Join", as_index=False).agg({"To Location": "first"}).rename(columns={"To Location": "First_To_Location"})
    base_df = pd.merge(base_df, grp, on="Report ID_Join", how="left")
    base_df["To Location"] = np.where(base_df["To Location"].isna(), base_df["First_To_Location"], base_df["To Location"])
    base_df["To Location Clean"] = base_df["To Location"].astype(str).str.upper().str.strip()

    metro_keywords = ["NEW DELHI","DELHI","MUMBAI","KOLKATA","CHENNAI","BENGALURU","BANGALORE","HYDERABAD","JAIPUR","LUCKNOW","PUNE","AHMEDABAD"]
    pattern = "|".join(metro_keywords)
    base_df["Metro/Non-Metro"] = np.where(base_df["To Location Clean"].str.contains(pattern, na=False), "Metro", "Non Metro")
    base_df['Approved Amount Numeric'] = pd.to_numeric(base_df['Approved Amount'], errors='coerce').fillna(0)
    base_df['Expense Type Clean'] = base_df['Expense Type'].astype(str).str.upper().str.strip()

    def _export_sheet(df, writer, insight_id, exception_no, exception_type, sheet_name):
        cols = df.columns.tolist()
        header_rows = [
            ['Insight ID ', insight_id] + [''] * max(0, len(cols) - 2),
            ['Exception No', exception_no] + [''] * max(0, len(cols) - 2),
            ['Exception Type', exception_type] + [''] * max(0, len(cols) - 2),
            [''] * max(2, len(cols)), [''] * max(2, len(cols)), cols
        ]
        pd.DataFrame(header_rows).to_excel(writer, index=False, header=False, sheet_name=sheet_name)
        df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name)

    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        
        e1_df = base_df[base_df["Expense Type Clean"].isin(["DAILY ALLOWANCE", "DAILY ALLOWANCE (INCIDENTALS)"])].copy()
        oop_limits = {"2A": 500, "2B": 500, "3A": 420, "3B": 420, "4A": 250, "4B": 250, "5A": 175, "5B": 175, "6A": 150, "6B": 150, "7A": 125, "7B": 125, "8A": 100}
        e1_df["Per Day OOP Limit"] = e1_df["Person Band"].map(oop_limits)
        e1_df["Allowed OOP Amount"] = e1_df["Per Day OOP Limit"] * e1_df["days_difference"]
        e1_df["Policy Exceeded"] = e1_df["Approved Amount Numeric"] > e1_df["Allowed OOP Amount"]
        e1_final = e1_df[e1_df["Policy Exceeded"] == True].drop_duplicates()
        _export_sheet(e1_final, writer, "PJPA13", "1", "Daily Allowance > Band Limit", "Daily_Allowance")

        e2_df = base_df[base_df["Expense Type Clean"].isin(["LODGING WITHOUT TAX/ GUEST HOUSE", "LODGING WITH TAX"])].copy()
        lodging_limits = {
            "3A": {"Metro": 10000, "Non Metro": 6000}, "3B": {"Metro": 9000, "Non Metro": 5000},
            "4A": {"Metro": 7500, "Non Metro": 4500}, "4B": {"Metro": 7500, "Non Metro": 4500},
            "5A": {"Metro": 6000, "Non Metro": 4000}, "5B": {"Metro": 6000, "Non Metro": 4000},
            "6A": {"Metro": 4500, "Non Metro": 3000}, "6B": {"Metro": 4500, "Non Metro": 3000},
            "7A": {"Metro": 3500, "Non Metro": 2700}, "7B": {"Metro": 3500, "Non Metro": 2700},
            "8A": {"Metro": 2800, "Non Metro": 2000}
        }
        
        def get_lodging_limit(row):
            if row["Person Band"] in ["2A", "2B"]: return np.nan
            if row["Person Band"] in lodging_limits:
                return lodging_limits[row["Person Band"]].get(row["Metro/Non-Metro"], np.nan)
            return np.nan

        e2_df["Per Day Limit"] = e2_df.apply(get_lodging_limit, axis=1)
        e2_df["Allowed Lodging Amount"] = e2_df["Per Day Limit"] * e2_df["days_difference"]
        e2_df["Multiplier"] = np.where(e2_df["Gender"] == "F", 1.25, 1)
        e2_df["Amount Limit"] = e2_df["Allowed Lodging Amount"] * e2_df["Multiplier"]
        e2_df["Policy Exceeded"] = e2_df["Approved Amount Numeric"] > e2_df["Amount Limit"]
        e2_final = e2_df[e2_df["Policy Exceeded"] == True].drop_duplicates()
        _export_sheet(e2_final, writer, "PJPA13", "2", "Lodging > Band Limit", "Lodging")

        mileage_df = base_df[base_df["Expense Type Clean"].isin(["PERSONAL CAR", "PERSONAL BIKE"])].copy()
        
        if not mileage_df.empty:
            mileage_df = mileage_df[~mileage_df["To Location Clean"].str.contains("OTHER- TO|OTHER- FROM", na=False)]
            mileage_df["Loc_From"] = mileage_df["From Location"].astype(str).str.replace(r"\s.*", "", regex=True).str.strip().str.upper()
            mileage_df["Loc_To"] = mileage_df["To Location"].astype(str).str.replace(r"\s.*", "", regex=True).str.strip().str.upper()
            mileage_df = mileage_df[(mileage_df["Loc_From"] != "NAN") & (mileage_df["Loc_To"] != "NAN")]

            unique_locations = pd.concat([mileage_df["Loc_From"], mileage_df["Loc_To"]]).unique()
            geolocator = Nominatim(user_agent="distance_calc")
            coords_cache = {}
            
            for loc in unique_locations:
                try:
                    location = geolocator.geocode(loc)
                    if location: coords_cache[loc] = (location.latitude, location.longitude)
                except: pass
                time.sleep(1)

            def get_distance(row):
                from_c = coords_cache.get(row["Loc_From"])
                to_c = coords_cache.get(row["Loc_To"])
                if from_c and to_c: return geodesic(from_c, to_c).km
                return np.nan

            mileage_df["Distance_KM"] = mileage_df.apply(get_distance, axis=1)
            mileage_df["Kilometer Amount"] = mileage_df["Distance_KM"] * 10
            
            e3_df = mileage_df[mileage_df["Expense Type Clean"] == "PERSONAL BIKE"].copy()
            e3_final = e3_df[e3_df["Approved Amount Numeric"] > e3_df["Kilometer Amount"]].drop_duplicates()
            
            e4_df = mileage_df[mileage_df["Expense Type Clean"] == "PERSONAL CAR"].copy()
            e4_final = e4_df[e4_df["Approved Amount Numeric"] > e4_df["Kilometer Amount"]].drop_duplicates()
        else:
            e3_final = pd.DataFrame(columns=base_df.columns.tolist() + ["Distance_KM", "Kilometer Amount"])
            e4_final = pd.DataFrame(columns=base_df.columns.tolist() + ["Distance_KM", "Kilometer Amount"])

        _export_sheet(e3_final, writer, "PJPA13", "3", "Personal Bike Claim > Distance Estimate", "Personal_Bike")
        _export_sheet(e4_final, writer, "PJPA13", "4", "Personal Car Claim > Distance Estimate", "Personal_Car")

    print(f"✅ PJPA13 Workflow Completed! Output saved to {output_excel_path}")