import React from 'react';
import { FixedSizeList } from 'react-window';

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: unknown, item: T) => React.ReactNode;
  }>;
  height: number;
  rowHeight: number;
}

const VirtualizedTable = <T extends Record<string, any>>({
  data,
  columns,
  height,
  rowHeight,
}: VirtualizedTableProps<T>) => {
  const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: { data: T[]; columns: typeof columns } }) => {
    const item = data.data[index];
    const columns = data.columns;
    return (
      <div style={style} className="flex border-b border-gray-200">
        {columns.map((column) => (
          <div key={String(column.key)} className="flex-1 px-4 py-2">
            {column.render
              ? column.render(item[column.key], item)
              : String(item[column.key] || '')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <div key={String(column.key)} className="flex-1 px-4 py-3 font-medium text-gray-900">
            {column.label}
          </div>
        ))}
      </div>
      {/* Virtualized Rows */}
      <FixedSizeList
        height={height}
        itemCount={data.length}
        itemSize={rowHeight}
        width={"100%"}
        itemData={{ data, columns }}
      >
        {/* @ts-ignore: Suppress type error for child function */}
        {Row as any}
      </FixedSizeList>
    </div>
  );
};

export default VirtualizedTable;
