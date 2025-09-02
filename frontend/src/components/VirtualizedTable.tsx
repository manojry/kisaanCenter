import React from 'react';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: unknown, item: T) => React.ReactNode;
  }>;
  height?: number;
  maxHeight?: string;
}

const VirtualizedTable = <T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  maxHeight = '400px',
}: VirtualizedTableProps<T>) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        {columns.map((column) => (
          <div key={String(column.key)} className="flex-1 px-4 py-3 font-medium text-gray-900">
            {column.label}
          </div>
        ))}
      </div>
      
      {/* Scrollable Table Body */}
      <div 
        className="overflow-y-auto" 
        style={{ 
          maxHeight: maxHeight,
          height: typeof height === 'number' ? `${height}px` : height 
        }}
      >
        {data.map((item, index) => (
          <div key={index} className="flex border-b border-gray-200 hover:bg-gray-50">
            {columns.map((column) => (
              <div key={String(column.key)} className="flex-1 px-4 py-2">
                {column.render
                  ? column.render(item[column.key], item)
                  : String(item[column.key] || '')}
              </div>
            ))}
          </div>
        ))}
        
        {/* Empty state */}
        {data.length === 0 && (
          <div className="flex justify-center items-center py-8 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedTable;
