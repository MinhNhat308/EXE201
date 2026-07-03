import { create } from "zustand";

type SettingsState = {
  activeTab: "profile" | "security";
  setActiveTab: (activeTab: "profile" | "security") => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  activeTab: "profile",
  setActiveTab: (activeTab) => set({ activeTab })
}));
