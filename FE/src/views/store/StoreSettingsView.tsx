'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AdminPaymentController,
  PaymentMethodConfig,
} from '@/controllers/admin.controller';
import { AuthController } from '@/controllers/auth.controller';
import { getStoredTenant, updateStoredTenant } from '@/lib/auth-storage';
import { BRAND } from '@/lib/brand';
import {
  DEFAULT_ICE_LEVELS,
  DEFAULT_SUGAR_LEVELS,
  normalizePercentLevels,
} from '@/lib/sugar-ice';
import { ADMIN_PATH } from '@/lib/workspace-routes';
import { TenantInfo } from '@/models/tenant.model';
import { AdminLayout } from '@/views/admin/AdminLayout';

type Tab = 'shop' | 'pos' | 'invoice';

export function StoreSettingsView() {
  const [tab, setTab] = useState<Tab>('shop');
  const [, setTenant] = useState<TenantInfo | null>(null);
  const [storeName, setStoreName] = useState('');
  const [payments, setPayments] = useState<PaymentMethodConfig[]>([]);
  const [bankPayment, setBankPayment] = useState<PaymentMethodConfig | undefined>();
  const [qrUrl, setQrUrl] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [sugarLevels, setSugarLevels] = useState<number[]>(DEFAULT_SUGAR_LEVELS);
  const [iceLevels, setIceLevels] = useState<number[]>(DEFAULT_ICE_LEVELS);
  const [posSugar, setPosSugar] = useState(true);
  const [posIce, setPosIce] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);
  const [taxCode, setTaxCode] = useState('');
  const [invoiceTemplate, setInvoiceTemplate] = useState('');
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [vatRate, setVatRate] = useState(8);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass =
    'w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = getStoredTenant<TenantInfo>();
      setTenant(t);
      setStoreName(t?.storeName ?? '');
      setTrackInventory(t?.settings?.trackInventory !== false);
      setPosSugar(t?.settings?.posSugarChoiceEnabled !== false);
      setPosIce(t?.settings?.posIceChoiceEnabled !== false);
      setSugarLevels(normalizePercentLevels(t?.settings?.sugarLevels, DEFAULT_SUGAR_LEVELS));
      setIceLevels(normalizePercentLevels(t?.settings?.iceLevels, DEFAULT_ICE_LEVELS));
      setTaxCode(t?.settings?.taxCode ?? '');
      setInvoiceTemplate(t?.settings?.invoiceTemplate ?? '');
      setInvoiceSerial(t?.settings?.invoiceSerial ?? '');
      setVatRate(t?.settings?.vatRate ?? 8);
      setAddress(t?.settings?.address ?? '');
      setPhone(t?.settings?.phone ?? '');

      const pays = await AdminPaymentController.getAll();
      setPayments(pays);
      const bank = pays.find((p) => p.code === 'BANK_TRANSFER');
      setBankPayment(bank);
      if (bank) {
        const full = await AdminPaymentController.getOne(bank.id);
        setQrUrl(full.qrImageUrl ?? '');
        setBankInfo(full.bankAccountInfo ?? '');
      }
    } catch {
      setError('Không tải được cài đặt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStoreName = async (e: FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await AuthController.updateTenant({ storeName: storeName.trim() });
      const updated = res.tenant as unknown as TenantInfo;
      updateStoredTenant(updated);
      setTenant(updated);
      setMessage('Đã lưu tên quán');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleTrackInventory = async () => {
    setSaving(true);
    try {
      const next = !trackInventory;
      const res = await AuthController.updateTenant({ trackInventory: next });
      updateStoredTenant(res.tenant as unknown as TenantInfo);
      setTrackInventory(next);
      setMessage(next ? 'Đã bật quản lý kho' : 'Đã tắt quản lý kho');
    } catch {
      setError('Không cập nhật được');
    } finally {
      setSaving(false);
    }
  };

  const togglePayment = async (p: PaymentMethodConfig) => {
    try {
      await AdminPaymentController.update(p.id, { isActive: !p.isActive });
      await load();
      setMessage('Đã cập nhật thanh toán');
    } catch {
      setError('Không cập nhật được thanh toán');
    }
  };

  const saveBankQr = async (e: FormEvent) => {
    e.preventDefault();
    if (!bankPayment) return;
    setSaving(true);
    try {
      await AdminPaymentController.update(bankPayment.id, {
        qrImageUrl: qrUrl.trim() || undefined,
        bankAccountInfo: bankInfo.trim() || undefined,
      });
      setMessage('Đã lưu QR chuyển khoản');
    } catch {
      setError('Không lưu được QR');
    } finally {
      setSaving(false);
    }
  };

  const savePosLevels = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await AuthController.updateTenant({
        posSugarChoiceEnabled: posSugar,
        posIceChoiceEnabled: posIce,
        sugarLevels,
        iceLevels,
      });
      updateStoredTenant(res.tenant as unknown as TenantInfo);
      setMessage('Đã lưu cài đặt POS');
    } catch {
      setError('Không lưu được cài đặt POS');
    } finally {
      setSaving(false);
    }
  };

  const saveInvoiceConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await AuthController.updateTenant({
        taxCode: taxCode.trim() || undefined,
        invoiceTemplate: invoiceTemplate.trim() || undefined,
        invoiceSerial: invoiceSerial.trim() || undefined,
        vatRate,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      updateStoredTenant(res.tenant as unknown as TenantInfo);
      setMessage('Đã lưu cấu hình hóa đơn / HĐĐT');
    } catch {
      setError('Không lưu được cấu hình hóa đơn');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'shop', label: 'Quán & thanh toán' },
    { id: 'pos', label: 'POS — đường / đá' },
    { id: 'invoice', label: 'Hóa đơn / HĐĐT' },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Cài đặt cửa hàng</h1>
            <p className="mt-1 text-sm text-stone-500">
              Cấu hình quán Store — menu & nhân viên ở các mục riêng
            </p>
          </div>
          <Link href={ADMIN_PATH} className="text-sm text-stone-500 hover:text-[#2F80ED]">
            ← Hub
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { href: '/dashboard/admin/menu', label: 'Menu' },
            { href: '/dashboard/admin/employees', label: 'Nhân viên' },
            { href: '/dashboard/admin/reports', label: 'Báo cáo' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex gap-2 border-b border-stone-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'border-[#2F80ED] text-[#2F80ED]'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-stone-500">Đang tải...</p>
        ) : tab === 'shop' ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-bold text-stone-900">Quản lý kho</h2>
              <p className="mt-1 text-sm text-stone-500">
                Bật nếu trừ NVL theo công thức khi hoàn thành đơn.
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={toggleTrackInventory}
                className={`mt-4 rounded-full px-4 py-2 text-sm font-semibold ${
                  trackInventory ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {trackInventory ? 'Đang bật — tắt nếu chỉ cần hóa đơn' : 'Đang tắt — bật quản lý kho'}
              </button>
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-bold text-stone-900">Tên quán trên hóa đơn</h2>
              <form onSubmit={saveStoreName} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className={`flex-1 ${inputClass}`}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
                >
                  Lưu
                </button>
              </form>
            </section>

            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-bold text-stone-900">Hình thức thanh toán</h2>
              <ul className="mt-3 space-y-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                  >
                    <span className="text-sm font-medium">{p.label}</span>
                    <button
                      type="button"
                      onClick={() => togglePayment(p)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {p.isActive ? 'Đang dùng' : 'Tắt'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {bankPayment && (
              <section className="rounded-2xl border bg-white p-5">
                <h2 className="font-bold text-stone-900">QR chuyển khoản</h2>
                <form onSubmit={saveBankQr} className="mt-3 space-y-3">
                  <input
                    className={inputClass}
                    value={qrUrl.startsWith('data:') ? '(Ảnh đã lưu)' : qrUrl}
                    onChange={(e) => setQrUrl(e.target.value)}
                    placeholder="URL ảnh QR hoặc data URL"
                  />
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={bankInfo}
                    onChange={(e) => setBankInfo(e.target.value)}
                    placeholder="Thông tin TK: Ngân hàng · STK · Tên"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className={`rounded-xl px-5 py-2 text-sm font-bold text-white ${BRAND.primary}`}
                  >
                    Lưu QR
                  </button>
                </form>
              </section>
            )}
          </div>
        ) : tab === 'pos' ? (
          <form onSubmit={savePosLevels} className="mt-6 space-y-6">
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-bold text-stone-900">Hỏi đường / đá tại POS</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={posSugar} onChange={(e) => setPosSugar(e.target.checked)} />
                  Hỏi % đường
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={posIce} onChange={(e) => setPosIce(e.target.checked)} />
                  Hỏi % đá
                </label>
              </div>
              <p className="mt-3 text-xs text-stone-400">
                Mức % mặc định: {sugarLevels.join(', ')}% đường · {iceLevels.join(', ')}% đá
              </p>
            </section>
            <button
              type="submit"
              disabled={saving}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
            >
              Lưu cài đặt POS
            </button>
          </form>
        ) : (
          <form onSubmit={saveInvoiceConfig} className="mt-6 space-y-6">
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-bold text-stone-900">Hóa đơn điện tử & báo cáo thuế</h2>
              <p className="mt-1 text-sm text-stone-500">
                Dùng trên sổ HĐ bán hàng và tổng hợp thuế GTGT trong Trung tâm báo cáo.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Mã số thuế (MST)
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="0123456789"
                  />
                </label>
                <label className="block text-sm">
                  Thuế GTGT (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={`mt-1 ${inputClass}`}
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                  />
                </label>
                <label className="block text-sm">
                  Mẫu số HĐ
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={invoiceTemplate}
                    onChange={(e) => setInvoiceTemplate(e.target.value)}
                    placeholder="1C24TAA"
                  />
                </label>
                <label className="block text-sm">
                  Ký hiệu HĐ
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={invoiceSerial}
                    onChange={(e) => setInvoiceSerial(e.target.value)}
                    placeholder="AA/24E"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  Địa chỉ trên hóa đơn
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  SĐT
                  <input
                    className={`mt-1 ${inputClass}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className={`mt-4 rounded-xl px-5 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
              >
                Lưu cấu hình HĐĐT
              </button>
            </section>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
