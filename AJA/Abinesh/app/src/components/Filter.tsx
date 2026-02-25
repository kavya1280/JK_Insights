import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search } from 'lucide-react';

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

interface FilterValues {
  employee_id: string[];
  employee_name: string[];
  department: string[];
  policy: string[];
  report_id: string[];
  cluster: string[];
  expense_type: string[];
  state: string[];
  date_range: { start: string; end: string } | null;
  amount_range: { min: number; max: number } | null;
}

interface FilterPanelProps {
  options: FilterOptions | null;
  onApply: (filters: FilterValues) => void;
  onClear: () => void;
}

export function FilterPanel({ options, onApply, onClear }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    employee_id: [],
    employee_name: [],
    department: [],
    policy: [],
    report_id: [],
    cluster: [],
    expense_type: [],
    state: [],
    date_range: null,
    amount_range: null
  });

  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [expandedDropdowns, setExpandedDropdowns] = useState<Record<string, boolean>>({});

  const toggleSelection = (field: keyof FilterValues, value: string) => {
    setFilters(prev => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({
      employee_id: [],
      employee_name: [],
      department: [],
      policy: [],
      report_id: [],
      cluster: [],
      expense_type: [],
      state: [],
      date_range: null,
      amount_range: null
    });
    onClear();
  };

  const getFilteredOptions = (field: string, options: string[]) => {
    const searchTerm = searchTerms[field] || '';
    if (!searchTerm) return options.slice(0, 20);
    return options.filter(opt =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  };

  const hasActiveFilters = Object.values(filters).some(
    v => Array.isArray(v) ? v.length > 0 : v !== null
  );

  const renderMultiSelect = (
    label: string,
    field: keyof FilterValues,
    optionsList: string[]
  ) => {
    if (!optionsList || optionsList.length === 0) return null;

    const selected = filters[field] as string[];
    const isExpanded = expandedDropdowns[field] || false;
    const filteredOptions = getFilteredOptions(field, optionsList);

    return (
      <div className="filter-field">
        <Label className="filter-label">{label}</Label>
        <div className="multi-select">
          <div
            className="multi-select-trigger"
            onClick={() => setExpandedDropdowns(prev => ({ ...prev, [field]: !prev[field] }))}
          >
            <span className="multi-select-placeholder">
              {selected.length > 0 ? `${selected.length} selected` : `Select ${label}`}
            </span>
            <span className="multi-select-arrow">▼</span>
          </div>

          {isExpanded && (
            <div className="multi-select-dropdown">
              <div className="multi-select-search">
                <Search size={14} />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerms[field] || ''}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, [field]: e.target.value }))}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="multi-select-options">
                {filteredOptions.map((option) => (
                  <div
                    key={option}
                    className={`multi-select-option ${selected.includes(option) ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(field, option);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      readOnly
                    />
                    <span>{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="selected-tags">
            {selected.slice(0, 3).map(value => (
              <Badge key={value} variant="secondary" className="filter-tag">
                {value}
                <X size={12} onClick={() => toggleSelection(field, value)} />
              </Badge>
            ))}
            {selected.length > 3 && (
              <Badge variant="secondary" className="filter-tag">
                +{selected.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={18} />
        <h3>Filters</h3>
        {hasActiveFilters && (
          <Badge variant="default" className="filter-count">
            Active
          </Badge>
        )}
      </div>

      <div className="filter-grid">
        {renderMultiSelect('Employee ID', 'employee_id', options?.employee_id || [])}
        {renderMultiSelect('Employee Name', 'employee_name', options?.employee_name || [])}
        {renderMultiSelect('Department', 'department', options?.department || [])}
        {renderMultiSelect('Policy', 'policy', options?.policy || [])}
        {renderMultiSelect('Report ID', 'report_id', options?.report_id || [])}
        {renderMultiSelect('Cluster', 'cluster', options?.cluster || [])}
        {renderMultiSelect('Expense Type', 'expense_type', options?.expense_type || [])}
        {renderMultiSelect('State', 'state', options?.state || [])}

        <div className="filter-field">
          <Label className="filter-label">Date Range</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              className="h-9 text-xs"
              onChange={(e) => setFilters(prev => ({
                ...prev,
                date_range: { start: e.target.value, end: prev.date_range?.end || '' }
              }))}
            />
            <Input
              type="date"
              className="h-9 text-xs"
              onChange={(e) => setFilters(prev => ({
                ...prev,
                date_range: { start: prev.date_range?.start || '', end: e.target.value }
              }))}
            />
          </div>
        </div>

        <div className="filter-field">
          <Label className="filter-label">Amount Range</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              className="h-9 text-xs"
              onChange={(e) => setFilters(prev => ({
                ...prev,
                amount_range: { min: Number(e.target.value), max: prev.amount_range?.max || 10000000 }
              }))}
            />
            <Input
              type="number"
              placeholder="Max"
              className="h-9 text-xs"
              onChange={(e) => setFilters(prev => ({
                ...prev,
                amount_range: { min: prev.amount_range?.min || 0, max: Number(e.target.value) }
              }))}
            />
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <Button variant="outline" onClick={handleClear} disabled={!hasActiveFilters}>
          Clear Filters
        </Button>
        <Button onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
