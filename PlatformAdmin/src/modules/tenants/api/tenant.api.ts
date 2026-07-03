import { RestClient } from "@/lib/api/rest-client";
import type { CreateTenantDto, TenantDto, UpdateTenantDto } from "@/modules/tenants/types/tenant.types";

export const tenantApi = new RestClient<TenantDto, CreateTenantDto, UpdateTenantDto>("/tenants");
