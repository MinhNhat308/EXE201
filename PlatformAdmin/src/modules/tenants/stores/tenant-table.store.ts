import { create } from "zustand";
import type { DataTableState } from "@/components/common/data-table";

type TenantTableState = DataTableState & {
  setTableState: (state: DataTableState) => void;
};

export const useTenantTableStore = create<TenantTableState>((set) => ({
  page: 1,
  limit: 10,
  search: "",
  filters: {},
  setTableState: (state) => set(state)
}));
