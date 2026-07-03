export type DashboardMetricDto = {
  key: "owners" | "stores" | "employees" | "contractsExpiringSoon";
  label: string;
  value: number;
  detail: string;
};

export type RegistrationTrendDto = {
  month: string;
  owners: number;
  stores: number;
};

export type PlanOverviewDto = {
  label: string;
  value: number;
};

export type SystemActivityDto = {
  id: string;
  activity: string;
  user: string;
  target: string;
  status: string;
  createdAt: string;
};

export type RevenuePointDto = {
  month: string;
  amount: number;
};

export type RevenueOverviewDto = {
  monthlyRevenue: number;
  activeSubscriptions: number;
  growthRate: number;
  points: RevenuePointDto[];
};

export type SystemHealthDto = {
  api: string;
  database: string;
  server: string;
};

export type DashboardOverviewDto = {
  metrics: DashboardMetricDto[];
  registrationTrends: RegistrationTrendDto[];
  planOverview: PlanOverviewDto[];
  recentActivities: SystemActivityDto[];
  revenue: RevenueOverviewDto;
  health: SystemHealthDto;
};
