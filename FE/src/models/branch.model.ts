export interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface BranchSummary {
  count: number;
  maxBranches: number;
  branches: Pick<Branch, 'id' | 'code' | 'name' | 'isDefault'>[];
}

export interface ChainReportBundle {
  meta: {
    date: string;
    workShift?: string;
    generatedAt: string;
    storeName?: string;
    branchCount?: number;
  };
  branches: {
    branchId: string;
    code: string;
    name: string;
    orderCount: number;
    revenue: number;
    completedCount: number;
    paidCount: number;
    cancelledCount: number;
  }[];
  totals: {
    orderCount: number;
    revenue: number;
    completedCount: number;
    paidCount: number;
    cancelledCount: number;
  };
}
