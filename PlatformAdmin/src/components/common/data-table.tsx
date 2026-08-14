"use client";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { SearchFilter, type FilterOption } from "@/components/common/search-filter";
import type { SortDirection } from "@/types/api";

export type DataTableState = {
  page: number;
  limit: number;
  search: string;
  sortBy?: string;
  sortOrder?: SortDirection;
  filters: Record<string, string>;
};

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalPages: number;
  state: DataTableState;
  filterOptions?: FilterOption[];
  isLoading?: boolean;
  onStateChange: (state: DataTableState) => void;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  totalPages,
  state,
  filterOptions,
  isLoading,
  onStateChange
}: DataTableProps<TData, TValue>) {
  const sorting: SortingState = state.sortBy
    ? [{ id: state.sortBy, desc: state.sortOrder === "desc" }]
    : [];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      const firstSort = nextSorting[0];
      onStateChange({
        ...state,
        page: 1,
        sortBy: firstSort?.id,
        sortOrder: firstSort ? (firstSort.desc ? "desc" : "asc") : undefined
      });
    }
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-stone-900">Nội dung chính</h2>
        <p className="mt-1 text-xs text-stone-500">Filter, bảng dữ liệu hoặc workflow nằm ở đây.</p>
      </div>
      <div className="space-y-4 p-5">
        <SearchFilter
          search={state.search}
          filters={state.filters}
          filterOptions={filterOptions}
          onSearchChange={(search) => onStateChange({ ...state, page: 1, search })}
          onFilterChange={(key, value) =>
            onStateChange({ ...state, page: 1, filters: { ...state.filters, [key]: value } })
          }
        />
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="inline-flex max-w-full items-center gap-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getIsSorted() === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : null}
                          {header.column.getIsSorted() === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : null}
                          {!header.column.getIsSorted() ? <ChevronsUpDown className="h-3.5 w-3.5" /> : null}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-stone-500" colSpan={columns.length}>
                    Loading...
                  </td>
                </tr>
              ) : null}
              {!isLoading && data.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-stone-500" colSpan={columns.length}>
                    No records found.
                  </td>
                </tr>
              ) : null}
              {!isLoading
                ? table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-stone-100">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-4 align-middle text-stone-800">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
                : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={state.page}
          totalPages={totalPages}
          onPageChange={(page) => onStateChange({ ...state, page })}
        />
      </div>
    </section>
  );
}
