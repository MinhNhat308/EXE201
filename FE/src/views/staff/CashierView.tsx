'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MenuController,
  OrderController,
  PaymentMethodController,
} from '@/controllers/order.controller';
import { getStoredTenant, getStoredUser } from '@/lib/auth-storage';
import { canAccessRole, isStoreOwner } from '@/lib/role-access';
import {
  isSoloOperatingPlan,
  SOLO_HUB_PATH,
  SOLO_SALES_PATH,
  SOLO_SETTINGS_PATH,
  STORE_CASHIER_ORDERS_PATH,
  STORE_CHECK_IN_PATH,
} from '@/lib/workspace-routes';
import {
  buildCartLine,
  cartSubtotal,
  findMatchingLine,
} from '@/lib/cart';
import { formatCurrency } from '@/lib/format';
import { resolveStaffSession, endStaffSessionRemote } from '@/lib/staff-session-storage';
import { CartItem, MenuItem, Topping } from '@/models/menu.model';
import { Order } from '@/models/order.model';
import { PaymentOption } from '@/views/staff/CheckoutModal';
import {
  WORK_ROLE_LABELS,
  WORK_SHIFT_LABELS,
  WorkRole,
} from '@/models/staff.model';
import { BRAND } from '@/lib/brand';
import { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';
import { PosShellLayout } from '@/views/components/PosShellLayout';
import { InventoryController } from '@/controllers/inventory.controller';
import { InvoicePreview } from '@/views/staff/InvoicePreview';
import { CashierMenuStep } from '@/views/staff/CashierMenuStep';
import { ToppingModal } from '@/views/staff/ToppingModal';
import { SugarIceModal } from '@/views/staff/SugarIceModal';
import { CheckoutModal } from '@/views/staff/CheckoutModal';
import { posSugarIceEnabled, resolveIceLevels, resolveSugarLevels } from '@/lib/sugar-ice';

type CashierStep = 'menu' | 'invoice' | 'confirm';

function buildSteps(soloMode: boolean): { key: CashierStep; label: string }[] {
  if (soloMode) {
    return [
      { key: 'menu', label: 'Chọn món' },
      { key: 'invoice', label: 'Thanh toán' },
      { key: 'confirm', label: 'Xong' },
    ];
  }
  return [
    { key: 'menu', label: 'Chọn món' },
    { key: 'invoice', label: 'Hóa đơn' },
    { key: 'confirm', label: 'Hoàn tất' },
  ];
}

function cartToOrderItems(cart: CartItem[]) {
  return cart.map((c) => ({
    menuItemId: c.menuItemId,
    name: c.name,
    basePrice: c.basePrice,
    toppings: c.toppings,
    price: c.price,
    quantity: c.quantity,
    note: c.note,
    sugarPercent: c.sugarPercent,
    icePercent: c.icePercent,
  }));
}

export function CashierView({ solo = false }: { solo?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session] = useState(() => resolveStaffSession(WorkRole.CASHIER));
  const [step, setStep] = useState<CashierStep>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [toppingItem, setToppingItem] = useState<MenuItem | null>(null);
  const [sugarIcePending, setSugarIcePending] = useState<{
    item: MenuItem;
    toppings: Topping[];
  } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<{ count: number; items: { name: string }[] } | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentOption[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLabel, setPaymentLabel] = useState('');
  const [bankTransferDetails, setBankTransferDetails] = useState<{
    qrImageUrl?: string;
    bankAccountInfo?: string;
  }>({});

  useEffect(() => {
    if (paymentMethod !== 'BANK_TRANSFER') {
      setBankTransferDetails({});
      return;
    }
    let cancelled = false;
    void PaymentMethodController.getByCode('BANK_TRANSFER').then((d) => {
      if (!cancelled && d) {
        setBankTransferDetails({
          qrImageUrl: d.qrImageUrl,
          bankAccountInfo: d.bankAccountInfo,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [paymentMethod]);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || !canAccessRole(stored.role, Role.STAFF)) {
      router.replace('/login');
      return;
    }
    if (!session || session.workRole !== WorkRole.CASHIER) {
      if (!isStoreOwner(stored.role)) {
        router.replace(STORE_CHECK_IN_PATH);
      }
      return;
    }
    setUser((prev) => {
      if (prev && prev.email === stored.email) return prev;
      return stored;
    });

    const tenantInfo = getStoredTenant<TenantInfo>();
    const isSoloPlan = solo || isSoloOperatingPlan(tenantInfo);
    const trackInventory = tenantInfo?.settings?.trackInventory !== false;

    Promise.all([
      MenuController.getItems(),
      PaymentMethodController.getActive(),
      !isSoloPlan && trackInventory
        ? InventoryController.getPosAlerts().catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([menu, payments, alerts]) => {
        setMenuItems(menu);
        setPaymentMethods(payments);
        if (alerts && alerts.count > 0) setStockAlerts(alerts);
        if (payments.length > 0) {
          setPaymentMethod(payments[0].code);
          setPaymentLabel(payments[0].label);
        }
      })
      .catch(() => setError('Không tải được dữ liệu'))
      .finally(() => setLoadingMenu(false));
  }, [router, session, solo]);

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);

  const bankQrProps =
    paymentMethod === 'BANK_TRANSFER'
      ? {
          paymentQrImageUrl: bankTransferDetails.qrImageUrl,
          paymentBankInfo: bankTransferDetails.bankAccountInfo,
        }
      : {};

  const confirmedBankQr =
    confirmedOrder?.paymentMethod === 'BANK_TRANSFER'
      ? {
          paymentQrImageUrl: bankTransferDetails.qrImageUrl,
          paymentBankInfo: bankTransferDetails.bankAccountInfo,
        }
      : {};

  const tenant = getStoredTenant<TenantInfo>();
  const soloMode = solo || isSoloOperatingPlan(tenant);
  const sugarIceOpts = posSugarIceEnabled(tenant);
  const sugarLevels = resolveSugarLevels(tenant);
  const iceLevels = resolveIceLevels(tenant);
  const needsSugarIceStep = sugarIceOpts.any;

  const queueSugarIceOrAdd = (item: MenuItem, toppings: Topping[]) => {
    if (needsSugarIceStep) {
      setSugarIcePending({ item, toppings });
      setToppingItem(null);
      return;
    }
    addWithToppings(item, toppings, 100, 100);
  };

  const handleSelectItem = (item: MenuItem) => {
    const hasToppings = (item.toppings?.length ?? 0) > 0;
    if (!hasToppings) {
      queueSugarIceOrAdd(item, []);
      return;
    }
    setToppingItem(item);
  };

  const addWithToppings = (
    item: MenuItem,
    toppings: Topping[],
    sugarPercent = 100,
    icePercent = 100,
  ) => {
    setCart((prev) => {
      const existing = findMatchingLine(prev, item.id, toppings, sugarPercent, icePercent);
      if (existing) {
        return prev.map((c) =>
          c.cartLineId === existing.cartLineId
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [...prev, buildCartLine(item, toppings, 1, sugarPercent, icePercent)];
    });
    setToppingItem(null);
    setSugarIcePending(null);
  };

  const updateQty = (cartLineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartLineId === cartLineId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const handlePrint = () => window.print();

  const handleConfirm = async () => {
    if (!session || !user) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        items: cartToOrderItems(cart),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        tableNumber: tableNumber || undefined,
        note: note || undefined,
        paymentMethod,
        workShift: session.workShift,
        subtotal,
        total: subtotal,
        branchId: user.branchId,
      };

      const order = await OrderController.create(payload);

      if (soloMode) {
        router.push(`${SOLO_SALES_PATH}?order=${order.id}`);
        return;
      }

      setConfirmedOrder(order);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác nhận thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setNote('');
    if (paymentMethods[0]) {
      setPaymentMethod(paymentMethods[0].code);
      setPaymentLabel(paymentMethods[0].label);
    }
    setConfirmedOrder(null);
    setCheckoutOpen(false);
    setStep('menu');
  };

  const openCheckout = () => setCheckoutOpen(true);

  const proceedToInvoice = () => {
    setCheckoutOpen(false);
    setStep('invoice');
  };

  const goBack = () => {
    if (step === 'invoice') setStep('menu');
  };

  if (!user || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        Đang tải...
      </div>
    );
  }

  const steps = buildSteps(soloMode);
  const stepIndex = steps.findIndex((s) => s.key === step);
  const orderItems = cartToOrderItems(cart);
  const posQuickLinks = soloMode
    ? [{ href: SOLO_SALES_PATH, label: 'Hóa đơn', icon: '📋' }]
    : [
        { href: STORE_CASHIER_ORDERS_PATH, label: 'Hóa đơn', icon: '📋' },
      ];

  return (
    <PosShellLayout
      title="Quầy thu ngân"
      subtitle={
        soloMode
          ? 'Bán hàng'
          : `${WORK_ROLE_LABELS[WorkRole.CASHIER]} · ${WORK_SHIFT_LABELS[session.workShift]}`
      }
      quickLinks={posQuickLinks}
      settingsHref={soloMode ? SOLO_SETTINGS_PATH : undefined}
      hubHref={soloMode ? SOLO_HUB_PATH : undefined}
    >
    <div className={`min-h-full ${BRAND.pageBg} print:bg-white`}>
      <div className="border-b border-stone-200/80 bg-white/90 print:hidden">
        <div
          className={`mx-auto flex gap-2 px-4 py-3 ${step === 'menu' ? 'max-w-[100%]' : 'max-w-4xl'}`}
        >
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition ${
                i <= stepIndex
                  ? `${BRAND.primary} text-white shadow-sm`
                  : 'bg-stone-200/80 text-stone-500'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
        {!soloMode && (
          <div className="mx-auto flex justify-end px-4 pb-2 max-w-4xl">
            <button
              type="button"
              onClick={() => {
                void endStaffSessionRemote();
                router.push(STORE_CHECK_IN_PATH);
              }}
              className="text-xs text-stone-500 hover:text-[#2F80ED]"
            >
              Đổi ca / vai trò
            </button>
          </div>
        )}
      </div>

      <main
        className={`mx-auto px-4 py-4 print:hidden ${step === 'menu' ? 'max-w-[100%]' : 'max-w-4xl py-6'}`}
      >
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        )}

        {stockAlerts && stockAlerts.count > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              ⚠️ {stockAlerts.count} nguyên liệu sắp hết tại kho bếp
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {stockAlerts.items.map((i) => i.name).join(' · ')}
              {stockAlerts.count > stockAlerts.items.length ? ' · …' : ''}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Báo quản lý ca cấp phát NL hoặc bếp có thể không làm được món khi hết hàng.
            </p>
          </div>
        )}

        {step === 'menu' && (
          <CashierMenuStep
            menuItems={menuItems}
            loadingMenu={loadingMenu}
            cart={cart}
            subtotal={subtotal}
            onSelectItem={handleSelectItem}
            onUpdateQty={updateQty}
            onContinue={openCheckout}
          />
        )}

        {step === 'invoice' && (
          <div className="mx-auto max-w-md space-y-4">
            <InvoicePreview
              printable
              storeName={tenant?.storeName}
              items={orderItems}
              customerName={customerName}
              customerPhone={customerPhone}
              tableNumber={tableNumber}
              note={note}
              paymentMethod={paymentMethod}
              paymentMethodLabel={paymentLabel}
              {...bankQrProps}
              workShift={soloMode ? undefined : session.workShift}
              staffName={user.fullName}
              subtotal={subtotal}
              total={subtotal}
              createdAt={new Date().toISOString()}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium"
              >
                ← Sửa đơn
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${BRAND.primarySoft}`}
              >
                In hóa đơn
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {submitting ? '...' : soloMode ? 'Lưu & xem danh sách' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && confirmedOrder && (
          <div className="mx-auto max-w-md space-y-4 text-center">
            <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-100">
              <p className="text-4xl">✅</p>
              <h2 className="mt-2 text-xl font-bold text-emerald-800">
                {soloMode ? 'Đơn hoàn thành!' : 'Hoàn tất!'}
              </h2>
              <p className="mt-1 font-mono text-sm text-stone-600">
                {confirmedOrder.invoiceNumber}
              </p>
              <p className="mt-2 text-lg font-bold text-amber-700">
                {formatCurrency(confirmedOrder.total)}
              </p>
            </div>
            <InvoicePreview
              printable
              storeName={tenant?.storeName}
              invoiceNumber={confirmedOrder.invoiceNumber}
              orderNumber={confirmedOrder.orderNumber}
              items={confirmedOrder.items}
              customerName={confirmedOrder.customerName}
              customerPhone={confirmedOrder.customerPhone}
              tableNumber={confirmedOrder.tableNumber}
              note={confirmedOrder.note}
              paymentMethod={confirmedOrder.paymentMethod}
              {...confirmedBankQr}
              workShift={confirmedOrder.workShift}
              staffName={confirmedOrder.staffName}
              subtotal={confirmedOrder.subtotal}
              total={confirmedOrder.total}
              createdAt={confirmedOrder.createdAt}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 rounded-xl border border-amber-300 py-3 font-semibold text-amber-900"
              >
                In lại
              </button>
              <button
                type="button"
                onClick={handleNewOrder}
                className={`flex-1 rounded-xl py-3 font-bold text-white ${BRAND.primary}`}
              >
                + Đơn mới
              </button>
            </div>
          </div>
        )}
      </main>

      <ToppingModal
        item={toppingItem}
        onClose={() => setToppingItem(null)}
        onConfirm={(toppings) => {
          if (toppingItem) queueSugarIceOrAdd(toppingItem, toppings);
        }}
      />

      <SugarIceModal
        item={sugarIcePending?.item ?? null}
        toppings={sugarIcePending?.toppings ?? []}
        enableSugar={sugarIceOpts.sugar}
        enableIce={sugarIceOpts.ice}
        sugarLevels={sugarLevels}
        iceLevels={iceLevels}
        onClose={() => setSugarIcePending(null)}
        onConfirm={(sugarPercent, icePercent) => {
          if (sugarIcePending) {
            addWithToppings(
              sugarIcePending.item,
              sugarIcePending.toppings,
              sugarPercent,
              icePercent,
            );
          }
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        soloMode={soloMode}
        subtotal={subtotal}
        customerName={customerName}
        customerPhone={customerPhone}
        tableNumber={tableNumber}
        note={note}
        paymentMethod={paymentMethod}
        paymentOptions={paymentMethods}
        bankTransferDetails={bankTransferDetails}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onTableNumberChange={setTableNumber}
        onNoteChange={setNote}
        onPaymentMethodChange={(code) => {
          setPaymentMethod(code);
          const p = paymentMethods.find((x) => x.code === code);
          setPaymentLabel(p?.label ?? code);
        }}
        onSubmit={proceedToInvoice}
      />

      <div className="hidden print:block">
        {(step === 'invoice' || step === 'confirm') && (
          <InvoicePreview
            printable
            storeName={tenant?.storeName}
            invoiceNumber={confirmedOrder?.invoiceNumber}
            orderNumber={confirmedOrder?.orderNumber}
            items={confirmedOrder?.items ?? orderItems}
            customerName={customerName}
            customerPhone={customerPhone}
            tableNumber={tableNumber}
            note={note}
            paymentMethod={paymentMethod}
            {...bankQrProps}
            workShift={session.workShift}
            staffName={user.fullName}
            subtotal={subtotal}
            total={subtotal}
            createdAt={confirmedOrder?.createdAt ?? new Date().toISOString()}
          />
        )}
      </div>
    </div>
    </PosShellLayout>
  );
}
