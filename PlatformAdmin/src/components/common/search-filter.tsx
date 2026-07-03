"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type FilterOption = {
  key: string;
  label: string;
  options: { label: string; value: string }[];
};

type SearchFilterProps = {
  search: string;
  filters: Record<string, string>;
  filterOptions?: FilterOption[];
  onSearchChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
};

export function SearchFilter({
  search,
  filters,
  filterOptions = [],
  onSearchChange,
  onFilterChange
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative md:max-w-md md:flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search..."
          className="pl-9"
        />
      </div>
      {filterOptions.map((filter) => (
        <Select
          key={filter.key}
          value={filters[filter.key] ?? ""}
          onChange={(event) => onFilterChange(filter.key, event.target.value)}
          className="md:w-48"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ))}
      <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground md:block" />
    </div>
  );
}
