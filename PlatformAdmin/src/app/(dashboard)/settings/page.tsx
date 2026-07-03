import { SettingsPanel } from "@/modules/settings/components/settings-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Cài đặt</h1>
        <p className="text-muted-foreground">Quản trị hồ sơ, bảo mật và cấu hình hệ thống.</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
