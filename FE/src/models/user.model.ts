import type { SubscriptionInfo, TenantInfo } from './tenant.model';



export enum Role {

  ADMIN = 'ADMIN',

  STAFF = 'STAFF',

  KITCHEN = 'KITCHEN',

  WAREHOUSE = 'WAREHOUSE',

  ACCOUNTING = 'ACCOUNTING',

  STORE_MANAGER = 'STORE_MANAGER',

}



export const ROLE_LABELS: Record<Role, string> = {

  [Role.ADMIN]: 'Chủ cửa hàng (Owner)',

  [Role.STAFF]: 'Nhân viên bán hàng',

  [Role.KITCHEN]: 'Bếp',

  [Role.WAREHOUSE]: 'Nhân viên kho',

  [Role.ACCOUNTING]: 'Kế toán',

  [Role.STORE_MANAGER]: 'Quản lý cửa hàng',

};



export interface User {

  id: string;

  fullName: string;

  email: string;

  username?: string;

  tenantId?: string;

  role: Role;

  phone?: string;

  address?: string;

  isActive?: boolean;

  branchId?: string;

  createdAt?: string;

  updatedAt?: string;

}



export interface AuthResponse {

  accessToken: string;

  user: User;

  tenant: TenantInfo;

  subscription: SubscriptionInfo;

  trialDaysLeft: number;

  plan: string;

  status: string;

}



export interface LoginPayload {

  identifier: string;

  password: string;

  storeSlug?: string;

}



export interface CreateEmployeePayload {

  fullName: string;

  email: string;

  username?: string;

  password: string;

  role: Role;

  phone?: string;

  address?: string;

}



export const DASHBOARD_ROUTES: Record<Role, string> = {

  [Role.ADMIN]: '/dashboard/admin',

  [Role.STAFF]: '/dashboard/staff',

  [Role.KITCHEN]: '/dashboard/kitchen',

  [Role.WAREHOUSE]: '/dashboard/warehouse',

  [Role.ACCOUNTING]: '/dashboard/accounting',

  [Role.STORE_MANAGER]: '/dashboard/manager',

};



export const REGISTERABLE_ROLES: Role[] = [

  Role.STAFF,

  Role.KITCHEN,

  Role.WAREHOUSE,

  Role.ACCOUNTING,

  Role.STORE_MANAGER,

];


