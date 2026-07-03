'use client';

import { useReportViewMode } from '@/views/store/reports/ReportViewContext';

type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  caption?: string;
  rowKey: (row: T, idx: number) => string;
};

export function ReportDataTable<T>({
  columns,
  rows,
  emptyMessage = 'Không có dữ liệu',
  caption,
  rowKey,
}: Props<T>) {
  const mode = useReportViewMode();
  const isDocument = mode === 'document';

  if (rows.length === 0) {
    return (
      <div
        className={
          isDocument
            ? 'border border-stone-300 py-8 text-center text-sm text-stone-500'
            : 'rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-16 text-center text-sm text-stone-400'
        }
      >
        {emptyMessage}
      </div>
    );
  }

  if (isDocument) {
    return (
      <figure className="report-table-figure">
        {caption && (
          <figcaption className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-700">
            {caption}
          </figcaption>
        )}
        <table className="report-table w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="report-th w-10 text-center">STT</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`report-th ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={rowKey(row, idx)} className="report-tr">
                <td className="report-td text-center text-stone-500">{idx + 1}</td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`report-td ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[10px] text-stone-500">Tổng cộng: {rows.length} dòng</p>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {caption && (
        <figcaption className="border-b border-stone-100 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase text-stone-500">
          {caption}
        </figcaption>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className="border-t border-stone-100 hover:bg-stone-50/80"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-400">
        {rows.length} dòng
      </p>
    </figure>
  );
}
