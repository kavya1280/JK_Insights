from flask import Blueprint, request, jsonify
import os
import pandas as pd
import io
import zipfile
import traceback

upload_bp = Blueprint('upload', __name__)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

# Global or persistent storage for the session data
global_data_df = None

@upload_bp.route("/upload", methods=["POST"])
def upload_files():
    global global_data_df
    
    DATA_DIR = "Data"
    os.makedirs(DATA_DIR, exist_ok=True)
    
    EXPECTED_FILENAMES = {
        "concurFile": "Concur_Header_Data.xlsx",
        "leftEmpFile": "Left_Employees.xlsx",
        "empMasterFile": "Employee_Master.xlsx",
        "lineItemFile": "Line_Item_Data.xlsx"
    }
    
    files_saved = 0
    
    try:
        if not request.files:
            return jsonify({"detail": "No files provided."}), 400

        for key, expected_name in EXPECTED_FILENAMES.items():
            if key in request.files:
                file = request.files[key]
                if file.filename != '':
                    save_path = os.path.join(DATA_DIR, expected_name)
                    
                    if file.filename.lower().endswith('.zip'):
                        dfs = []
                        with zipfile.ZipFile(file, 'r') as z:
                            for file_info in z.infolist():
                                if not file_info.filename.startswith('__MACOSX') and file_info.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
                                    with z.open(file_info) as f:
                                        file_bytes = f.read()
                                        if file_info.filename.lower().endswith('.csv'):
                                            try:
                                                df = pd.read_csv(io.BytesIO(file_bytes), low_memory=False)
                                            except UnicodeDecodeError:
                                                df = pd.read_csv(io.BytesIO(file_bytes), encoding='latin1', low_memory=False)
                                        else:
                                            df = pd.read_excel(io.BytesIO(file_bytes))
                                        dfs.append(df)
                        
                        if dfs:
                            combined_df = pd.concat(dfs, ignore_index=True)
                            combined_df.to_excel(save_path, index=False)
                            files_saved += 1
                            if key == "concurFile":
                                global_data_df = combined_df
                        else:
                            return jsonify({"detail": f"No valid data files found inside the ZIP for {key}."}), 400
                    else:
                        file.save(save_path)
                        files_saved += 1
                        if key == "concurFile":
                            try:
                                global_data_df = pd.read_excel(save_path)
                            except Exception as e:
                                print(f"Error loading concur file: {e}")

        if files_saved == 0:
            return jsonify({"detail": "No valid files uploaded"}), 400
        
        return jsonify({"status": "success", "message": f"Successfully uploaded {files_saved} files"})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500

# Simple cache to avoid re-reading huge files on every dashboard request
_data_cache = {
    "path": None,
    "mtime": None,
    "df": None
}

def get_current_data():
    global global_data_df
    
    def clean_amount(val):
        if pd.isna(val) or val == '': return 0
        if isinstance(val, (int, float)): return val
        s = str(val).replace('₹', '').replace(',', '').strip()
        try:
            return float(s)
        except:
            return 0

    if global_data_df is not None:
        df = global_data_df.copy()
        if 'Amount Approved' in df.columns:
            df['Amount Approved'] = df['Amount Approved'].apply(clean_amount)
            df = df[df['Amount Approved'] > 6000]
        return df
    
    try:
        path = "Output/PJPA32_Holiday_Generated.xlsx"
        if not os.path.exists(path):
            path = "Output/PJPA32_Weekend_Generated.xlsx"
            
        if os.path.exists(path):
            mtime = os.path.getmtime(path)
            
            # Use cache if file hasn't changed
            if _data_cache["path"] == path and _data_cache["mtime"] == mtime:
                return _data_cache["df"]

            # PJPA32 files have a 6-row header 
            df = pd.read_excel(path, skiprows=5)
            
            if 'Approved Amount' in df.columns:
                df['Amount Approved'] = df['Approved Amount'].apply(clean_amount)
            if 'City/Location' in df.columns:
                df['Location'] = df[df['City/Location'].notna()]['City/Location']
            if 'Day of Week (Name)' in df.columns:
                 df['Weekend'] = df['Day of Week (Name)'].isin(['Saturday', 'Sunday'])
            
            if 'Amount Approved' in df.columns:
                df = df[df['Amount Approved'] > 6000]
            
            # Update cache
            _data_cache["path"] = path
            _data_cache["mtime"] = mtime
            _data_cache["df"] = df
                
            return df
    except Exception as e:
        print(f"Error in get_current_data: {e}")
        
    return None

