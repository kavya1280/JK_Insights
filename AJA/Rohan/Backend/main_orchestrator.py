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

def run_all_insights():
    print("Initializing Data Analytics Backend...")
    
    data_dir = r"Data"
    output_dir = r"Output"
    os.makedirs(output_dir, exist_ok=True)
    
    # Define file paths based on the EXPECTED_FILENAMES in app.py
    concur_file = os.path.join(data_dir, "Combined SAP Concor Data.xlsx - Combined SAP Concor Data.csv")
    left_emp_file = os.path.join(data_dir, "Engagement Master Format - Audit (1) (2).xlsx - List of left employees.csv")
    emp_master_file = os.path.join(data_dir, "Employee Master_ZEMPMASTER_2Feb2026.xlsx - Sheet1.csv")
    line_item_file = os.path.join(data_dir, "Combined all car and bike expenses - Limited.xlsx - Sheet1.csv")

    try:
        out_27 = os.path.join(output_dir, "PJPA27_Generated.xlsx")
        generate_notice_period_insight_updated(concur_file, left_emp_file, out_27)
    except Exception as e: print(f"Error PJPA27: {e}")

    try:
        out_28 = os.path.join(output_dir, "PJPA28_Generated.xlsx")
        generate_benfords_law_insight(concur_file, out_28)
    except Exception as e: print(f"Error PJPA28: {e}")

    try:
        out_29 = os.path.join(output_dir, "PJPA29_Generated.xlsx")
        generate_new_joiner_insight(concur_file, emp_master_file, out_29)
    except Exception as e: print(f"Error PJPA29: {e}")

    try:
        out_30 = os.path.join(output_dir, "PJPA30_Generated.xlsx")
        generate_short_trip_abuse_insight(concur_file, out_30)
    except Exception as e: print(f"Error PJPA30: {e}")

    try:
        out_31 = os.path.join(output_dir, "PJPA31_Generated.xlsx")
        generate_structural_splitting_insight(concur_file, line_item_file, out_31)
    except Exception as e: print(f"Error PJPA31: {e}")

    try:
        out_32_hol = os.path.join(output_dir, "PJPA32_Holiday_Generated.xlsx")
        out_32_week = os.path.join(output_dir, "PJPA32_Weekend_Generated.xlsx")
        generate_holiday_weekend_travel_insight(line_item_file, out_32_hol, out_32_week)
    except Exception as e: print(f"Error PJPA32: {e}")

    try:
        out_33 = os.path.join(output_dir, "PJPA33_Generated.xlsx")
        generate_bulk_booker_insight(concur_file, out_33, bulk_threshold=6)
    except Exception as e: print(f"Error PJPA33: {e}")

    try:
        out_34 = os.path.join(output_dir, "PJPA34_Generated.xlsx")
        generate_low_value_claims_insight(concur_file, out_34, amount_threshold=1000, freq_threshold=10)
    except Exception as e: print(f"Error PJPA34: {e}")

    try:
        out_35 = os.path.join(output_dir, "PJPA35_Generated.xlsx")
        generate_duplicate_report_id_insight(concur_file, out_35)
    except Exception as e: print(f"Error PJPA35: {e}")

    print("\nAll backend processing finished successfully!")

if __name__ == "__main__":
    run_all_insights()