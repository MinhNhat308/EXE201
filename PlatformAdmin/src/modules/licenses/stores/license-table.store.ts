import { create } from "zustand";
import type { DataTableState } from "@/components/common/data-table";

type LicenseTableState = DataTableState & {
  setTableState: (state: DataTableState) => void;
};

export const useLicenseTableStore = create<LicenseTableState>((set) => ({
  page: 1,
  limit: 10,
  search: "",
  filters: {},
  setTableState: (state) => set(state)
}));
