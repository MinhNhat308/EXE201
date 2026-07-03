import { cn } from "@/lib/utils/cn";

const statusClasses: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  inactive: "bg-slate-100 text-slate-700",
  pending: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
  suspended: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
  processing: "bg-orange-100 text-orange-700"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-20 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        statusClasses[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {status}
    </span>
  );
}
