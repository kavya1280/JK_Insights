import pandas as pd


def generate_pjpa36_missing_days(
    input_excel_path,
    output_excel_path
):
    print("Running PJPA36 – Missing Days Analysis (Submit Date)...")

    # =====================================================
    # 1. Load data
    # =====================================================
    df = pd.read_excel(input_excel_path)
    df.rename(columns=lambda x: str(x).strip(), inplace=True)

    if 'Submit Date' not in df.columns:
        raise ValueError("Submit Date column not found.")

    # =====================================================
    # 2. Clean Submit Date (remove time after T)
    # =====================================================
    df['Submit Date'] = (
        df['Submit Date']
        .astype(str)
        .str.split('T')
        .str[0]
    )

    df['Submit Date'] = pd.to_datetime(
        df['Submit Date'], errors='coerce'
    ).dt.date

    df = df[df['Submit Date'].notna()].copy()

    # =====================================================
    # 3. Find min & max dates
    # =====================================================
    min_date = df['Submit Date'].min()
    max_date = df['Submit Date'].max()

    print(f"Date range: {min_date} → {max_date}")

    # =====================================================
    # 4. Generate full date range
    # =====================================================
    full_dates = pd.date_range(
        start=min_date,
        end=max_date,
        freq='D'
    ).date

    # =====================================================
    # 5. Find missing days
    # =====================================================
    present_dates = set(df['Submit Date'].unique())
    missing_dates = sorted(set(full_dates) - present_dates)

    if not missing_dates:
        print("No missing days found.")
        return None

    missing_df = pd.DataFrame({
        'Missing Submit Date': missing_dates
    })

    # =====================================================
    # 6. Metadata header
    # =====================================================
    header_rows = [
        ['Insight ID', 'PJPA36'],
        ['Exception No', '1'],
        ['Exception Type', 'EDA Check - Missing Submit Date (Date Gaps)'],
        [],
        [],
        ['Missing Submit Date']
    ]

    header_df = pd.DataFrame(header_rows)

    # =====================================================
    # 7. Write output
    # =====================================================
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        header_df.to_excel(
            writer,
            index=False,
            header=False,
            sheet_name='PJPA36'
        )
        missing_df.to_excel(
            writer,
            index=False,
            header=False,
            startrow=6,
            sheet_name='PJPA36'
        )

    print(f"PJPA36 complete. Missing days found: {len(missing_df)}")
    return output_excel_path


# =====================================================
# RUN
# =====================================================
if __name__ == "__main__":
    input_file = "Combined SAP Concor Data - Copy.xlsx"
    output_file = "PJPA36_Missing_Submit_Days.xlsx"

    generate_pjpa36_missing_days(
        input_excel_path=input_file,
        output_excel_path=output_file
    )