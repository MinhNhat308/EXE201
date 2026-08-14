import { SettingsPanel } from "@/modules/settings/components/settings-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Cài đặt</h1>
        <p className="text-muted-foreground">Quản trị hồ sơ, bảo mật và cấu hình hệ thống.</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
