import { RestClient } from "@/lib/api/rest-client";
import type { CreateLicenseDto, LicenseDto, UpdateLicenseDto } from "@/modules/licenses/types/license.types";

export const licenseApi = new RestClient<LicenseDto, CreateLicenseDto, UpdateLicenseDto>("/licenses");
