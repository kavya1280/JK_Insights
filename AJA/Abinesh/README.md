# AJALabs Analytics - Enterprise Anomaly Detection Platform

A fully dynamic Excel-driven anomaly analytics web application to replace Power BI dashboards (PJPA37, PJPA38, PJPA39).

## Features

- **Login Page**: Secure authentication with username/password
- **File Upload**: Drag & drop Excel file upload
- **Insights Dropdown**: Load pre-existing Excel files
- **Dashboard View**: KPI cards and AMCharts 5 visualizations
- **Table View**: Full-featured data table with search, sort, and pagination
- **Filters**: Multi-select filters for all data dimensions
- **Responsive Design**: Works on desktop, laptop, and tablet

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- AMCharts 5
- Axios

### Backend
- Python FastAPI
- Pandas
- Openpyxl
- Uvicorn

## Project Structure

```
/mnt/okcomputer/output/
├── backend/
│   ├── main.py              # FastAPI main application
│   ├── requirements.txt     # Python dependencies
│   ├── processors/
│   │   ├── pjpa37.py       # PJPA37 data processor
│   │   ├── pjpa38.py       # PJPA38 data processor
│   │   └── pjpa39.py       # PJPA39 data processor
│   └── uploads/            # Uploaded Excel files storage
├── app/                     # React frontend (built)
│   ├── dist/               # Production build
│   ├── src/
│   │   ├── pages/          # Login, Upload, Dashboard, Table
│   │   ├── components/     # Sidebar, KPI, Chart, Filter
│   │   └── hooks/          # useAuth, useData
│   └── ...
└── start_backend.py        # Backend startup script
```

## Login Credentials

- **Username**: `admin`
- **Password**: `Admin@123`

## Running the Application

### 1. Start the Backend Server

```bash
cd /mnt/okcomputer/output
python start_backend.py
```

Or manually:

```bash
cd /mnt/okcomputer/output/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`

### 2. Frontend

The frontend is already built and deployed at:
**https://7dmzr37mqcihi.ok.kimi.link**

For local development:

```bash
cd /mnt/okcomputer/output/app
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | User authentication |
| `/upload` | POST | Upload Excel file |
| `/files` | GET | List available files |
| `/load-file` | POST | Load specific file |
| `/dashboard-data` | POST | Get KPIs and chart data |
| `/table-data` | POST | Get paginated table data |
| `/filter-options` | GET | Get filter dropdown values |

## Supported File Types

The system automatically detects file types based on filename:

- **PJPA37**: Employee Claims Anomaly Detection
  - KPIs: Total Employees, Total Reports, Clusters, Claims, Spend, Anomaly Rate
  - Charts: Claims by Employee, Spend by Employee, Claims by Policy, High Risk Employees

- **PJPA38**: Travel Expense Anomaly Detection
  - KPIs: Total Employees, Rare Trips, Total Trips, Rare Spend, Odd Travel %
  - Charts: Flag Distribution, Rare by Expense Type, Rare Travellers, Amount vs Usage

- **PJPA39**: Employee Separation Analytics
  - KPIs: Total Employees, Departments, Locations, Avg Overdue
  - Charts: Employees by Department, Aging Bucket, Year Trend

## Data Format

### PJPA37 Expected Columns
- Employee ID
- Report ID
- Cluster_ID
- Total Claims
- Total Spend Amount
- Is_Anomaly (Yes/No)
- Policy
- Department

### PJPA38 Expected Columns
- Employee ID
- Flag (Rare/Normal)
- Mode_Count
- Approved Amount
- Expense Type
- Department

### PJPA39 Expected Columns
- Employee ID
- Department
- State
- Separation Date
- Year

## Design Theme

- **Primary Green**: #16C784
- **Primary Navy**: #0B1F3A
- **Background**: #F5F7FA
- **Card Background**: #FFFFFF
- **Border**: #E5E7EB
- **Text Primary**: #111827
- **Text Secondary**: #6B7280

## Currency Format

All monetary values are displayed in Indian Rupees (INR) format.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
