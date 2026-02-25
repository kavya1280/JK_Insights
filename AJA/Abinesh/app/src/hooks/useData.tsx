import { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export type ViewType = 'upload' | 'dashboard' | 'table';

interface FileInfo {
  name: string;
  type: string;
  path: string;
}

interface DashboardData {
  filename: string;
  file_type: string;
  total_rows: number;
  kpis: Record<string, { value: number; label: string; is_currency?: boolean; is_percentage?: boolean }>;
  charts: Record<string, any[]>;
}

interface TableData {
  data: any[];
  columns: { field: string; header: string }[];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface FilterOptions {
  employee_id: string[];
  employee_name: string[];
  department: string[];
  policy: string[];
  report_id: string[];
  cluster: string[];
  expense_type: string[];
  state: string[];
}

interface DataContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  uploadedFile: FileInfo | null;
  setUploadedFile: (file: FileInfo | null) => void;
  availableFiles: FileInfo[];
  loadAvailableFiles: () => Promise<void>;
  dashboardData: DashboardData | null;
  tableData: TableData | null;
  filterOptions: FilterOptions | null;
  uploadFile: (file: File) => Promise<boolean>;
  loadFile: (filename: string) => Promise<boolean>;
  fetchDashboardData: (filters?: any) => Promise<void>;
  fetchTableData: (params?: any) => Promise<void>;
  fetchFilterOptions: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
  const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files`);
      setAvailableFiles(response.data.files);
    } catch (err: any) {
      console.error('Error loading files:', err);
    }
  };

  const uploadFile = async (file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setUploadedFile({
          name: response.data.filename,
          type: response.data.file_type,
          path: ''
        });
        await fetchDashboardData();
        await fetchFilterOptions();
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
      setLoading(false);
      return false;
    }
  };

  const loadFile = async (filename: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/load-file`, { filename });
      
      if (response.data.success) {
        setUploadedFile({
          name: response.data.filename,
          type: response.data.file_type,
          path: ''
        });
        await fetchDashboardData();
        await fetchFilterOptions();
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load file');
      setLoading(false);
      return false;
    }
  };

  const fetchDashboardData = async (filters?: any) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/dashboard-data`, filters || {});
      setDashboardData(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const fetchTableData = async (params?: any) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/table-data`, params || {
        page: 1,
        page_size: 25
      });
      setTableData(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch table data');
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/filter-options`);
      setFilterOptions(response.data);
    } catch (err: any) {
      console.error('Error fetching filter options:', err);
    }
  };

  return (
    <DataContext.Provider value={{
      currentView,
      setCurrentView,
      uploadedFile,
      setUploadedFile,
      availableFiles,
      loadAvailableFiles,
      dashboardData,
      tableData,
      filterOptions,
      uploadFile,
      loadFile,
      fetchDashboardData,
      fetchTableData,
      fetchFilterOptions,
      loading,
      error
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
