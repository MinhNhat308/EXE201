"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href="/settings">
          <ArrowLeft className="h-4 w-4" />
          Quay lại Settings
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Hỗ trợ</h1>
        <p className="text-muted-foreground">Liên hệ đội ngũ BOBAPOS nếu bạn cần trợ giúp về hệ thống.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email hỗ trợ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Gửi yêu cầu hỗ trợ tới: <strong>support@bobapos.io</strong></p>
            <p>Thời gian phản hồi: 24 giờ làm việc.</p>
            <a
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
              href="mailto:support@bobapos.io"
            >
              Gửi email
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Tài liệu & FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Hướng dẫn quản trị owner, cửa hàng, hợp đồng và nhân viên.</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Quản lý owner và gói dịch vụ</li>
              <li>Tạo hợp đồng SaaS / Franchise</li>
              <li>Phân quyền nhân viên theo cửa hàng</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
