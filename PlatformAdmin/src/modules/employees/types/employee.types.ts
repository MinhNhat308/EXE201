export type EmployeeStatus = "active" | "inactive" | "pending";

export type EmployeeDto = {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  lastLoginAt?: string;
  createdAt: string;
};

export type CreateEmployeeDto = {
  tenantId: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
};

export type UpdateEmployeeDto = Partial<CreateEmployeeDto> & {
  status?: EmployeeStatus;
};
