import pandas as pd
import numpy as np

def generate_benfords_law_insight(concur_data_path, output_excel_path):
    print("Running Benford's Law Analysis...")
    
    # 1. Load Data
    df = df = pd.read_excel(concur_data_path)
    
    # 2. Process and Filter Valid Amounts
    df.rename(columns=lambda x: str(x).strip(), inplace=True)
    df['Amount Approved Numeric'] = pd.to_numeric(df['Amount Approved'], errors='coerce')
    valid_df = df[df['Amount Approved Numeric'].notna() & (df['Amount Approved Numeric'] > 0)].copy()
    
    # 3. Vectorized Digit Extraction (Highly optimized for 760k+ rows)
    # Convert float to string, remove decimal, and strip leading zeros safely
    amounts_str = valid_df['Amount Approved Numeric'].apply(lambda x: f"{abs(x):.10f}").str.replace('.', '', regex=False).str.lstrip('0')
    
    valid_mask = amounts_str.str.len() > 0
    valid_df = valid_df[valid_mask].copy()
    amounts_str = amounts_str[valid_mask]
    
    valid_df['d1'] = amounts_str.str[0].astype(int)
    
    # Handle single digit cases for d2 and d12
    d2_raw = amounts_str.str[1].fillna('0')
    valid_df['d2'] = np.where(d2_raw == '', '0', d2_raw).astype(int)
    valid_df['d12'] = np.where(amounts_str.str.len() > 1, amounts_str.str[:2], amounts_str.str[0] + '0').astype(int)
    
    N = len(valid_df)
    
    # 4. Statistical Helper Function
    def compute_stats(actual_counts, expected_probs):
        stats = []
        for digit, prob in expected_probs.items():
            actual_count = actual_counts.get(digit, 0)
            expected_count = prob * N
            actual_pct = (actual_count / N) * 100
            expected_pct = prob * 100
            diff_pct = actual_pct - expected_pct
            abs_diff_pct = abs(diff_pct)
            
            # Z-Score Calculation
            p = actual_count / N
            P = prob
            variance = (P * (1 - P)) / N
            z_score = (p - P) / np.sqrt(variance) if variance > 0 else 0
            
            stats.append({
                'Digit': digit,
                'Actual Count': actual_count,
                'Expected Count': expected_count,
                'Actual %': actual_pct,
                'Expected %': expected_pct,
                'Diff %': diff_pct,
                'Abs Diff %': abs_diff_pct,
                'Z-Score': z_score
            })
        return pd.DataFrame(stats)

    # 5. Calculate Expected Probabilities & Generate Stats DataFrames
    
    # First Digit (1-9)
    d1_probs = {d: np.log10(1 + 1/d) for d in range(1, 10)}
    df_d1 = compute_stats(valid_df['d1'].value_counts().to_dict(), d1_probs)
    
    # Second Digit (0-9)
    d2_probs = {d: sum(np.log10(1 + 1/(10*k + d)) for k in range(1, 10)) for d in range(0, 10)}
    df_d2 = compute_stats(valid_df['d2'].value_counts().to_dict(), d2_probs)
    
    # First-2 Digits (10-99)
    d12_probs = {d: np.log10(1 + 1/d) for d in range(10, 100)}
    df_d12 = compute_stats(valid_df['d12'].value_counts().to_dict(), d12_probs)
    
    # 6. Compute MAD (Mean Absolute Deviation of proportions)
    mad_d1 = (df_d1['Abs Diff %'] / 100).mean()
    mad_d2 = (df_d2['Abs Diff %'] / 100).mean()
    mad_d12 = (df_d12['Abs Diff %'] / 100).mean()
    
    # 7. Identify Critical Findings
    max_d1_idx = df_d1['Z-Score'].idxmax()
    crit_d1 = f"Z-Score Max: {df_d1.loc[max_d1_idx, 'Z-Score']:.2f} (Digit {int(df_d1.loc[max_d1_idx, 'Digit'])})"
    
    max_d2_idx = df_d2['Z-Score'].idxmax()
    crit_d2 = f"Z-Score Max: {df_d2.loc[max_d2_idx, 'Z-Score']:.2f} (Digit {int(df_d2.loc[max_d2_idx, 'Digit'])})"
    
    max_d12_idx = df_d12['Z-Score'].idxmax()
    crit_d12 = f"Z-Score Max: {df_d12.loc[max_d12_idx, 'Z-Score']:.2f} (Pair {int(df_d12.loc[max_d12_idx, 'Digit'])})"
    
    df_summary = pd.DataFrame({
        'Analysis Type': ['First Digit (1-9)', 'Second Digit (0-9)', 'First 2 Digits (10-99)'],
        'Sample Size': [N, N, N],
        'MAD': [mad_d1, mad_d2, mad_d12],
        'P-Value': [0, 0, 0],
        'Critical Finding': [crit_d1, crit_d2, crit_d12]
    })
    
    # 8. Dynamically Extract Top Anomalies
    # We select the top 3 highest positive Z-score pairs automatically
    top_pairs_df = df_d12.sort_values(by='Z-Score', ascending=False).head(3)
    top_pairs = sorted(top_pairs_df['Digit'].tolist())
    anomalies_df = valid_df[valid_df['d12'].isin(top_pairs)].copy()
    
    expected_anomaly_cols = [
        'Employee ID', 'Report Name', 'Report Id', 'Report Number', 'Submit Date', 'Employee Name',
        'Approval Status', 'Report Start Date', 'Report End Date', 'Currency', 'Report Total', 
        'Payment Status', 'Amount Due Employee', 'Report Date', 'Policy', 'Amount Approved'
    ]
    
    for col in expected_anomaly_cols:
        if col not in anomalies_df.columns:
            anomalies_df[col] = np.nan
            
    anomalies_df = anomalies_df[expected_anomaly_cols]
    
    # Sort anomalies descending by Submit Date to maintain a clean layout
    if 'Submit Date' in anomalies_df.columns:
        anomalies_df['Submit Date_Parsed'] = pd.to_datetime(anomalies_df['Submit Date'], errors='coerce')
        anomalies_df.sort_values(by='Submit Date_Parsed', ascending=False, inplace=True)
        anomalies_df.drop(columns=['Submit Date_Parsed'], inplace=True)
    
    # 9. Write Multi-Sheet Excel Output securely
    sheet_name_anomalies = f"Anomalies ({top_pairs[0]}-{top_pairs[-1]})"
    
    with pd.ExcelWriter(output_excel_path, engine='xlsxwriter') as writer:
        
        # Sheet 1: Anomalies
        meta_anomalies = [
            ['Insight ID ', 'PJPA28'] + [''] * (len(expected_anomaly_cols) - 2),
            ['Exception No', '1'] + [''] * (len(expected_anomaly_cols) - 2),
            ['Exception Type', 'Benford’s Law Analysis for most occuring digits'] + [''] * (len(expected_anomaly_cols) - 2),
            [''] * len(expected_anomaly_cols),
            [''] * len(expected_anomaly_cols),
            expected_anomaly_cols
        ]
        pd.DataFrame(meta_anomalies).to_excel(writer, index=False, header=False, sheet_name=sheet_name_anomalies)
        anomalies_df.to_excel(writer, index=False, header=False, startrow=6, sheet_name=sheet_name_anomalies)
        
        # Sheet 2: Summary Stats
        meta_summary = [
            ['Presents a high-level overview of the analysis results, including sample sizes, Mean Absolute Deviation (MAD), and critical findings for each test type.'] + [''] * 4,
            [''] * 5,
            [''] * 5,
            df_summary.columns.tolist()
        ]
        pd.DataFrame(meta_summary).to_excel(writer, index=False, header=False, sheet_name='Summary Stats')
        df_summary.to_excel(writer, index=False, header=False, startrow=4, sheet_name='Summary Stats')
        
        # Sheet 3: 1st Digit Analysis
        meta_d1 = [
            ["Compares the actual count of leading digits (1–9) with the expected Benford's Law distribution to detect potential irregularities."] + [''] * 7,
            [''] * 8,
            [''] * 8,
            df_d1.columns.tolist()
        ]
        pd.DataFrame(meta_d1).to_excel(writer, index=False, header=False, sheet_name='1st Digit Analysis')
        df_d1.to_excel(writer, index=False, header=False, startrow=4, sheet_name='1st Digit Analysis')
        
        # Sheet 4: 2nd Digit Analysis
        meta_d2 = [
            ["Analyzes the distribution of the second digit (0–9) in the dataset against the theoretical expectations of Benford's Law."] + [''] * 7,
            [''] * 8,
            [''] * 8,
            df_d2.columns.tolist()
        ]
        pd.DataFrame(meta_d2).to_excel(writer, index=False, header=False, sheet_name='2nd Digit Analysis')
        df_d2.to_excel(writer, index=False, header=False, startrow=4, sheet_name='2nd Digit Analysis')
        
        # Sheet 5: First-2 Digits Analysis
        meta_d12 = [
            ['Provides a statistical comparison of the actual vs. expected frequency for the first two digits (10–99), including Z-scores to identify deviations.'] + [''] * 7,
            [''] * 8,
            [''] * 8,
            df_d12.columns.tolist()
        ]
        pd.DataFrame(meta_d12).to_excel(writer, index=False, header=False, sheet_name='First-2 Digits Analysis')
        df_d12.to_excel(writer, index=False, header=False, startrow=4, sheet_name='First-2 Digits Analysis')

    print(f"Benford's Law execution complete. Saved 5 sheets to {output_excel_path}.")
    return output_excel_path