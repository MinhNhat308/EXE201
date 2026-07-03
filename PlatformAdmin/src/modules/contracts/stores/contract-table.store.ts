import { create } from "zustand";
import type { DataTableState } from "@/components/common/data-table";

type ContractTableState = DataTableState & {
  setTableState: (state: DataTableState) => void;
};

export const useContractTableStore = create<ContractTableState>((set) => ({
  page: 1,
  limit: 10,
  search: "",
  filters: {},
  setTableState: (state) => set(state)
}));
