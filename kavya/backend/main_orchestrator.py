import os
from Modules.PJPA27 import generate_notice_period_insight_updated
# We will add more imports here as we build the other 13 scripts
# from Modules.insight_02 import generate_second_insight

def run_all_insights():
    print("Initializing Data Analytics Backend...")
    
    # 1. Define Master Data Paths centrally
    # Using relative paths so it works as long as you run it from Folder2
    data_dir = r"Data"
    output_dir = r"Output"
    
    concur_file = os.path.join(data_dir, "Combined SAP Concor Data.xlsx - Combined SAP Concor Data.csv")
    left_emp_file = os.path.join(data_dir, "Engagement Master Format - Audit (1) (2).xlsx - List of left employees.csv")
    
    # Ensure Output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # 2. Execute Insight 1: PJPA27 (Notice Period)
    try:
        print("\nRunning Insight 1: PJPA27 (Notice Period)...")
        output_1 = os.path.join(output_dir, "PJPA27_Notice_Period_Generated.xlsx")
        generate_notice_period_insight_updated(concur_file, left_emp_file, output_1)
        print("Insight 1 completed successfully.")
    except Exception as e:
        print(f"Error running Insight 1: {e}")

    # 3. Execute Insight 2 (Placeholder)
    # try:
    #     print("\nRunning Insight 2...")
    #     output_2 = os.path.join(output_dir, "Insight_02.xlsx")
    #     generate_second_insight(...)
    # except Exception as e:
    #     print(f"Error: {e}")

    print("\nAll backend processing finished!")

if __name__ == "__main__":
    run_all_insights()