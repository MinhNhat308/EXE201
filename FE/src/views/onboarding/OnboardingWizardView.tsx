'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { AuthController } from '@/controllers/auth.controller';
import { InventoryController } from '@/controllers/inventory.controller';
import {
  AdminMenuController,
  AdminPaymentController,
  PaymentMethodConfig,
} from '@/controllers/admin.controller';
import { getStoredTenant, getStoredUser, updateStoredTenant } from '@/lib/auth-storage';
import { BRAND, BRAND_COVER } from '@/lib/brand';
import { formatCurrency } from '@/lib/format';
import { needsOnboarding } from '@/lib/onboarding';
import { getPrimaryWorkspacePath } from '@/lib/workspace-routes';
import { MenuItem } from '@/models/menu.model';
import type { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';

type Step = 'welcome' | 'menu' | 'payment' | 'inventory' | 'done';

const STEPS: Step[] = ['welcome', 'menu', 'payment', 'inventory', 'done'];

const STEP_LABELS: Record<Step, string> = {
  welcome: 'Chào mừng',
  menu: 'Menu & giá',
  payment: 'Thanh toán',
  inventory: 'Kho & công thức',
  done: 'Sẵn sàng',
};

export function OnboardingWizardView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [payments, setPayments] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDish, setNewDish] = useState({ name: '', price: 35_000 });
  const [ingredientCount, setIngredientCount] = useState(0);
  const [recipeCount, setRecipeCount] = useState(0);

  const stepIndex = STEPS.indexOf(step);

  const loadMenu = useCallback(async () => {
    const items = await AdminMenuController.getAll();
    setMenuItems(items);
  }, []);

  useEffect(() => {
    const t = getStoredTenant<TenantInfo>();
    setTenant(t);
    const user = getStoredUser<User>();
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/login');
      return;
    }
    if (t && !needsOnboarding(t)) {
      router.replace(getPrimaryWorkspacePath(Role.ADMIN, t));
    }
  }, [router]);

  useEffect(() => {
    if (step === 'menu') {
      loadMenu().catch(() => setError('Không tải được menu'));
    }
    if (step === 'payment') {
      AdminPaymentController.getAll()
        .then(setPayments)
        .catch(() => setError('Không tải được hình thức thanh toán'));
    }
    if (step === 'inventory') {
      Promise.all([
        InventoryController.getIngredients(),
        InventoryController.getRecipes(),
      ])
        .then(([ings, recipes]) => {
          setIngredientCount(ings.length);
          setRecipeCount(recipes.length);
        })
        .catch(() => setError('Không tải được dữ liệu kho'));
    }
  }, [step, loadMenu]);

  const updateItemPrice = async (id: string, price: number) => {
    setLoading(true);
    setError('');
    try {
      await AdminMenuController.update(id, { price });
      await loadMenu();
    } catch {
      setError('Không lưu được giá món');
    } finally {
      setLoading(false);
    }
  };

  const addDish = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDish.name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await AdminMenuController.create({
        name: newDish.name.trim(),
        category: 'Trà sữa',
        price: newDish.price,
        isAvailable: true,
      });
      setNewDish({ name: '', price: 35_000 });
      await loadMenu();
    } catch {
      setError('Không thêm được món');
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = async (goTo?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await AuthController.completeOnboarding();
      updateStoredTenant(res.tenant);
      const tenant = getStoredTenant<TenantInfo>();
      const target =
        goTo ??
        getPrimaryWorkspacePath(Role.ADMIN, tenant);
      router.replace(target);
    } catch {
      setError('Không lưu được tiến trình — thử lại');
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none ${BRAND.focusBorder}`;

  return (
    <div className={`flex min-h-screen ${BRAND.pageBg}`}>
      <div
        className={`relative hidden w-[40%] flex-col justify-between overflow-hidden bg-gradient-to-br ${BRAND.headerGradient} p-10 text-white lg:flex`}
      >
        <div>
            <BrandLogo size={36} showName />
          <h1 className="mt-10 text-3xl font-extrabold leading-tight">
            Thiết lập cửa hàng
            <br />
            trong vài phút
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
            BOBAPOS đã tạo sẵn menu mẫu và hình thức thanh toán. Bạn chỉ cần chỉnh giá theo quán
            — rồi bán ly đầu tiên.
          </p>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-2xl ring-1 ring-white/20">
          <Image src={BRAND_COVER} alt="" fill className="object-cover" />
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-stone-200/80 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div className="lg:hidden">
              <BrandLogo size={32} showName />
            </div>
            <p className="text-sm text-stone-500">
              {tenant?.storeName ? (
                <>
                  <span className="font-medium text-stone-800">{tenant.storeName}</span>
                  <span className="mx-2 text-stone-300">·</span>
                </>
              ) : null}
              Bước {stepIndex + 1}/{STEPS.length}: {STEP_LABELS[step]}
            </p>
          </div>
          <div className="mx-auto mt-3 flex max-w-2xl gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i <= stepIndex ? 'bg-[#2F80ED]' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:px-8">
          <div className="w-full max-w-2xl">
            {step === 'welcome' && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900">
                  Chào {tenant?.storeName ? `cửa hàng ${tenant.storeName}` : 'bạn'}!
                </h2>
                <p className="mt-3 leading-relaxed text-stone-600">
                  Hệ thống đã chuẩn bị sẵn cho bạn:
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    '6 món trà sữa / cà phê mẫu (có ảnh) — chỉnh giá cho đúng quán',
                    'Topping & hình thức thanh toán (tiền mặt, chuyển khoản)',
                    'Kho nguyên liệu cơ bản — dùng sau khi quen POS',
                  ].map((text) => (
                    <li
                      key={text}
                      className="flex gap-3 rounded-xl border border-stone-200/80 bg-white p-4 text-sm text-stone-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2F80ED]/10 text-[#2F80ED]">
                        ✓
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-stone-500">
                  Chỉ mất khoảng <strong>3 phút</strong>. Không cần khám phá menu phức tạp.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('menu')}
                    className={`rounded-xl px-6 py-3 text-sm font-bold text-white ${BRAND.primary}`}
                  >
                    Bắt đầu thiết lập
                  </button>
                  <button
                    type="button"
                    onClick={() => finishOnboarding()}
                    className="rounded-xl border border-stone-200 px-6 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
                  >
                    Bỏ qua — vào POS
                  </button>
                </div>
              </div>
            )}

            {step === 'menu' && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Chỉnh giá menu</h2>
                <p className="mt-2 text-sm text-stone-500">
                  Sửa giá cho đúng quán bạn. Khách sẽ thấy các món này ở màn hình thu ngân.
                </p>

                <div className="mt-6 space-y-2">
                  {menuItems.map((item) => (
                    <MenuPriceRow
                      key={item.id}
                      item={item}
                      disabled={loading}
                      onSave={(price) => updateItemPrice(item.id, price)}
                    />
                  ))}
                  {menuItems.length === 0 && (
                    <p className="text-sm text-stone-500">Chưa có món — thêm món bên dưới.</p>
                  )}
                </div>

                <form onSubmit={addDish} className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-4">
                  <p className="text-sm font-semibold text-stone-800">Thêm món của quán (tuỳ chọn)</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className={`flex-1 ${inputClass}`}
                      placeholder="Tên món, VD: Trà sữa khoai môn"
                      value={newDish.name}
                      onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    />
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      className={`w-full sm:w-32 ${inputClass}`}
                      value={newDish.price}
                      onChange={(e) =>
                        setNewDish({ ...newDish, price: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                    <button
                      type="submit"
                      disabled={loading || !newDish.name.trim()}
                      className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${BRAND.primary}`}
                    >
                      Thêm
                    </button>
                  </div>
                </form>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('welcome')}
                    className="text-sm text-stone-500 hover:text-[#2F80ED]"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Hình thức thanh toán</h2>
                <p className="mt-2 text-sm text-stone-500">
                  Đã bật sẵn cho POS. Bạn có thể chỉnh thêm sau trong Cấu hình cửa hàng.
                </p>
                <ul className="mt-6 space-y-2">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3"
                    >
                      <span className="font-medium text-stone-800">{p.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {p.isActive ? 'Đang dùng' : 'Tắt'}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-stone-400">
                  Sau này:{' '}
                  <Link href="/dashboard/admin/payments" className="text-[#2F80ED] hover:underline">
                    Quản lý hình thức TT
                  </Link>
                </p>
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('menu')}
                    className="text-sm text-stone-500 hover:text-[#2F80ED]"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('inventory')}
                    className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            )}

            {step === 'inventory' && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Kho & công thức</h2>
                <p className="mt-2 text-sm text-stone-500">
                  Hệ thống đã tạo sẵn nguyên liệu và công thức mẫu. Bạn có thể chỉnh sau khi bán
                  thử vài đơn.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <p className="text-3xl font-bold text-stone-900">{ingredientCount}</p>
                    <p className="mt-1 text-sm font-medium text-stone-700">Nguyên liệu</p>
                    <p className="mt-2 text-xs text-stone-500">
                      Gợi ý HSD (ngày) giúp tự điền hạn dùng khi nhập NCC
                    </p>
                    <Link
                      href="/dashboard/admin/ingredients"
                      className="mt-3 inline-block text-sm font-medium text-[#2F80ED] hover:underline"
                    >
                      Quản lý nguyên liệu →
                    </Link>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <p className="text-3xl font-bold text-stone-900">{recipeCount}</p>
                    <p className="mt-1 text-sm font-medium text-stone-700">Công thức món</p>
                    <p className="mt-2 text-xs text-stone-500">
                      Bếp trừ kho KHO1 khi đơn chuyển READY
                    </p>
                    <Link
                      href="/dashboard/admin/recipes"
                      className="mt-3 inline-block text-sm font-medium text-[#2F80ED] hover:underline"
                    >
                      Xem công thức →
                    </Link>
                  </div>
                </div>
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="text-sm text-stone-500 hover:text-[#2F80ED]"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('done')}
                    className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
                  >
                    Tiếp theo
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  🎉
                </div>
                <h2 className="mt-6 text-2xl font-bold text-stone-900">Xong! Sẵn sàng bán hàng</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
                  Menu, thanh toán và kho mẫu đã sẵn sàng. Hãy thử bán <strong>1 đơn đầu tiên</strong>{' '}
                  — sau đó mở màn bếp để xem đơn chuyển sang bếp.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => finishOnboarding()}
                    className={`rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60 ${BRAND.primary}`}
                  >
                    Vào quầy bán hàng (POS)
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function MenuPriceRow({
  item,
  disabled,
  onSave,
}: {
  item: MenuItem;
  disabled: boolean;
  onSave: (price: number) => void;
}) {
  const [price, setPrice] = useState(item.price);
  const dirty = price !== item.price;

  useEffect(() => {
    setPrice(item.price);
  }, [item.price]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-stone-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{item.name}</p>
        <p className="text-xs text-stone-400">{item.category}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1000}
          step={1000}
          value={price}
          onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
          className={`w-28 rounded-lg border border-stone-200 px-3 py-2 text-sm ${BRAND.focusBorder}`}
        />
        <span className="text-xs text-stone-400">đ</span>
        {dirty ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSave(price)}
            className="rounded-lg bg-[#2F80ED] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Lưu
          </button>
        ) : (
          <span className="text-xs text-stone-400">{formatCurrency(item.price)}</span>
        )}
      </div>
    </div>
  );
}
