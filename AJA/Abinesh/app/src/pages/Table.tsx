import { useEffect, useState } from 'react';
import { useData } from '../hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Search, 
  LayoutDashboard, 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export default function TablePage() {
  const { 
    tableData, 
    fetchTableData, 
    setCurrentView, 
    uploadedFile,
    loading 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (uploadedFile) {
      fetchTableData({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm || undefined,
        sort_column: sortColumn || undefined,
        sort_direction: sortDirection
      });
    }
  }, [currentPage, pageSize, sortColumn, sortDirection, uploadedFile]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTableData({
      page: 1,
      page_size: pageSize,
      search: searchTerm || undefined,
      sort_column: sortColumn || undefined,
      sort_direction: sortDirection
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    if (!tableData) return;
    
    // Convert data to CSV
    const headers = tableData.columns.map(col => col.header).join(',');
    const rows = tableData.data.map(row => 
      tableData.columns.map(col => {
        const value = row[col.field];
        // Escape values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${uploadedFile?.name || 'data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="table-loading">
        <Loader2 size={48} className="animate-spin" />
        <p>Loading data...</p>
      </div>
    );
  }

  if (!tableData || tableData.data.length === 0) {
    return (
      <div className="table-empty">
        <FileSpreadsheet size={64} />
        <h2>No Data Available</h2>
        <p>Please upload an Excel file to view the data table.</p>
        <Button onClick={() => setCurrentView('upload')}>
          Upload File
        </Button>
      </div>
    );
  }

  const { data, columns, total_rows, total_pages } = tableData;

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(total_pages);
      } else if (currentPage >= total_pages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = total_pages - 3; i <= total_pages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total_pages);
      }
    }
    return pages;
  };

  return (
    <div className="table-page">
      {/* Header */}
      <div className="table-header">
        <div className="header-title">
          <h1>Data Table</h1>
          <span className="record-count">{total_rows.toLocaleString()} records</span>
        </div>
        <div className="header-actions">
          <Button onClick={() => setCurrentView('dashboard')} variant="outline">
            <LayoutDashboard size={18} />
            Dashboard
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download size={18} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="search-card">
        <CardContent className="search-content">
          <div className="search-input-wrapper">
            <Search size={18} />
            <Input
              type="text"
              placeholder="Search in all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="data-table-card">
        <CardContent className="table-container">
          <Table>
            <TableHeader className="sticky-header">
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="sortable-header"
                  >
                    <div className="header-content">
                      {col.header}
                      {sortColumn === col.field && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell key={col.field}>
                      {row[col.field] !== '' ? row[col.field] : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="pagination-wrapper">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'disabled' : ''}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === -1 ? (
                  <span className="pagination-ellipsis">...</span>
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(total_pages, p + 1))}
                className={currentPage === total_pages ? 'disabled' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        
        <div className="pagination-info">
          Page {currentPage} of {total_pages} | Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total_rows)} of {total_rows}
        </div>
      </div>
    </div>
  );
}
