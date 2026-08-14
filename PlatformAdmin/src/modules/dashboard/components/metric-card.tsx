import { Card, CardContent } from "@/components/ui/card";
import type { DashboardMetricDto } from "@/modules/dashboard/types/dashboard.types";

export function MetricCard({ metric }: { metric: DashboardMetricDto }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
        <p className="text-2xl font-bold text-stone-900">{metric.value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{metric.detail}</p>
      </CardContent>
    </Card>
  );
}
