import { create } from "zustand";
import type { DataTableState } from "@/components/common/data-table";

type EmployeeTableState = DataTableState & {
  setTableState: (state: DataTableState) => void;
};

export const useEmployeeTableStore = create<EmployeeTableState>((set) => ({
  page: 1,
  limit: 10,
  search: "",
  filters: {},
  setTableState: (state) => set(state)
}));
