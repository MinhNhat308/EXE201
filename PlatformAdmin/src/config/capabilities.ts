const bridgeMode = process.env.NEXT_PUBLIC_BOBAPOS_BRIDGE !== "false";

export const platformCapabilities = {
  bridgeMode,
  canCreateTenant: !bridgeMode,
  canManageEmployees: !bridgeMode,
  canManageBillingRecords: !bridgeMode,
  canManagePlans: !bridgeMode,
  licensesEnabled: !bridgeMode,
  tenantRemovalMode: bridgeMode ? "suspend" : "delete"
} as const;
