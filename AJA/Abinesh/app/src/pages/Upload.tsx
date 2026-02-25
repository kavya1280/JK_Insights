import { useState, useRef } from 'react';
import { useData } from '../hooks/useData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Check, ArrowRight } from 'lucide-react';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, loading, setCurrentView, uploadedFile } = useData();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const success = await uploadFile(file);
    if (success) {
      setUploadSuccess(true);
    }
  };

  const handleViewDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewTable = () => {
    setCurrentView('table');
  };

  return (
    <div className="upload-page">
      {/* Header */}
      <header className="page-header px-6 py-4 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#16C784" />
              <path d="M2 17L12 22L22 17" stroke="#16C784" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[#0B1F3A] font-bold text-lg">AJALabs Analytics</span>
          <Button variant="ghost" className="text-gray-500 hover:text-red-500 gap-2 px-0" onClick={() => (window as any).location.reload()}>
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="upload-content">
        <div className="upload-split">
          {/* Left Side - Upload Area */}
          <div className="upload-left">
            <div className="upload-text">
              <h1>Upload File for Analysis</h1>
              <p>
                Upload your Excel file containing employee expense data for anomaly detection.
                Supported formats: .xlsx, .xls
              </p>
            </div>

            {!uploadSuccess ? (
              <Card
                className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="dropzone-content">
                  <div className="upload-icon">
                    <Upload size={48} />
                  </div>
                  <h3>Drag & Drop your Excel file</h3>
                  <p>or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {loading && <div className="upload-loading">Processing...</div>}
                </CardContent>
              </Card>
            ) : (
              <Card className="upload-success-card">
                <CardContent className="success-content">
                  <div className="success-icon">
                    <Check size={48} />
                  </div>
                  <h3>File Uploaded Successfully!</h3>
                  <p className="file-name">{uploadedFile?.name}</p>

                  <div className="action-buttons">
                    <Button onClick={handleViewTable} variant="outline">
                      <FileSpreadsheet size={18} />
                      View Table
                    </Button>
                    <Button onClick={handleViewDashboard}>
                      View Dashboard
                      <ArrowRight size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              variant="outline"
              className="new-analysis-btn"
              onClick={() => setUploadSuccess(false)}
            >
              Start New Analysis
            </Button>
          </div>

          {/* Right Side - Illustration */}
          <div className="upload-right">
            <div className="analytics-illustration">
              <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Elements */}
                <circle cx="200" cy="150" r="120" fill="#F0FDF4" />
                <circle cx="320" cy="80" r="40" fill="#DCFCE7" />
                <circle cx="80" cy="220" r="30" fill="#DCFCE7" />

                {/* Chart Bars */}
                <rect x="120" y="180" width="30" height="60" rx="4" fill="#16C784" />
                <rect x="160" y="150" width="30" height="90" rx="4" fill="#0B1F3A" />
                <rect x="200" y="120" width="30" height="120" rx="4" fill="#16C784" />
                <rect x="240" y="170" width="30" height="70" rx="4" fill="#0B1F3A" />

                {/* Pie Chart */}
                <circle cx="280" cy="200" r="35" fill="#16C784" />
                <path d="M280 200 L280 165 A35 35 0 0 1 315 200 Z" fill="#0B1F3A" />
                <circle cx="280" cy="200" r="20" fill="white" />

                {/* Line Graph */}
                <polyline
                  points="100,100 140,80 180,90 220,60 260,70 300,50"
                  fill="none"
                  stroke="#16C784"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                <circle cx="100" cy="100" r="5" fill="#0B1F3A" />
                <circle cx="140" cy="80" r="5" fill="#0B1F3A" />
                <circle cx="180" cy="90" r="5" fill="#0B1F3A" />
                <circle cx="220" cy="60" r="5" fill="#0B1F3A" />
                <circle cx="260" cy="70" r="5" fill="#0B1F3A" />
                <circle cx="300" cy="50" r="5" fill="#0B1F3A" />

                {/* Document Icon */}
                <rect x="60" y="120" width="50" height="70" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                <rect x="70" y="135" width="30" height="4" rx="2" fill="#16C784" />
                <rect x="70" y="145" width="30" height="4" rx="2" fill="#E5E7EB" />
                <rect x="70" y="155" width="20" height="4" rx="2" fill="#E5E7EB" />
                <rect x="70" y="170" width="25" height="8" rx="2" fill="#16C784" />

                {/* Magnifying Glass */}
                <circle cx="330" cy="130" r="25" fill="none" stroke="#0B1F3A" strokeWidth="4" />
                <line x1="348" y1="148" x2="365" y2="165" stroke="#0B1F3A" strokeWidth="4" strokeLinecap="round" />

                {/* Alert Icon */}
                <circle cx="150" cy="240" r="20" fill="#FEE2E2" />
                <text x="150" y="248" textAnchor="middle" fill="#EF4444" fontSize="20" fontWeight="bold">!</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
