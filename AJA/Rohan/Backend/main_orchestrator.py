import os

# New Modules
from Modules.PJPA10 import generate_junior_senior_insight
from Modules.PJPA13 import generate_policy_validation_insight
from Modules.PJPA14 import generate_duplicate_claims_insight
from Modules.PJPA16 import generate_duplicate_employee_insight
from Modules.PJPA18 import generate_multiple_submits_insight
from Modules.PJPA19 import generate_multiple_travel_modes_insight
from Modules.PJPA20 import generate_odd_time_submission_insight
from Modules.PJPA21 import generate_overlapping_travel_dates_insight
from Modules.PJPA22 import generate_cross_employee_duplicate_insight
from Modules.PJPA23 import generate_submit_before_start_insight

# Existing Modules
from Modules.PJPA24 import generate_zscore_insights
import Modules.PJPA26 as PJPA26
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
    
    # Master File Paths
    concur_file = os.path.join(data_dir, "Concur_Header_Data.xlsx")
    left_emp_file = os.path.join(data_dir, "Left_Employees.xlsx")
    emp_master_file = os.path.join(data_dir, "Employee_Master.xlsx")
    line_item_file = os.path.join(data_dir, "Line_Item_Data.xlsx")
    
    # ==========================================
    # NEW MODULES (PJPA10 - PJPA23)
    # ==========================================
    if "PJPA10" in selected_insights:
        try:
            out_10 = os.path.join(output_dir, "PJPA10_Generated.xlsx")
            generate_junior_senior_insight(concur_file, line_item_file, emp_master_file, out_10)
        except Exception as e: print(f"Error PJPA10: {e}")

    if "PJPA13" in selected_insights:
        try:
            out_13 = os.path.join(output_dir, "PJPA13_Generated.xlsx")
            generate_policy_validation_insight(concur_file, line_item_file, emp_master_file, out_13)
        except Exception as e: print(f"Error PJPA13: {e}")

    if "PJPA14" in selected_insights:
        try:
            out_14 = os.path.join(output_dir, "PJPA14_Generated.xlsx")
            generate_duplicate_claims_insight(line_item_file, out_14)
        except Exception as e: print(f"Error PJPA14: {e}")

    if "PJPA16" in selected_insights:
        try:
            out_16 = os.path.join(output_dir, "PJPA16_Generated.xlsx")
            generate_duplicate_employee_insight(emp_master_file, out_16)
        except Exception as e: print(f"Error PJPA16: {e}")

    if "PJPA18" in selected_insights:
        try:
            out_18 = os.path.join(output_dir, "PJPA18_Generated.xlsx")
            generate_multiple_submits_insight(concur_file, line_item_file, out_18)
        except Exception as e: print(f"Error PJPA18: {e}")

    if "PJPA19" in selected_insights:
        try:
            out_19 = os.path.join(output_dir, "PJPA19_Generated.xlsx")
            generate_multiple_travel_modes_insight(line_item_file, out_19) # Only pass line_item_file
        except Exception as e: print(f"Error PJPA19: {e}")

    if "PJPA20" in selected_insights:
        try:
            out_20 = os.path.join(output_dir, "PJPA20_Generated.xlsx")
            generate_odd_time_submission_insight(concur_file, out_20)
        except Exception as e: print(f"Error PJPA20: {e}")

    if "PJPA21" in selected_insights:
        try:
            out_21 = os.path.join(output_dir, "PJPA21_Generated.xlsx")
            generate_overlapping_travel_dates_insight(concur_file, out_21)
        except Exception as e: print(f"Error PJPA21: {e}")

    if "PJPA22" in selected_insights:
        try:
            out_22 = os.path.join(output_dir, "PJPA22_Generated.xlsx")
            generate_cross_employee_duplicate_insight(line_item_file, out_22)
        except Exception as e: print(f"Error PJPA22: {e}")

    if "PJPA23" in selected_insights:
        try:
            out_23 = os.path.join(output_dir, "PJPA23_Generated.xlsx")
            generate_submit_before_start_insight(concur_file, out_23)
        except Exception as e: print(f"Error PJPA23: {e}")

    if "PJPA24" in selected_insights:
        try:
            out_24 = os.path.join(output_dir, "PJPA24_Generated.xlsx")
            generate_zscore_insights(concur_file, line_item_file, out_24)
        except Exception as e: print(f"Error PJPA24: {e}")

    # ==========================================
    # EXISTING MODULES (PJPA27 - PJPA40)
    # ==========================================
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

    if "PJPA32" in selected_insights:
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
            generate_active_with_sep_date_insight(emp_master_file, out_39)
        except Exception as e: print(f"Error PJPA39: {e}")
        
    if "PJPA40" in selected_insights:
        try:
            out_40 = os.path.join(output_dir, "PJPA40_Generated.xlsx")
            generate_transaction_date_anomaly_insight(concur_file, line_item_file, out_40)
        except Exception as e: print(f"Error PJPA40: {e}")

    print("\nSelected backend processing finished successfully!")