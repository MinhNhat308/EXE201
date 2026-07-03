import { StatusBadge } from "@/components/common/status-badge";
import type { SystemActivityDto } from "@/modules/dashboard/types/dashboard.types";

export function ActivityTable({ activities }: { activities: SystemActivityDto[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Mô tả hoạt động</th>
            <th className="px-4 py-3 text-left">Đối tượng</th>
            <th className="px-4 py-3 text-left">Thời gian</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id} className="border-t">
              <td className="px-4 py-4 font-semibold">{activity.activity}</td>
              <td className="px-4 py-4 text-primary">{activity.target}</td>
              <td className="px-4 py-4">{activity.createdAt}</td>
              <td className="px-4 py-4"><StatusBadge status={activity.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
