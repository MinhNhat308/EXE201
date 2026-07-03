'use client';

import { ReactNode } from 'react';
import { BRAND } from '@/lib/brand';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface AdminCrudTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  emptyText?: string;
}

export function AdminCrudTable<T extends { id: string }>({
  title,
  description,
  columns,
  data,
  loading,
  onAdd,
  addLabel = 'Thêm mới',
  emptyText = 'Chưa có dữ liệu',
}: AdminCrudTableProps<T>) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-stone-500">{description}</p>
          )}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className={BRAND.btnPrimary}
          >
            + {addLabel}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-stone-400">Đang tải...</p>
        ) : data.length === 0 ? (
          <p className="p-8 text-center text-stone-400">{emptyText}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-50 hover:bg-[#2F80ED]/5"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
