import { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyField?: keyof T;
}

export default function DataTable<T extends { id?: unknown }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'لا توجد بيانات',
  keyField = 'id' as keyof T,
}: Props<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            {columns.map((col, i) => (
              <th key={i} className={`text-right text-zinc-400 font-medium py-3 px-4 ${col.width || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-zinc-500 py-12">{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={String((row as Record<string, unknown>)[keyField as string] ?? i)} className="table-row">
                {columns.map((col, j) => (
                  <td key={j} className="py-3 px-4 text-zinc-200">
                    {col.render
                      ? col.render(row)
                      : col.accessor
                      ? String((row as Record<string, unknown>)[col.accessor as string] ?? '-')
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
