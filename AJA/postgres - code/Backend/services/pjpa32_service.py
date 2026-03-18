import pandas as pd
import json

def apply_filters(df, filters):
    """
    Applies categorical filters to the dataframe.
    """
    if df is None or df.empty:
        return df
    
    # Mapping request args to df columns
    # Frontend keys: employee_id, employee, report_id, expense_type
    if filters.get('employee_id'):
        df = df[df['Employee ID'].astype(str) == str(filters['employee_id'])]
    if filters.get('employee'):
        df = df[df['Employee Name'] == filters['employee']]
    if filters.get('report_id'):
        df = df[df['Report ID'].astype(str) == str(filters['report_id'])]
    if filters.get('expense_type'):
        df = df[df['Expense Type'] == filters['expense_type']]
    
    # Location filter if provided
    if filters.get('location'):
        loc_col = "City/Location" if "City/Location" in df.columns else ("Location" if "Location" in df.columns else None)
        if loc_col:
            df = df[df[loc_col] == filters['location']]
            
    # Date range filter
    if filters.get('startDate') or filters.get('endDate'):
        if 'Transaction Date' in df.columns:
            df['Transaction Date'] = pd.to_datetime(df['Transaction Date'], errors='coerce')
            if filters.get('startDate'):
                df = df[df['Transaction Date'] >= pd.to_datetime(filters['startDate'])]
            if filters.get('endDate'):
                df = df[df['Transaction Date'] <= pd.to_datetime(filters['endDate'])]
            
    return df

def apply_search(df, search_term):
    """
    Applies global search across all columns.
    """
    if df is None or df.empty or not search_term:
        return df
    
    search_term = str(search_term).lower()
    mask = df.astype(str).apply(lambda x: x.str.lower().str.contains(search_term)).any(axis=1)
    return df[mask]


def get_kpis(df):
    """
    Calculates KPIs for PJPA32 dashboard.
    """
    if df is None or df.empty:
        return {
            "total_cases": 0,
            "total_amount": 0,
            "weekend_count": 0,
            "unique_employees": 0
        }
    
    amount_col = "Amount Approved" if "Amount Approved" in df.columns else None
    emp_col = "Employee ID" if "Employee ID" in df.columns else None
    report_col = "Report ID" if "Report ID" in df.columns else None
    expense_col = "Expense Type" if "Expense Type" in df.columns else None
    
    # --- Amount Cleaning for robust calculations ---
    def clean_amount(val):
        if pd.isna(val) or val == '': return 0
        s = str(val).replace('₹', '').replace(',', '').strip()
        try:
            return float(s)
        except:
            return 0

    if amount_col:
        df[amount_col] = df[amount_col].apply(clean_amount)
        
    # --- USER REQUEST: Only consider values above 6000 ---
    if amount_col:
        df = df[df[amount_col] > 6000].copy()
        
    total_amount = float(df[amount_col].sum()) if amount_col else 0
    unique_employees = int(df[emp_col].nunique()) if emp_col else 0
    
    return {
        "distinct_employee_id": unique_employees,
        "distinct_employee": unique_employees,
        "distinct_report_id": int(df[report_col].nunique()) if report_col else 0,
        "distinct_expense_type": int(df[expense_col].nunique()) if expense_col else 0,
        "total_approved_amount": total_amount,
        "avg_spend_per_person": total_amount / unique_employees if unique_employees > 0 else 0
    }

def get_filters(df):
    """
    Extracts unique filter values.
    """
    if df is None or df.empty:
        return {
            "employees": [],
            "expense_types": [],
            "locations": [],
            "date_range": {"min": None, "max": None}
        }
    
    # Clean and filter here too for consistency
    def clean_amount(val):
        if pd.isna(val) or val == '': return 0
        s = str(val).replace('₹', '').replace(',', '').strip()
        try:
            return float(s)
        except:
            return 0
    
    amount_col = "Amount Approved" if "Amount Approved" in df.columns else None
    if amount_col:
        df[amount_col] = df[amount_col].apply(clean_amount)
        df = df[df[amount_col] > 6000].copy()

    loc_col = "City/Location" if "City/Location" in df.columns else ("Location" if "Location" in df.columns else None)
    
    filters = {
        "employee_ids": sorted([str(x) for x in df["Employee ID"].dropna().unique().tolist()]) if "Employee ID" in df.columns else [],
        "employees": sorted([str(x) for x in df["Employee Name"].dropna().unique().tolist()]) if "Employee Name" in df.columns else [],
        "report_ids": sorted([str(x) for x in df["Report ID"].dropna().unique().tolist()]) if "Report ID" in df.columns else [],
        "expense_types": sorted([str(x) for x in df["Expense Type"].dropna().unique().tolist()]) if "Expense Type" in df.columns else [],
        "locations": sorted([str(x) for x in df[loc_col].dropna().unique().tolist()]) if loc_col else []
    }

    
    if "Transaction Date" in df.columns:
        valid_dates = pd.to_datetime(df["Transaction Date"], errors='coerce').dropna()
        if not valid_dates.empty:
             filters["date_range"] = {
                "min": valid_dates.min().strftime('%Y-%m-%d'),
                "max": valid_dates.max().strftime('%Y-%m-%d')
            }
            
    return filters

def get_chart_data(df):
    """
    Prepares structured JSON for charts.
    """
    if df is None or df.empty:
        return {
            "amount_per_employee": [],
            "billing_per_customer": [],
            "amount_by_weekend": [],
            "amount_by_location": [],
            "amount_by_expense_type": []
        }
    
    amount_col = "Amount Approved" if "Amount Approved" in df.columns else None
    
    # Clean and filter here too for consistency
    def clean_amount(val):
        if pd.isna(val) or val == '': return 0
        s = str(val).replace('₹', '').replace(',', '').strip()
        try:
            return float(s)
        except:
            return 0
            
    if amount_col:
        df[amount_col] = df[amount_col].apply(clean_amount)
        df = df[df[amount_col] > 6000].copy()
    
    # 1. Amount Approved per Employee
    emp_data = []
    if "Employee Name" in df.columns and amount_col:
        emp_group = df.groupby("Employee Name")[amount_col].sum().reset_index()
        emp_group = emp_group.rename(columns={"Employee Name": "employee", amount_col: "amount"})
        emp_data = emp_group.sort_values(by="amount", ascending=False).head(15).to_dict(orient="records")
    
    # 2. Amount Approved by Weekend (Column Chart)
    # x-axis: day of week (Saturday, Sunday), y-axis: approved amount
    wk_data_list = []
    wk_col = "Day of Week (Name)" if "Day of Week (Name)" in df.columns else "Weekend"
    if wk_col in df.columns and amount_col:
        if wk_col == "Weekend":
            # Map boolean to names
            wk_group = df.groupby("Weekend")[amount_col].sum().reset_index()
            wk_group["weekday"] = wk_group["Weekend"].map({True: "Saturday", False: "Monday"})
            wk_group = wk_group[wk_group["Weekend"] == True] # Only weekends as requested
        else:
            wk_group = df.groupby("Day of Week (Name)")[amount_col].sum().reset_index()
            wk_group = wk_group.rename(columns={"Day of Week (Name)": "weekday"})
            # Filter for Saturday/Sunday
            wk_group = wk_group[wk_group["weekday"].isin(['Saturday', 'Sunday'])]
            
        wk_group = wk_group.rename(columns={amount_col: "amount"})
        wk_data_list = wk_group[["weekday", "amount"]].to_dict(orient="records")
    
    # 3. Amount by Location (Map Chart)
    loc_data = []
    loc_col = "City/Location" if "City/Location" in df.columns else ("Location" if "Location" in df.columns else None)
    if loc_col and amount_col:
        loc_group = df.groupby(loc_col)[amount_col].sum().reset_index()
        loc_group = loc_group.rename(columns={loc_col: "city", amount_col: "amount"})
        CITY_COORDS = {
            'Mumbai': [72.8777, 19.0760], 'Delhi': [77.2090, 28.6139], 'Chennai': [80.2707, 13.0827],
            'Bangalore': [77.5946, 12.9716], 'Hyderabad': [78.4867, 17.3850], 'Kolkata': [88.3639, 22.5726]
        }
        res = []
        for d in loc_group.to_dict(orient="records"):
            coords = CITY_COORDS.get(d['city'], [78.9629, 20.5937]) # Default to center of India
            res.append({**d, "lon": coords[0], "lat": coords[1]})
        loc_data = sorted(res, key=lambda x: x['amount'], reverse=True)
    
    # 4. Amount Distribution Across Expense Type (Donut Chart)
    exp_dist = []
    if "Expense Type" in df.columns and amount_col:
        exp_group = df.groupby("Expense Type")[amount_col].sum().reset_index()
        exp_group = exp_group.rename(columns={"Expense Type": "name", amount_col: "value"})
        exp_dist = exp_group.sort_values(by="value", ascending=False).to_dict(orient="records")

    # 5. Holiday Claims by Holiday Name (Column Chart)
    # x-axis: holiday name, y-axis: claim count
    holiday_data = []
    if "Holiday Name" in df.columns:
        grp = df.groupby("Holiday Name").size().reset_index(name='count')
        holiday_data = [{"holiday": str(r['Holiday Name']), "count": int(r['count'])} for _, r in grp.iterrows()]

    # 6. Holiday Claim Amount by Employee Band (Column Chart)
    # x-axis: person band before PMS, y-axis: approved amount
    band_data = []
    band_col = "Person Band before PMS"
    if band_col in df.columns and amount_col:
        grp = df.groupby(band_col)[amount_col].sum().reset_index()
        band_data = [{"band": str(r[band_col]), "amount": float(r[amount_col])} for _, r in grp.iterrows()]

    return {
        "kpis": get_kpis(df),
        "employee_data": emp_data,
        "weekend_data": wk_data_list,
        "location_data": loc_data,
        "expense_distribution": exp_dist,
        "holiday_claims": holiday_data,
        "band_claims": band_data
    }

