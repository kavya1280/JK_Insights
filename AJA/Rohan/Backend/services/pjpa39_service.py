import pandas as pd
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURATION
# ============================================

OUTPUT_DIR = r"Output"
FILE_NAME = "PJPA39_Generated.xlsx"
SKIP_ROWS = 4

# Required columns for PJPA39
REQUIRED_COLUMNS = [
    'Position Code', 'Personnel Number', 'Employee ID(Only ALPHA NUM)',
    'Employee Status', 'Supplier', 'Position Code Name', 'Full Name',
    'Title', 'Employee Email Id', 'Phone Number', 'Employee Location',
    'Department', 'Company name', 'Employee Alias', 'Change Date',
    'Joining Date', 'Employee Separation Date', 'Rep. Manager',
    'HOD Names', 'HOD TMS Names', 'Cost Center', 'Gender',
    'Date Of Birth', 'Blood Group', 'Indicator', 'Country/Region Key',
    'Bank Account', 'Bank Country/Region', 'Bank Number', 'Postal Code',
    'Region', 'Company Code', 'IFSC Code', 'Account holder',
    'Nationality text', 'Title.1', 'State', 'Name of Financial Institution',
    'Date', 'Employee Location.1', 'Character Field with Length 10',
    'Payroll area', 'Flag on and off', 'Record Updated or not'
]

# Date columns that need parsing
DATE_COLUMNS = [
    'Joining Date', 'Employee Separation Date', 'Date Of Birth',
    'Change Date', 'Date'
]

# Column name mappings for standardization
COLUMN_MAPPINGS = {
    'Employee ID(Only ALPHA NUM)': 'Employee ID',
    'Employee ID (Only Alpha Num)': 'Employee ID',
    'Emp_CODE': 'Employee ID',
    'Employee Location.1': 'Employee Location_1',
    'Title.1': 'Title_1',
    'Full Name': 'Employee Name',
    'Rep. Manager': 'Reporting Manager',
    'HOD Names': 'HOD Name',
    'HOD TMS Names': 'HOD TMS Name',
    'Date Of Birth': 'DOB'
}

# ============================================
# DATA LOADING FUNCTIONS
# ============================================

def _load_data() -> Optional[pd.DataFrame]:
    """
    Load data from Excel file with proper cleaning and derived column creation
    
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
        
        # Standardize Employee ID column name
        df = _standardize_column_names(df)
        
        # Log available columns
        logger.info(f"Available columns: {list(df.columns)}")
        
        # Check for required columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns: {missing_cols}")
        
        # Parse date columns
        df = _parse_date_columns(df)
        
        # Create derived columns
        df = _create_derived_columns(df)
        
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

def _standardize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize column names for consistency
    
    Args:
        df: Input DataFrame
        
    Returns:
        DataFrame with standardized column names
    """
    # Create a copy of columns to iterate
    for old_name, new_name in COLUMN_MAPPINGS.items():
        if old_name in df.columns:
            # If target name already exists, drop the old one or rename it differently
            if new_name in df.columns and old_name != new_name:
                logger.info(f"Target column '{new_name}' already exists. Dropping '{old_name}'")
                df = df.drop(columns=[old_name])
            else:
                df = df.rename(columns={old_name: new_name})
                logger.info(f"Renamed column '{old_name}' to '{new_name}'")
    
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

def _create_derived_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived columns needed for analysis
    
    Args:
        df: Input DataFrame
        
    Returns:
        DataFrame with derived columns
    """
    today = pd.Timestamp.now()
    
    # 1. Calculate Days Overdue (if employee is separated but still active)
    if 'Employee Separation Date' in df.columns:
        
        # For separated employees, calculate days since separation
        df['Days Since Separation'] = (today - df['Employee Separation Date']).dt.days
        
        # Mark as ghost employee if separated but status is Active
        if 'Employee Status' in df.columns:
            df['Is Ghost Employee'] = (
                (df['Employee Status'].str.lower().str.strip() == 'active') & 
                (df['Employee Separation Date'].notna())
            )
        else:
            df['Is Ghost Employee'] = df['Employee Separation Date'].notna()
        
        # Calculate overdue days (only for ghost employees)
        df['Days Overdue'] = df.apply(
            lambda row: row['Days Since Separation'] if row.get('Is Ghost Employee', False) and pd.notna(row.get('Days Since Separation')) else 0,
            axis=1
        )
        
        # Create aging buckets
        bins = [-1, 0, 30, 60, 90, 180, 365, float('inf')]
        labels = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '91-180 Days', '181-365 Days', '365+ Days']
        df['Ghost Aging Bucket'] = pd.cut(df['Days Overdue'], bins=bins, labels=labels)
    
    # 2. Extract Year from Separation Date
    if 'Employee Separation Date' in df.columns:
        df['Year'] = df['Employee Separation Date'].dt.year
        df['Year'] = df['Year'].fillna(0).astype(int)
    
    # 3. Extract Month from Separation Date
    if 'Employee Separation Date' in df.columns:
        df['Month'] = df['Employee Separation Date'].dt.month
        df['Month Name'] = df['Employee Separation Date'].dt.strftime('%B')
    
    # 4. Calculate Notice Period (if both dates available)
    if 'Date of Resignation' in df.columns and 'Employee Last Working Date' in df.columns:
        df['Notice Period Days'] = (
            pd.to_datetime(df['Employee Last Working Date'], errors='coerce') - 
            pd.to_datetime(df['Date of Resignation'], errors='coerce')
        ).dt.days
        
        # Create notice period buckets
        bins = [-1, 0, 15, 30, 45, 60, 90, float('inf')]
        labels = ['0 Days', '1-15 Days', '16-30 Days', '31-45 Days', '46-60 Days', '61-90 Days', '90+ Days']
        df['Notice Period Bucket'] = pd.cut(df['Notice Period Days'], bins=bins, labels=labels)
    else:
        # Create empty column if not available
        df['Notice Period Days'] = 0
        df['Notice Period Bucket'] = 'Unknown'
    
    # 5. Clean employee status
    if 'Employee Status' in df.columns:
        df['Employee Status'] = df['Employee Status'].fillna('Unknown').astype(str).str.strip()
    else:
        df['Employee Status'] = 'Unknown'
    
    # 6. Calculate tenure if joining date available
    if 'Joining Date' in df.columns:
        df['Tenure Days'] = (today - df['Joining Date']).dt.days
        df['Tenure Years'] = (df['Tenure Days'] / 365).round(1)
    
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
        # Filter by ghost employees only (for relevant dashboards)
        # This ensures we only show separated employees marked as active
        if 'Is Ghost Employee' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Is Ghost Employee'] == True]
        
        # Apply each filter if column exists
        if params.get('employee_id') and 'Employee ID' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Employee ID'].astype(str) == str(params['employee_id'])]
        
        if params.get('employee_name') and 'Employee Name' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Employee Name'].astype(str) == str(params['employee_name'])]
        elif params.get('employee_name') and 'Full Name' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Full Name'].astype(str) == str(params['employee_name'])]
        
        if params.get('department') and 'Department' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Department'].astype(str) == str(params['department'])]
        
        if params.get('notice_bucket') and 'Notice Period Bucket' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Notice Period Bucket'].astype(str) == str(params['notice_bucket'])]
        
        if params.get('cost_center') and 'Cost Center' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Cost Center'].astype(str) == str(params['cost_center'])]
        
        if params.get('employee_status') and 'Employee Status' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Employee Status'].astype(str) == str(params['employee_status'])]
        
        if params.get('location') and 'Employee Location' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['Employee Location'].astype(str) == str(params['location'])]

        # Date range filter for "Document Date" (using Employee Separation Date)
        if params.get('start_date') and 'Employee Separation Date' in filtered_df.columns:
            start_date = pd.to_datetime(params['start_date'])
            filtered_df = filtered_df[filtered_df['Employee Separation Date'] >= start_date]
        
        if params.get('end_date') and 'Employee Separation Date' in filtered_df.columns:
            end_date = pd.to_datetime(params['end_date'])
            filtered_df = filtered_df[filtered_df['Employee Separation Date'] <= end_date]
        
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
    search_cols = ['Employee ID', 'Full Name', 'Employee Name', 'Department', 'Cost Center', 
                   'Employee Location', 'Employee Status', 'Company name', 'Position Code']
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
            "total_ghost_employees": 0,
            "unique_departments": 0,
            "unique_cost_centers": 0,
            "avg_days_overdue": 0,
            "notice_period_count": 0,
            "unique_locations": 0
        }
    
    try:
        # Total Ghost Employees
        if 'Employee ID' in df.columns:
            total_ghost = int(df['Employee ID'].nunique())
        else:
            total_ghost = len(df)
        
        # Unique Departments
        if 'Department' in df.columns:
            unique_departments = int(df['Department'].nunique())
        else:
            unique_departments = 0
        
        # Unique Cost Centers
        if 'Cost Center' in df.columns:
            unique_cost_centers = int(df['Cost Center'].nunique())
        else:
            unique_cost_centers = 0
        
        # Average Days Overdue
        if 'Days Overdue' in df.columns:
            avg_days_overdue = float(df['Days Overdue'].mean())
            avg_days_overdue = round(avg_days_overdue, 2)
        else:
            avg_days_overdue = 0
        
        # Notice Period Count (employees with notice period > 0)
        if 'Notice Period Days' in df.columns:
            notice_period_count = int((df['Notice Period Days'] > 0).sum())
        else:
            notice_period_count = 0
        
        # Unique Locations
        if 'Employee Location' in df.columns:
            unique_locations = int(df['Employee Location'].nunique())
        else:
            unique_locations = 0
        
        return {
            "total_ghost_employees": total_ghost,
            "unique_departments": unique_departments,
            "unique_cost_centers": unique_cost_centers,
            "avg_days_overdue": avg_days_overdue,
            "notice_period_count": notice_period_count,
            "unique_locations": unique_locations
        }
        
    except Exception as e:
        logger.error(f"Error calculating KPIs: {str(e)}")
        return {
            "total_ghost_employees": 0,
            "unique_departments": 0,
            "unique_cost_centers": 0,
            "avg_days_overdue": 0,
            "notice_period_count": 0,
            "unique_locations": 0
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
            "employee_names": [],
            "departments": [],
            "notice_buckets": [],
            "cost_centers": [],
            "employee_statuses": [],
            "locations": []
        }
    
    def safe_unique(column_name: str, alternate_names: List[str] = None) -> List[str]:
        """Safely get unique values from a column with fallback options"""
        # Try primary column name
        if column_name in df.columns:
            unique_vals = df[column_name].dropna().unique()
            unique_vals = [str(x) for x in unique_vals if str(x) not in ['nan', 'N/A', '']]
            return sorted(unique_vals)
        
        # Try alternate names if provided
        if alternate_names:
            for alt_name in alternate_names:
                if alt_name in df.columns:
                    unique_vals = df[alt_name].dropna().unique()
                    unique_vals = [str(x) for x in unique_vals if str(x) not in ['nan', 'N/A', '']]
                    return sorted(unique_vals)
        
        return []
    
    try:
        return {
            "employee_ids": safe_unique('Employee ID'),
            "employee_names": safe_unique('Employee Name', ['Full Name']),
            "departments": safe_unique('Department'),
            "notice_buckets": safe_unique('Notice Period Bucket'),
            "cost_centers": safe_unique('Cost Center'),
            "employee_statuses": safe_unique('Employee Status'),
            "locations": safe_unique('Employee Location')
        }
    except Exception as e:
        logger.error(f"Error getting filter options: {str(e)}")
        return {
            "employee_ids": [],
            "employee_names": [],
            "departments": [],
            "notice_buckets": [],
            "cost_centers": [],
            "employee_statuses": [],
            "locations": []
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
            "ghost_employee_department": [],
            "ghost_employee_notice": [],
            "ghost_employee_map": [],
            "ghost_employee_trend": [],
            "ghost_employee_status": [],
            "ghost_employee_cost_center": []
        }
    
    try:
        return {
            "ghost_employee_department": _get_ghost_by_department(df),
            "ghost_employee_notice": _get_ghost_by_notice_bucket(df),
            "ghost_employee_map": _get_ghost_by_location(df),
            "ghost_employee_trend": _get_ghost_trend(df),
            "ghost_employee_status": _get_ghost_by_status(df),
            "ghost_employee_cost_center": _get_ghost_by_cost_center(df)
        }
    except Exception as e:
        logger.error(f"Error generating chart data: {str(e)}")
        return {
            "ghost_employee_department": [],
            "ghost_employee_notice": [],
            "ghost_employee_map": [],
            "ghost_employee_trend": [],
            "ghost_employee_status": [],
            "ghost_employee_cost_center": []
        }

def _get_ghost_by_department(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 1: Ghost Employee by Department (Horizontal Bar Chart)
    """
    if 'Department' not in df.columns or 'Employee ID' not in df.columns:
        return []
    
    try:
        # Group by department and count unique employees
        dept_col = 'Department'
        id_col = 'Employee ID'
        
        counts = df.groupby(dept_col)[id_col].nunique().reset_index(name='count')
        counts = counts.sort_values('count', ascending=False).head(15)
        
        result = [
            {
                "department": str(row[dept_col]),
                "count": int(row['count'])
            }
            for _, row in counts.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_ghost_by_department: {str(e)}")
        return []

def _get_ghost_by_notice_bucket(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 2: Ghost Employee Distribution by Notice Days (Column Chart)
    """
    if 'Ghost Aging Bucket' not in df.columns or 'Employee ID' not in df.columns:
        return []
    
    try:
        # Group by aging bucket and count unique employees
        grouped = df.groupby('Ghost Aging Bucket')['Employee ID'].nunique().reset_index(name='count')
        
        # Define bucket order for sorting
        bucket_order = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', 
                        '91-180 Days', '181-365 Days', '365+ Days']
        
        # Create a categorical column for sorting
        grouped['bucket_order'] = pd.Categorical(
            grouped['Ghost Aging Bucket'], 
            categories=bucket_order, 
            ordered=True
        )
        grouped = grouped.sort_values('bucket_order')
        
        result = [
            {
                "notice_bucket": str(row['Ghost Aging Bucket']),
                "count": int(row['count'])
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_ghost_by_notice_bucket: {str(e)}")
        return []

def _get_ghost_by_location(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 3: Ghost Employee Spread across Country (Map Chart)
    """
    if 'Employee Location' not in df.columns or 'Employee ID' not in df.columns:
        return []
    
    try:
        # Group by location and count unique employees
        loc_col = 'Employee Location'
        id_col = 'Employee ID'
        
        counts = df.groupby(loc_col)[id_col].nunique().reset_index(name='count')
        counts = counts.sort_values('count', ascending=False)
        
        result = [
            {
                "location": str(row[loc_col]),
                "count": int(row['count'])
            }
            for _, row in counts.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_ghost_by_location: {str(e)}")
        return []

def _get_ghost_trend(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 4: Ghost Employee Trend by Year (Area Chart)
    """
    if 'Year' not in df.columns or 'Employee ID' not in df.columns:
        return []
    
    try:
        # Group by year and count unique employees
        # Filter out years that are 0 or null
        trend_df = df[df['Year'] > 0].copy() if 'Year' in df.columns else df
        
        if trend_df.empty:
            return []
        
        grouped = trend_df.groupby('Year')['Employee ID'].nunique().reset_index(name='count')
        grouped = grouped.sort_values('Year')
        
        result = [
            {
                "year": str(int(row['Year'])) if pd.notna(row['Year']) else "Unknown",
                "count": int(row['count'])
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_ghost_trend: {str(e)}")
        return []

def _get_ghost_by_status(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 5: Ghost Employee by Status (Donut Chart)
    """
    if 'Employee Status' not in df.columns or 'Employee ID' not in df.columns:
        return []
    
    try:
        # Group by status and count unique employees
        grouped = df.groupby('Employee Status')['Employee ID'].nunique().reset_index(name='count')
        
        result = [
            {
                "name": str(row['Employee Status']),
                "value": int(row['count'])
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_ghost_by_status: {str(e)}")
        return []

def _get_ghost_by_cost_center(df: pd.DataFrame) -> List[Dict]:
    """
    Chart 6: Ghost Employee by Cost Center (Horizontal Bar Chart)
    """
    if 'Cost Center' not in df.columns or 'Employee ID' not in df.columns:
        return []
    
    try:
        # Group by cost center and count unique employees
        grouped = df.groupby('Cost Center')['Employee ID'].nunique().reset_index(name='count')
        grouped = grouped.sort_values('count', ascending=False).head(15)
        
        result = [
            {
                "cost_center": str(row['Cost Center']),
                "count": int(row['count'])
            }
            for _, row in grouped.iterrows()
        ]
        
        return result
        
    except Exception as e:
        logger.error(f"Error in _get_ghost_by_cost_center: {str(e)}")
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
            return {
                "data": [], 
                "total": total, 
                "page": page, 
                "page_size": page_size, 
                "total_pages": (total + page_size - 1) // page_size
            }
        
        page_df = df.iloc[start:end].copy()
        
        # Select relevant columns for display
        display_cols = [
            'Employee ID', 'Employee Name', 'Full Name', 'Department', 
            'Cost Center', 'Employee Location', 'Employee Status', 
            'Days Overdue', 'Ghost Aging Bucket', 'Joining Date', 
            'Employee Separation Date', 'Notice Period Days', 
            'Position Code', 'Company name', 'Reporting Manager'
        ]
        
        # Clean up column names
        display_cols = [col for col in display_cols if col in page_df.columns]
        
        if display_cols:
            page_df = page_df[display_cols]
        
        # Format datetime columns for JSON serialization
        for col in page_df.columns:
            if pd.api.types.is_datetime64_any_dtype(page_df[col]):
                page_df[col] = page_df[col].dt.strftime('%Y-%m-%d')
            elif pd.api.types.is_numeric_dtype(page_df[col]) and col not in ['Employee ID']:
                # Round numeric values to 2 decimal places
                page_df[col] = page_df[col].round(2)
        
        # Replace NaN with None (becomes null in JSON)
        page_df = page_df.replace({pd.NA: None, np.nan: None, float('nan'): None})
        
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