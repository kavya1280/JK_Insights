import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Table,
  Upload,
  ChevronDown,
  LogOut,
  User,
  FileBarChart,
  Database
} from 'lucide-react';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const {
    currentView,
    setCurrentView,
    availableFiles,
    loadAvailableFiles,
    loadFile,
    uploadedFile,
    setUploadedFile
  } = useData();

  const [selectedInsight, setSelectedInsight] = useState<string>('');

  useEffect(() => {
    loadAvailableFiles();
  }, []);

  const handleInsightSelect = async (filename: string) => {
    setSelectedInsight(filename);
    await loadFile(filename);
  };

  const handleNewAnalysis = () => {
    setUploadedFile(null);
    setSelectedInsight('');
    setCurrentView('upload');
  };

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-icon-small">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#16C784" />
            <path d="M2 17L12 22L22 17" stroke="#16C784" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="company-name">AJALabs</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Insights Dropdown */}
        <div className="nav-section">
          <label className="nav-label">Insights</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="insights-dropdown">
                <Database size={16} />
                <span>{selectedInsight || 'Select File'}</span>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="insights-menu">
              {availableFiles.length > 0 ? (
                availableFiles.map((file) => (
                  <DropdownMenuItem
                    key={file.name}
                    onClick={() => handleInsightSelect(file.name)}
                  >
                    <FileBarChart size={16} />
                    {file.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No files available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Buttons */}
        <div className="nav-section">
          <label className="nav-label">Actions</label>

          <Button
            variant={currentView === 'upload' ? 'default' : 'ghost'}
            className="nav-button"
            onClick={handleNewAnalysis}
          >
            <Upload size={18} />
            <span>Upload Excel</span>
          </Button>

          {uploadedFile && (
            <>
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                className="nav-button"
                onClick={() => setCurrentView('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>View Dashboard</span>
              </Button>

              <Button
                variant={currentView === 'table' ? 'default' : 'ghost'}
                className="nav-button"
                onClick={() => setCurrentView('table')}
              >
                <Table size={18} />
                <span>View Table</span>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin User'}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>

        <Button variant="ghost" className="logout-button" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
