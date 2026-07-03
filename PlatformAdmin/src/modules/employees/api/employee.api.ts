import { RestClient } from "@/lib/api/rest-client";
import type { CreateEmployeeDto, EmployeeDto, UpdateEmployeeDto } from "@/modules/employees/types/employee.types";

export const employeeApi = new RestClient<EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto>("/employees");
