import React, { useState, useMemo } from 'react';
import './DataTable.css';

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  fixed?: 'left' | 'right';
  responsive?: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
  className?: string;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: React.ReactNode;
  rowKey?: string | ((record: T) => string);
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  responsive?: boolean;
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  empty,
  rowKey = 'id',
  pagination,
  onRowClick,
  className = '',
  size = 'medium',
  responsive = true
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [isMobileView, setIsMobileView] = useState(false);

  // Check if mobile view based on screen size
  React.useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Filter columns for mobile responsiveness
  const visibleColumns = useMemo(() => {
    if (!responsive || !isMobileView) return columns;
    
    return columns.filter(col => {
      if (!col.responsive) return true;
      return col.responsive.includes('xs') || col.responsive.includes('sm');
    });
  }, [columns, responsive, isMobileView]);

  // Render cell value
  const renderCell = (column: Column<T>, record: T, index: number) => {
    if (column.render) {
      const value = record[column.dataIndex || column.key];
      return column.render(value, record, index);
    }
    
    const value = record[column.dataIndex || column.key];
    return value ?? '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="data-table-empty">
        {empty || (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Data Available</h3>
            <p>There are no records to display.</p>
          </div>
        )}
      </div>
    );
  }

  // Mobile card view
  if (responsive && isMobileView) {
    return (
      <div className={`data-table mobile-cards ${className}`}>
        <div className="table-cards">
          {sortedData.map((record, index) => (
            <div
              key={getRowKey(record, index)}
              className={`table-card ${onRowClick ? 'clickable' : ''}`}
              onClick={() => onRowClick?.(record, index)}
            >
              {visibleColumns.map((column) => (
                <div key={column.key} className="card-field">
                  <span className="card-label">{column.title}:</span>
                  <span className="card-value">
                    {renderCell(column, record, index)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {pagination && (
          <div className="table-pagination">
            <Pagination {...pagination} />
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={`data-table size-${size} ${className}`}>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${column.align ? `text-${column.align}` : ''}
                    ${column.sortable ? 'sortable' : ''}
                    ${column.fixed ? `fixed-${column.fixed}` : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="th-content">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <span className={`sort-icon ${
                        sortConfig?.key === column.key 
                          ? sortConfig.direction 
                          : ''
                      }`}>
                        <span className="sort-up">▲</span>
                        <span className="sort-down">▼</span>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={onRowClick ? 'clickable' : ''}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${column.align ? `text-${column.align}` : ''}
                      ${column.fixed ? `fixed-${column.fixed}` : ''}
                      ${column.className || ''}
                    `}
                  >
                    {renderCell(column, record, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="table-pagination">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
};

// Pagination Component
interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startRecord = (current - 1) * pageSize + 1;
  const endRecord = Math.min(current * pageSize, total);

  const handlePageChange = (page: number) => {
    if (page !== current && page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-btn ${i === current ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startRecord} to {endRecord} of {total} entries
      </div>
      
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={current <= 1}
          onClick={() => handlePageChange(current - 1)}
          title="Previous page"
        >
          ◀
        </button>
        
        {renderPageNumbers()}
        
        <button
          className="page-btn"
          disabled={current >= totalPages}
          onClick={() => handlePageChange(current + 1)}
          title="Next page"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
