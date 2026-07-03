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
    <div className="space-y-4">
      <SearchFilter
        search={state.search}
        filters={state.filters}
        filterOptions={filterOptions}
        onSearchChange={(search) => onStateChange({ ...state, page: 1, search })}
        onFilterChange={(key, value) =>
          onStateChange({ ...state, page: 1, filters: { ...state.filters, [key]: value } })
        }
      />
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-semibold">
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
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columns.length}>
                  Loading...
                </td>
              </tr>
            ) : null}
            {!isLoading && data.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={columns.length}>
                  No records found.
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 align-middle">
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
  );
}
