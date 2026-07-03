export type SubscriptionPlanStatus = "active" | "inactive";

export type SubscriptionPlanMetricDto = {
  label: string;
  value: number;
};

export type SubscriptionPlanDto = {
  id: string;
  name: string;
  value: string;
  price: string;
  owners: number;
  activeOwners: number;
  stores: number;
  activeContracts: number;
  contractAmount: number;
  status: SubscriptionPlanStatus;
  description: string;
  features: string[];
};

export type CreateSubscriptionPlanDto = {
  name: string;
  value: string;
  price: string;
  description: string;
  status: SubscriptionPlanStatus;
  features: string[];
};

export type UpdateSubscriptionPlanDto = Partial<CreateSubscriptionPlanDto>;

export type SubscriptionPlansOverviewDto = {
  metrics: SubscriptionPlanMetricDto[];
  plans: SubscriptionPlanDto[];
  contractAmountByPlan: Record<string, number>;
};
