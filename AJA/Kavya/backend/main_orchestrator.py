import os

from Modules.PJPA27 import generate_notice_period_insight_updated
from Modules.PJPA28 import generate_benfords_law_insight
from Modules.PJPA29 import generate_new_joiner_insight
from Modules.PJPA30 import generate_short_trip_abuse_insight
from Modules.PJPA31 import generate_structural_splitting_insight
from Modules.PJPA32 import generate_holiday_weekend_travel_insight
from Modules.PJPA33 import generate_bulk_booker_insight
from Modules.PJPA34 import generate_low_value_claims_insight
from Modules.PJPA35 import generate_duplicate_report_id_insight
from Modules.PJPA36 import generate_pjpa36_missing_days
from Modules.PJPA38 import generate_odd_travels_insight
from Modules.PJPA39 import generate_active_with_sep_date_insight
from Modules.PJPA40 import generate_transaction_date_anomaly_insight

def run_selected_insights(selected_insights):
    print(f"Initializing Backend for specific modules: {selected_insights}")
    
    data_dir = r"Data"
    output_dir = r"Output"
    os.makedirs(output_dir, exist_ok=True)
    
    # We simplified the filenames so Pandas always knows they are Excel files!
    concur_file = os.path.join(data_dir, "Concur_Header_Data.xlsx")
    left_emp_file = os.path.join(data_dir, "Left_Employees.xlsx")
    emp_master_file = os.path.join(data_dir, "Employee_Master.xlsx")
    line_item_file = os.path.join(data_dir, "Line_Item_Data.xlsx")

    if "PJPA27" in selected_insights:
        try:
            out_27 = os.path.join(output_dir, "PJPA27_Generated.xlsx")
            generate_notice_period_insight_updated(concur_file, left_emp_file, out_27)
        except Exception as e: print(f"Error PJPA27: {e}")

    if "PJPA28" in selected_insights:
        try:
            out_28 = os.path.join(output_dir, "PJPA28_Generated.xlsx")
            generate_benfords_law_insight(concur_file, out_28)
        except Exception as e: print(f"Error PJPA28: {e}")

    if "PJPA29" in selected_insights:
        try:
            out_29 = os.path.join(output_dir, "PJPA29_Generated.xlsx")
            generate_new_joiner_insight(concur_file, emp_master_file, out_29)
        except Exception as e: print(f"Error PJPA29: {e}")

    if "PJPA30" in selected_insights:
        try:
            out_30 = os.path.join(output_dir, "PJPA30_Generated.xlsx")
            generate_short_trip_abuse_insight(concur_file, out_30)
        except Exception as e: print(f"Error PJPA30: {e}")

    if "PJPA31" in selected_insights:
        try:
            out_31 = os.path.join(output_dir, "PJPA31_Generated.xlsx")
            generate_structural_splitting_insight(concur_file, line_item_file, out_31)
        except Exception as e: print(f"Error PJPA31: {e}")

    # UI treats Holiday and Weekend as separate toggles, but they run from the same file
    if "PJPA32_HOL" in selected_insights or "PJPA32_WE" in selected_insights:
        try:
            out_32_hol = os.path.join(output_dir, "PJPA32_Holiday_Generated.xlsx")
            out_32_week = os.path.join(output_dir, "PJPA32_Weekend_Generated.xlsx")
            generate_holiday_weekend_travel_insight(line_item_file, out_32_hol, out_32_week)
        except Exception as e: print(f"Error PJPA32: {e}")

    if "PJPA33" in selected_insights:
        try:
            out_33 = os.path.join(output_dir, "PJPA33_Generated.xlsx")
            generate_bulk_booker_insight(concur_file, out_33, bulk_threshold=6)
        except Exception as e: print(f"Error PJPA33: {e}")

    if "PJPA34" in selected_insights:
        try:
            out_34 = os.path.join(output_dir, "PJPA34_Generated.xlsx")
            generate_low_value_claims_insight(concur_file, out_34, amount_threshold=1000, freq_threshold=10)
        except Exception as e: print(f"Error PJPA34: {e}")

    if "PJPA35" in selected_insights:
        try:
            out_35 = os.path.join(output_dir, "PJPA35_Generated.xlsx")
            generate_duplicate_report_id_insight(concur_file, out_35)
        except Exception as e: print(f"Error PJPA35: {e}")
    if "PJPA36" in selected_insights:
        try:
            out_36 = os.path.join(output_dir, "PJPA36_Generated.xlsx")
            generate_pjpa36_missing_days(concur_file, out_36)
        except Exception as e: print(f"Error PJPA36: {e}")
    
    if "PJPA38" in selected_insights:
        try:
            out_38 = os.path.join(output_dir, "PJPA38_Generated.xlsx")
            generate_odd_travels_insight(line_item_file, out_38, rare_threshold_pct=5)
        except Exception as e: print(f"Error PJPA38: {e}")
        
    if "PJPA39" in selected_insights:
        try:
            out_39 = os.path.join(output_dir, "PJPA39_Generated.xlsx")
            # Notice this one ONLY requires the Employee Master file!
            generate_active_with_sep_date_insight(emp_master_file, out_39)
        except Exception as e: print(f"Error PJPA39: {e}")
        
    if "PJPA40" in selected_insights:
        try:
            out_40 = os.path.join(output_dir, "PJPA40_Generated.xlsx")
            generate_transaction_date_anomaly_insight(concur_file, line_item_file, out_40)
        except Exception as e: print(f"Error PJPA40: {e}")

    print("\nSelected backend processing finished successfully!")