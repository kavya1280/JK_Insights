import pandas as pd
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION
# ============================================

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA40_Generated.xlsx"
SKIP_ROWS = 4

# Required columns for PJPA40
REQUIRED_COLUMNS = [
    'Employee', 'Report Name', 'Expense Type', 'Report ID',
    'Approval Status', 'Payment Status', 'Report Date',
    'Transaction Date', 'Total Approved Amount', 'Payment Type',
    'Approved Amount', 'Employee ID', 'Report Number',
    'Submit Date', 'Report Start Date', 'Report End Date',
    'Currency', 'Report Total', 'Amount Due Employee', 'Policy',
    'Amount Approved'
]

# Date columns that need parsing
DATE_COLUMNS = [
    'Report Date', 'Transaction Date', 'Submit Date',
    'Report Start Date', 'Report End Date'
]

# Numeric columns that need cleaning
NUMERIC_COLUMNS = [
    'Amount Approved', 'Total Approved Amount',
    'Report Total', 'Amount Due Employee'
]

# ============================================
# DATA LOADING FUNCTIONS
# ============================================

def _load_data() -> Optional[pd.DataFrame]:
    """
    Load data from Excel file with proper cleaning
    
    Returns:
        DataFrame or None if file not found
    """
    try:
        file_path = os.path.join(OUTPUT_DIR, FILE_NAME)
        
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None
        
        logger.info(f"Loading data from: {file_path}")
        
        # Read Excel file
        df = pd.read_excel(file_path, skiprows=SKIP_ROWS)
        
        # Clean column names
        df.columns = df.columns.astype(str).str.strip()
        
        # Log available columns
        logger.info(f"Available columns: {list(df.columns)}")
        
        # Check for required columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns: {missing_cols}")
        
        # Clean numeric columns
        df = _clean_numeric_columns(df)
        
        # Parse date columns
        df = _parse_date_columns(df)
        
        # Remove duplicates
        initial_count = len(df)
        df = df.drop_duplicates()
        if initial_count > len(df):
            logger.info(f"Removed {initial_count - len(df)} duplicate rows")
        
        logger.info(f"Successfully loaded {len(df)} rows")
        return df
        
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        return None

def _clean_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean numeric columns by removing currency symbols and commas
    
    Args:
        df: Input DataFrame
        
    Returns:
        DataFrame with cleaned numeric columns
    """
    def clean_amount(val):
        if pd.isna(val) or val == '':
            return 0.0
        
        try:
            # If already numeric, return as float
            if isinstance(val, (int, float)):
                return float(val)
            
            # Convert to string and clean
            s = str(val)
            # Remove currency symbols and commas
            s = s.replace('₹', '').replace('$', '').replace('€', '').replace(',', '').strip()
            
            # Handle negative numbers
            if '(' in s and ')' in s:
                s = '-' + s.replace('(', '').replace(')', '')
            
            return float(s) if s else 0.0
            
        except (ValueError, TypeError):
            logger.warning(f"Could not convert value to float: {val}")
            return 0.0
    
    # Apply cleaning to numeric columns
    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            df[col] = df[col].apply(clean_amount)
    
    return df

def _parse_date_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Parse date columns to datetime
    
    Args:
        df: Input DataFrame
        
    Returns:
        DataFrame with parsed date columns
    """
    for col in DATE_COLUMNS:
        if col in df.columns:
            # Try multiple date formats
            df[col] = pd.to_datetime(df[col], errors='coerce', dayfirst=True)
            
            # Log parsing issues
            null_count = df[col].isna().sum()
            if null_count > 0:
                logger.warning(f"Could not parse {null_count} values in column: {col}")
    
    return df

# ============================================
# FILTERING FUNCTIONS
# ============================================

def apply_filters(df: Optional[pd.DataFrame], params: Dict[str, Any]) -> Optional[pd.DataFrame]:
    """
    Apply filters to dataframe
    
    Args:
        df: Input DataFrame
        params: Dictionary of filter parameters
        
    Returns:
        Filtered DataFrame
    """
    if df is None or df.empty:
        return df
    
    filtered_df = df.copy()
    initial_count = len(filtered_df)
    
    try:
        # Apply each filter if column exists
        if params.get('employee_id') and 'Employee ID' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Employee ID'].astype(str) == str(params['employee_id'])]
        
        if params.get('policy') and 'Policy' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Policy'].astype(str) == str(params['policy'])]
        
        if params.get('expense_type') and 'Expense Type' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Expense Type'].astype(str) == str(params['expense_type'])]
        
        if params.get('report_id') and 'Report ID' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Report ID'].astype(str) == str(params['report_id'])]
        
        # Apply search filter if provided
        if params.get('search'):
            filtered_df = _apply_search_filter(filtered_df, params['search'])
        
        # Log filtering results
        if initial_count > len(filtered_df):
            logger.info(f"Filters applied: {initial_count} -> {len(filtered_df)} rows")
        
        return filtered_df
        
    except Exception as e:
        logger.error(f"Error applying filters: {str(e)}")
        return df

def _apply_search_filter(df: pd.DataFrame, search_term: str) -> pd.DataFrame:
    """
    Apply search filter across relevant columns
    
    Args:
        df: Input DataFrame
        search_term: Search term
        
    Returns:
        Filtered DataFrame
    """
    if not search_term:
        return df
    
    search_term = str(search_term).lower()
    
    # Columns to search in
    search_cols = ['Employee', 'Report Name', 'Expense Type', 'Report ID', 'Policy']
    existing_cols = [col for col in search_cols if col in df.columns]
    
    if not existing_cols:
        return df
    
    # Create mask for rows containing search term
    mask = pd.Series(False, index=df.index)
    
    for col in existing_cols:
        # Convert to string and check for search term
        col_mask = df[col].astype(str).str.lower().str.contains(search_term, na=False)
        mask = mask | col_mask
    
    return df[mask]

# ============================================
# KPI FUNCTIONS
# ============================================

def get_kpis(df: Optional[pd.DataFrame]) -> Dict[str, Any]:
    """
    Calculate KPI values from dataframe
    
    Args:
        df: Input DataFrame
        
    Returns:
        Dictionary of KPI values
    """
    if df is None or df.empty:
        return {
            "distinct_employee": 0,
            "count_transactions": 0,
            "distinct_expense_type": 0,
            "distinct_policy": 0,
            "total_amount": 0
        }
    
    try:
        # Distinct Employees
        if 'Employee' in df.columns:
            distinct_employee = int(df['Employee'].nunique())
        elif 'Employee ID' in df.columns:
            distinct_employee = int(df['Employee ID'].nunique())
        else:
            distinct_employee = 0
        
        # Transaction Count (using Report ID)
        if 'Report ID' in df.columns:
            count_transactions = int(df['Report ID'].nunique())
        else:
            count_transactions = len(df)
        
        # Distinct Expense Types
        if 'Expense Type' in df.columns:
            distinct_expense_type = int(df['Expense Type'].nunique())
        else:
            distinct_expense_type = 0
        
        # Distinct Policies
        if 'Policy' in df.columns:
            distinct_policy = int(df['Policy'].nunique())
        else:
            distinct_policy = 0
        
        # Total Amount (prefer Amount Approved, fallback to Total Approved Amount)
        if 'Amount Approved' in df.columns:
            total_amount = float(df['Amount Approved'].sum())
        elif 'Total Approved Amount' in df.columns:
            total_amount = float(df['Total Approved Amount'].sum())
        else:
            total_amount = 0
        
        return {
            "distinct_employee": distinct_employee,
            "count_transactions": count_transactions,
            "distinct_expense_type": distinct_expense_type,
            "distinct_policy": distinct_policy,
            "total_amount": round(total_amount, 2)
        }
        
    except Exception as e:
        logger.error(f"Error calculating KPIs: {str(e)}")
        return {
            "distinct_employee": 0,
            "count_transactions": 0,
            "distinct_expense_type": 0,
            "distinct_policy": 0,
            "total_amount": 0
        }

# ============================================
# FILTER OPTIONS FUNCTIONS
# ============================================

def get_filters(df: Optional[pd.DataFrame]) -> Dict[str, List[str]]:
    """
    Get unique values for filter dropdowns
    
    Args:
        df: Input DataFrame
        
    Returns:
        Dictionary of filter options
    """
    if df is None or df.empty:
        return {
            "employee_ids": [],
            "policies": [],
            "expense_types": [],
            "report_ids": []
        }
    
    def safe_unique(column_name: str) -> List[str]:
        """Safely get unique values from a column"""
        if column_name in df.columns:
            # Drop NA, convert to string, remove 'nan' and 'N/A', sort
            unique_vals = df[column_name].dropna().unique()
            unique_vals = [str(x) for x in unique_vals if str(x) not in ['nan', 'N/A', '']]
            return sorted(unique_vals)
        return []
    
    try:
        return {
            "employee_ids": safe_unique('Employee ID'),
            "policies": safe_unique('Policy'),
            "expense_types": safe_unique('Expense Type'),
            "report_ids": safe_unique('Report ID')
        }
    except Exception as e:
        logger.error(f"Error getting filter options: {str(e)}")
        return {
            "employee_ids": [],
            "policies": [],
            "expense_types": [],
            "report_ids": []
        }

# ============================================
# CHART DATA FUNCTIONS
# ============================================

def get_chart_data(df: Optional[pd.DataFrame]) -> Dict[str, List[Dict]]:
    """
    Generate chart data from dataframe
    
    Args:
        df: Input DataFrame
        
    Returns:
        Dictionary of chart data
    """
    if df is None or df.empty:
        return {
            "amount_approved_employee": [],
            "vendor_amount": [],
            "amount_distribution_policy": [],
            "amount_transaction_date": []
        }
    
    try:
        return {
            "amount_approved_employee": _get_amount_by_employee(df),
            "vendor_amount": _get_vendor_amount(df),
            "amount_distribution_policy": _get_amount_by_policy(df),
            "amount_transaction_date": _get_amount_by_date(df)
        }
    except Exception as e:
        logger.error(f"Error generating chart data: {str(e)}")
        return {
            "amount_approved_employee": [],
            "vendor_amount": [],
            "amount_distribution_policy": [],
            "amount_transaction_date": []
        }

def _get_amount_by_employee(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 1: Amount Approved by Employee (Horizontal Bar Chart)
    """
    if 'Employee' not in df.columns:
        return []
    
    amount_col = 'Amount Approved' if 'Amount Approved' in df.columns else 'Total Approved Amount'
    if amount_col not in df.columns:
        return []
    
    try:
        # Group by employee and sum amounts
        grouped = df.groupby('Employee')[amount_col].sum().reset_index()
        grouped = grouped.sort_values(amount_col, ascending=False).head(15)
        
        # Format for frontend
        result = [
            {
                "employee": str(row['Employee']),
                "amount": round(float(row[amount_col]), 2)
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_amount_by_employee: {str(e)}")
        return []

def _get_vendor_amount(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 2: Vendor With Amount (Pie Chart)
    Legend: Expense Type, Values: Total Approved Amount
    """
    if 'Expense Type' not in df.columns:
        return []
    
    amount_col = 'Total Approved Amount' if 'Total Approved Amount' in df.columns else 'Amount Approved'
    if amount_col not in df.columns:
        return []
    
    try:
        # Group by expense type and sum amounts
        grouped = df.groupby('Expense Type')[amount_col].sum().reset_index()
        
        # Format for frontend
        result = [
            {
                "name": str(row['Expense Type']),
                "value": round(float(row[amount_col]), 2)
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_vendor_amount: {str(e)}")
        return []

def _get_amount_by_policy(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 3: Amount Distribution by Policy (Donut Chart)
    Legend: Policy, Values: Amount Approved
    """
    if 'Policy' not in df.columns:
        return []
    
    amount_col = 'Amount Approved' if 'Amount Approved' in df.columns else 'Total Approved Amount'
    if amount_col not in df.columns:
        return []
    
    try:
        # Group by policy and sum amounts
        grouped = df.groupby('Policy')[amount_col].sum().reset_index()
        
        # Format for frontend
        result = [
            {
                "name": str(row['Policy']),
                "value": round(float(row[amount_col]), 2)
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_amount_by_policy: {str(e)}")
        return []

def _get_amount_by_date(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 4: Amount by Transaction Date (Column Chart)
    X: Transaction Date, Y: Amount Approved
    """
    if 'Transaction Date' not in df.columns:
        return []
    
    amount_col = 'Amount Approved' if 'Amount Approved' in df.columns else 'Total Approved Amount'
    if amount_col not in df.columns:
        return []
    
    try:
        # Drop rows with null dates
        temp_df = df.dropna(subset=['Transaction Date']).copy()
        if temp_df.empty:
            return []
        
        # Format date as string for grouping
        temp_df['Date'] = temp_df['Transaction Date'].dt.strftime('%Y-%m-%d')
        
        # Group by date and sum amounts
        grouped = temp_df.groupby('Date')[amount_col].sum().reset_index()
        grouped = grouped.sort_values('Date')
        
        # Format for frontend
        result = [
            {
                "date": str(row['Date']),
                "amount": round(float(row[amount_col]), 2)
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_amount_by_date: {str(e)}")
        return []

# ============================================
# TABLE DATA FUNCTIONS
# ============================================

def get_table_data(df: Optional[pd.DataFrame], page: int = 1, page_size: int = 15, search: Optional[str] = None) -> Dict[str, Any]:
    """
    Get paginated table data
    
    Args:
        df: Input DataFrame
        page: Page number (1-indexed)
        page_size: Number of rows per page
        search: Optional search term
        
    Returns:
        Dictionary with data array and total count
    """
    if df is None or df.empty:
        return {"data": [], "total": 0}
    
    try:
        # Apply search if provided
        if search:
            df = _apply_search_filter(df, search)
        
        # Get total count
        total = len(df)
        
        # Apply pagination
        start = (page - 1) * page_size
        end = min(start + page_size, total)
        
        if start >= total:
            return {"data": [], "total": total}
        
        page_df = df.iloc[start:end].copy()
        
        # Format datetime columns for JSON serialization
        for col in page_df.columns:
            if pd.api.types.is_datetime64_any_dtype(page_df[col]):
                page_df[col] = page_df[col].dt.strftime('%Y-%m-%d')
        
        # Replace NaN with None (becomes null in JSON)
        page_df = page_df.replace({pd.NA: None, float('nan'): None})
        
        # Convert to records
        data = page_df.to_dict(orient="records")
        
        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
        
    except Exception as e:
        logger.error(f"Error getting table data: {str(e)}")
        return {"data": [], "total": 0}