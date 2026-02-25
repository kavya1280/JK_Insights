import Login from './pages/Login';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Table from './pages/Table';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import './App.css';

// Main App Content Component
function AppContent() {
  const { isAuthenticated } = useAuth();
  const { currentView } = useData();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {currentView === 'upload' && <Upload />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'table' && <Table />}
      </main>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
