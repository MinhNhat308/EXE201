'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import {
  AdminMenuController,
  AdminPaymentController,
  AdminToppingController,
  PaymentMethodConfig,
  ToppingConfig,
} from '@/controllers/admin.controller';
import { AuthController } from '@/controllers/auth.controller';
import { InventoryController } from '@/controllers/inventory.controller';
import { getStoredTenant, updateStoredTenant } from '@/lib/auth-storage';
import { BRAND } from '@/lib/brand';
import { formatCurrency } from '@/lib/format';
import { SOLO_HUB_PATH } from '@/lib/workspace-routes';
import {
  DEFAULT_ICE_LEVELS,
  DEFAULT_SUGAR_LEVELS,
  normalizePercentLevels,
} from '@/lib/sugar-ice';
import { Recipe, StockItem } from '@/models/inventory.model';
import { Ingredient } from '@/models/inventory.model';
import { IngredientCategory, INGREDIENT_CATEGORY_LABELS } from '@/models/ingredient-category.model';
import { MenuItem } from '@/models/menu.model';
import { TenantInfo } from '@/models/tenant.model';
import { SoloShellLayout } from './SoloShellLayout';

type SettingsTab = 'menu' | 'toppings' | 'recipes' | 'stock' | 'levels' | 'shop';

const ALL_TABS: { id: SettingsTab; label: string; icon: string; inventoryOnly?: boolean }[] = [
  { id: 'menu', label: 'Menu quán', icon: '🥤' },
  { id: 'toppings', label: 'Topping', icon: '🧋' },
  { id: 'recipes', label: 'Công thức', icon: '📐', inventoryOnly: true },
  { id: 'stock', label: 'Kho', icon: '📦', inventoryOnly: true },
  { id: 'levels', label: 'Định lượng', icon: '🍬', inventoryOnly: true },
  { id: 'shop', label: 'Quán & TT', icon: '🏪' },
];

function isTrackInventory(tenant: TenantInfo | null | undefined) {
  return tenant?.settings?.trackInventory !== false;
}

export function SoloSettingsView() {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>('menu');
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [storeName, setStoreName] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<ToppingConfig[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [payments, setPayments] = useState<PaymentMethodConfig[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStock, setLowStock] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [newDrink, setNewDrink] = useState({ name: '', category: 'Trà sữa', price: 35_000 });
  const [newTopping, setNewTopping] = useState({ name: '', price: 5_000 });
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    category: IngredientCategory.LIQUID as IngredientCategory,
    currentStock: 10_000,
    minStock: 2_000,
  });

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const t = getStoredTenant<TenantInfo>();
      const track = isTrackInventory(t);

      const [items, tops, pays] = await Promise.all([
        AdminMenuController.getAll(),
        AdminToppingController.getAll(),
        AdminPaymentController.getAll(),
      ]);

      let rcps: Recipe[] = [];
      let stock: StockItem[] = [];
      let ings: Ingredient[] = [];

      if (track) {
        [rcps, stock, ings] = await Promise.all([
          InventoryController.getRecipes(),
          InventoryController.getStock(),
          InventoryController.getIngredients(),
        ]);
      }

      setMenu(items);
      setToppings(tops);
      setRecipes(rcps);
      setPayments(pays);
      setStockItems(stock);
      setIngredients(ings);
      setLowStock(
        stock.filter((s) => s.isLow).map((s) => `${s.name} (${s.displayStock} ${s.displayUnit})`),
      );
      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.');
          router.replace('/login');
          return;
        }
        setError(err.message || 'Không tải được cài đặt');
      } else {
        setError('Không tải được cài đặt');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const t = getStoredTenant<TenantInfo>();
    setTenant(t);
    setStoreName(t?.storeName ?? '');
    void load();
  }, [load]);

  const trackInventory = isTrackInventory(tenant);
  const visibleTabs = ALL_TABS.filter((t) => !t.inventoryOnly || trackInventory);

  useEffect(() => {
    if (!trackInventory && (tab === 'recipes' || tab === 'stock' || tab === 'levels')) {
      setTab('menu');
    }
  }, [trackInventory, tab]);

  const saveTrackInventory = async (enabled: boolean) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await AuthController.updateTenant({ trackInventory: enabled });
      const updated = res.tenant as unknown as TenantInfo;
      updateStoredTenant(updated);
      setTenant(updated);
      setMessage(
        enabled
          ? 'Đã bật quản lý kho — bán xong sẽ trừ NVL theo công thức'
          : 'Chế độ chỉ hóa đơn — không trừ kho khi bán',
      );
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được cài đặt kho');
    } finally {
      setSaving(false);
    }
  };

  const savePosSugarIce = async (patch: {
    posSugarChoiceEnabled?: boolean;
    posIceChoiceEnabled?: boolean;
    sugarLevels?: number[];
    iceLevels?: number[];
  }) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = { ...patch };
      if (payload.sugarLevels) {
        payload.sugarLevels = normalizePercentLevels(payload.sugarLevels, DEFAULT_SUGAR_LEVELS);
      }
      if (payload.iceLevels) {
        payload.iceLevels = normalizePercentLevels(payload.iceLevels, DEFAULT_ICE_LEVELS);
      }
      const res = await AuthController.updateTenant(payload);
      const updated = res.tenant as unknown as TenantInfo;
      updateStoredTenant(updated);
      setTenant(updated);
      setMessage('Đã lưu định lượng đường · đá');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const adjustStock = async (item: StockItem, addAmount: number) => {
    if (!Number.isFinite(addAmount) || addAmount <= 0) return;
    setSaving(true);
    setError('');
    try {
      await InventoryController.updateWarehouseStock(item.warehouseId, item.id, {
        currentStock: item.currentStock + addAmount,
      });
      await load({ silent: true });
      setMessage(`Đã nhập thêm ${addAmount} ${item.displayUnit} ${item.name}`);
    } catch {
      setError('Không cập nhật được kho');
    } finally {
      setSaving(false);
    }
  };

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

  const updateMenuItem = async (id: string, patch: Partial<MenuItem> & { toppingIds?: string[] }) => {
    setSaving(true);
    setError('');
    try {
      await AdminMenuController.update(id, patch);
      await load({ silent: true });
      setMessage('Đã lưu menu');
    } catch {
      setError('Không lưu được menu');
    } finally {
      setSaving(false);
    }
  };

  const addDrink = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDrink.name.trim()) return;
    setSaving(true);
    try {
      const topIds = toppings.filter((t) => t.isActive).map((t) => t.id);
      await AdminMenuController.create({
        name: newDrink.name.trim(),
        category: newDrink.category,
        price: newDrink.price,
        isAvailable: true,
        toppingIds: newDrink.category === 'Cà phê' ? [] : topIds,
      });
      setNewDrink({ name: '', category: 'Trà sữa', price: 35_000 });
      await load({ silent: true });
      setMessage(
        trackInventory
          ? 'Đã thêm món mới — chỉnh công thức ở tab Công thức'
          : 'Đã thêm món mới',
      );
      if (trackInventory) setTab('recipes');
    } catch {
      setError('Không thêm được món');
    } finally {
      setSaving(false);
    }
  };

  const updateTopping = async (id: string, patch: Partial<ToppingConfig>) => {
    try {
      await AdminToppingController.update(id, patch);
      await load({ silent: true });
    } catch {
      setError('Không lưu được topping');
    }
  };

  const addTopping = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTopping.name.trim()) return;
    try {
      await AdminToppingController.create({
        name: newTopping.name.trim(),
        price: newTopping.price,
        isActive: true,
      });
      setNewTopping({ name: '', price: 5_000 });
      await load({ silent: true });
      setMessage('Đã thêm topping');
    } catch {
      setError('Không thêm được topping');
    }
  };

  const addIngredient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const name = newIngredient.name.trim();
      await InventoryController.createIngredient({
        name,
        category: newIngredient.category,
        currentStock: newIngredient.currentStock,
        minStock: newIngredient.minStock,
      });
      setNewIngredient({
        name: '',
        category: IngredientCategory.LIQUID,
        currentStock: 10_000,
        minStock: 2_000,
      });
      await load({ silent: true });
      setMessage(`Đã thêm NVL "${name}" — dùng trong tab Công thức`);
    } catch {
      setError('Không thêm được nguyên liệu');
    } finally {
      setSaving(false);
    }
  };

  const saveRecipeLines = async (
    menuItemId: string,
    lines: { ingredientId: string; quantity: number }[],
  ) => {
    if (lines.length === 0 || lines.some((l) => !l.ingredientId || l.quantity <= 0)) {
      setError('Công thức cần ít nhất 1 NVL với số lượng > 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await InventoryController.upsertRecipe(menuItemId, lines);
      await load({ silent: true });
      setMessage('Đã lưu công thức NVL');
    } catch {
      setError('Không lưu được công thức');
    } finally {
      setSaving(false);
    }
  };

  const togglePayment = async (p: PaymentMethodConfig) => {
    try {
      await AdminPaymentController.update(p.id, { isActive: !p.isActive });
      await load({ silent: true });
    } catch {
      setError('Không cập nhật được hình thức thanh toán');
    }
  };

  const saveBankQr = async (payload: { qrImageUrl?: string; bankAccountInfo?: string }) => {
    const bank = payments.find((p) => p.code === 'BANK_TRANSFER');
    if (!bank) {
      setError('Không tìm thấy hình thức Chuyển khoản');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await AdminPaymentController.update(bank.id, payload);
      await load({ silent: true });
      setMessage('Đã lưu QR chuyển khoản');
    } catch {
      setError('Không lưu được QR chuyển khoản');
    } finally {
      setSaving(false);
    }
  };

  const recipeFor = (menuItemId: string) => recipes.find((r) => r.menuItemId === menuItemId);

  const inputClass = `w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none ${BRAND.focusBorder}`;

  return (
    <SoloShellLayout title="Cài đặt quán" backHref={SOLO_HUB_PATH}>
      <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
        <p className="text-sm text-stone-500">
          {trackInventory
            ? 'Dữ liệu mẫu chỉ là điểm khởi đầu — bạn tự thêm/sửa món, NVL, công thức và nhập kho.'
            : 'Chế độ chỉ hóa đơn — bán hàng và xem doanh thu, không bắt buộc quản lý kho.'}
        </p>

        {message && (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {trackInventory && lowStock.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-semibold text-amber-900">⚠️ Nguyên liệu sắp hết</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              {lowStock.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex gap-1 overflow-x-auto rounded-2xl bg-stone-100 p-1">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                tab === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-stone-500">Đang tải...</p>
          ) : tab === 'menu' ? (
            <MenuTab
              menu={menu}
              toppings={toppings}
              saving={saving}
              newDrink={newDrink}
              inputClass={inputClass}
              onNewDrinkChange={setNewDrink}
              onAddDrink={addDrink}
              onUpdateMenu={updateMenuItem}
            />
          ) : tab === 'toppings' ? (
            <ToppingsTab
              toppings={toppings}
              newTopping={newTopping}
              inputClass={inputClass}
              onNewToppingChange={setNewTopping}
              onAddTopping={addTopping}
              onUpdateTopping={updateTopping}
            />
          ) : tab === 'recipes' ? (
            <RecipesTab
              menu={menu.filter((m) => m.isAvailable)}
              ingredients={ingredients}
              recipeFor={recipeFor}
              saving={saving}
              onSaveRecipeLines={saveRecipeLines}
            />
          ) : tab === 'stock' ? (
            <StockTab
              items={stockItems}
              saving={saving}
              newIngredient={newIngredient}
              inputClass={inputClass}
              onNewIngredientChange={setNewIngredient}
              onAddIngredient={addIngredient}
              onAdjustStock={adjustStock}
            />
          ) : tab === 'levels' ? (
            <LevelsTab
              tenant={tenant}
              saving={saving}
              inputClass={inputClass}
              onSave={savePosSugarIce}
            />
          ) : (
            <ShopTab
              storeName={storeName}
              tenant={tenant}
              trackInventory={trackInventory}
              payments={payments}
              bankPayment={payments.find((p) => p.code === 'BANK_TRANSFER')}
              saving={saving}
              inputClass={inputClass}
              onStoreNameChange={setStoreName}
              onSaveStoreName={saveStoreName}
              onTogglePayment={togglePayment}
              onToggleTrackInventory={saveTrackInventory}
              onSaveBankQr={saveBankQr}
            />
          )}
        </div>
      </main>
    </SoloShellLayout>
  );
}

function MenuTab({
  menu,
  toppings,
  saving,
  newDrink,
  inputClass,
  onNewDrinkChange,
  onAddDrink,
  onUpdateMenu,
}: {
  menu: MenuItem[];
  toppings: ToppingConfig[];
  saving: boolean;
  newDrink: { name: string; category: string; price: number };
  inputClass: string;
  onNewDrinkChange: (v: typeof newDrink) => void;
  onAddDrink: (e: FormEvent) => void;
  onUpdateMenu: (id: string, patch: Partial<MenuItem> & { toppingIds?: string[] }) => void;
}) {
  const categories = ['Trà sữa', 'Trà trái cây', 'Kem cheese', 'Cacao', 'Cà phê'];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">Món đang bán</h2>
        <p className="mt-1 text-sm text-stone-500">
          Món mẫu có thể tắt hoặc đổi giá. Cuộn xuống để <strong>thêm món của quán bạn</strong>.
        </p>
        <ul className="mt-4 space-y-3">
          {menu.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-stone-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{item.name}</p>
                  <p className="text-xs text-stone-400">{item.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateMenu(item.id, { isAvailable: !item.isAvailable })}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {item.isAvailable ? 'Đang bán' : 'Đã tắt'}
                </button>
              </div>
              <MenuPriceEditor
                price={item.price}
                disabled={saving}
                onSave={(price) => onUpdateMenu(item.id, { price })}
              />
              {item.category !== 'Cà phê' && toppings.length > 0 && (
                <ToppingPicker
                  toppings={toppings}
                  selectedIds={item.toppingIds ?? []}
                  onSave={(toppingIds) => onUpdateMenu(item.id, { toppingIds })}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-[#2F80ED]/40 bg-white p-5">
        <h2 className="font-bold text-stone-900">Thêm món mới</h2>
        <form onSubmit={onAddDrink} className="mt-3 space-y-3">
          <input
            className={inputClass}
            placeholder="Tên món, VD: Trà sữa khoai môn"
            value={newDrink.name}
            onChange={(e) => onNewDrinkChange({ ...newDrink, name: e.target.value })}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className={inputClass}
              value={newDrink.category}
              onChange={(e) => onNewDrinkChange({ ...newDrink, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1000}
              step={1000}
              className={`sm:w-36 ${inputClass}`}
              value={newDrink.price}
              onChange={(e) =>
                onNewDrinkChange({ ...newDrink, price: parseInt(e.target.value, 10) || 0 })
              }
            />
            <button
              type="submit"
              disabled={saving || !newDrink.name.trim()}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${BRAND.primary}`}
            >
              Thêm món
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MenuPriceEditor({
  price,
  disabled,
  onSave,
}: {
  price: number;
  disabled: boolean;
  onSave: (p: number) => void;
}) {
  const [local, setLocal] = useState(price);
  useEffect(() => setLocal(price), [price]);
  const dirty = local !== price;

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="text-xs text-stone-500">Giá bán:</span>
      <input
        type="number"
        min={1000}
        step={1000}
        value={local}
        onChange={(e) => setLocal(parseInt(e.target.value, 10) || 0)}
        className="w-28 rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
      />
      <span className="text-xs text-stone-400">đ</span>
      {dirty ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(local)}
          className="rounded-lg bg-[#2F80ED] px-2.5 py-1 text-xs font-semibold text-white"
        >
          Lưu giá
        </button>
      ) : (
        <span className="text-xs text-stone-400">{formatCurrency(price)}</span>
      )}
    </div>
  );
}

function ToppingPicker({
  toppings,
  selectedIds,
  onSave,
}: {
  toppings: ToppingConfig[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onSave(next);
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-stone-500">Topping khách chọn thêm:</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {toppings
          .filter((t) => t.isActive)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                selectedIds.includes(t.id)
                  ? 'bg-[#2F80ED] text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {t.name} +{formatCurrency(t.price)}
            </button>
          ))}
      </div>
    </div>
  );
}

function ToppingsTab({
  toppings,
  newTopping,
  inputClass,
  onNewToppingChange,
  onAddTopping,
  onUpdateTopping,
}: {
  toppings: ToppingConfig[];
  newTopping: { name: string; price: number };
  inputClass: string;
  onNewToppingChange: (v: typeof newTopping) => void;
  onAddTopping: (e: FormEvent) => void;
  onUpdateTopping: (id: string, patch: Partial<ToppingConfig>) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">Topping quán</h2>
        <p className="mt-1 text-sm text-stone-500">Khách chọn thêm khi order — giá cộng vào hóa đơn.</p>
        <ul className="mt-4 space-y-2">
          {toppings.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 px-4 py-3"
            >
              <span className="font-medium text-stone-800">{t.name}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={t.price}
                  onBlur={(e) => {
                    const p = parseInt(e.target.value, 10) || 0;
                    if (p !== t.price) onUpdateTopping(t.id, { price: p });
                  }}
                  className="w-24 rounded-lg border border-stone-200 px-2 py-1 text-sm"
                />
                <span className="text-xs text-stone-400">đ</span>
                <button
                  type="button"
                  onClick={() => onUpdateTopping(t.id, { isActive: !t.isActive })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {t.isActive ? 'Đang dùng' : 'Tắt'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-5">
        <h2 className="font-bold text-stone-900">Thêm topping</h2>
        <form onSubmit={onAddTopping} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={`flex-1 ${inputClass}`}
            placeholder="Tên topping"
            value={newTopping.name}
            onChange={(e) => onNewToppingChange({ ...newTopping, name: e.target.value })}
          />
          <input
            type="number"
            min={0}
            step={1000}
            className={`sm:w-28 ${inputClass}`}
            value={newTopping.price}
            onChange={(e) =>
              onNewToppingChange({ ...newTopping, price: parseInt(e.target.value, 10) || 0 })
            }
          />
          <button
            type="submit"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
          >
            Thêm
          </button>
        </form>
      </section>
    </div>
  );
}

function RecipesTab({
  menu,
  ingredients,
  recipeFor,
  saving,
  onSaveRecipeLines,
}: {
  menu: MenuItem[];
  ingredients: Ingredient[];
  recipeFor: (id: string) => Recipe | undefined;
  saving: boolean;
  onSaveRecipeLines: (
    menuItemId: string,
    lines: { ingredientId: string; quantity: number }[],
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Nhập NVL / số lượng cho <strong>1 ly chuẩn (100%)</strong>. Khi bán, nhân viên chọn % đường
        · đá theo khách — hệ thống trừ kho = công thức × % đó.
      </p>
      {menu.map((item) => (
        <RecipeEditor
          key={item.id}
          item={item}
          recipe={recipeFor(item.id)}
          ingredients={ingredients}
          saving={saving}
          onSaveRecipeLines={onSaveRecipeLines}
        />
      ))}
    </div>
  );
}

function RecipeEditor({
  item,
  recipe,
  ingredients,
  saving,
  onSaveRecipeLines,
}: {
  item: MenuItem;
  recipe?: Recipe;
  ingredients: Ingredient[];
  saving: boolean;
  onSaveRecipeLines: (
    menuItemId: string,
    lines: { ingredientId: string; quantity: number }[],
  ) => void;
}) {
  const [lines, setLines] = useState<{ ingredientId: string; quantity: number }[]>(
    recipe?.lines?.map((l) => ({ ingredientId: l.ingredientId, quantity: l.quantity })) ?? [
      { ingredientId: '', quantity: 0 },
    ],
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLines(
      recipe?.lines?.length
        ? recipe.lines.map((l) => ({ ingredientId: l.ingredientId, quantity: l.quantity }))
        : [{ ingredientId: '', quantity: 0 }],
    );
    setDirty(false);
  }, [recipe?.id, recipe?.lines]);

  const updateLine = (idx: number, patch: Partial<{ ingredientId: string; quantity: number }>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    setDirty(true);
  };

  const addLine = () => {
    setLines((prev) => [...prev, { ingredientId: '', quantity: 0 }]);
    setDirty(true);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    setDirty(true);
  };

  const unitHint = (ingredientId: string) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return 'ml hoặc g / ly';
    return ing.unit === 'ml' ? 'ml / ly' : 'g / ly';
  };

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="font-bold text-stone-900">{item.name}</h3>
      <p className="text-xs text-stone-400">{item.category}</p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          NVL mỗi ly — 100% chuẩn quán
        </p>
        <ul className="mt-2 space-y-2">
          {lines.map((line, idx) => (
            <li key={idx} className="flex flex-wrap items-center gap-2">
              <select
                className="min-w-[140px] flex-1 rounded-lg border border-stone-200 px-2 py-2 text-sm"
                value={line.ingredientId}
                onChange={(e) => updateLine(idx, { ingredientId: e.target.value })}
              >
                <option value="">— Chọn NVL —</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                placeholder="SL"
                className="w-24 rounded-lg border border-stone-200 px-2 py-2 text-sm"
                value={line.quantity || ''}
                onChange={(e) =>
                  updateLine(idx, { quantity: parseInt(e.target.value, 10) || 0 })
                }
              />
              <span className="text-xs text-stone-400">{unitHint(line.ingredientId)}</span>
              <button
                type="button"
                onClick={() => removeLine(idx)}
                className="rounded-lg px-2 py-1 text-xs text-stone-400 hover:bg-stone-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addLine}
            className="rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600"
          >
            + Thêm dòng NVL
          </button>
          {dirty && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSaveRecipeLines(item.id, lines.filter((l) => l.ingredientId))}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${BRAND.primary}`}
            >
              Lưu công thức NVL
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function StockTab({
  items,
  saving,
  newIngredient,
  inputClass,
  onNewIngredientChange,
  onAddIngredient,
  onAdjustStock,
}: {
  items: StockItem[];
  saving: boolean;
  newIngredient: {
    name: string;
    category: IngredientCategory;
    currentStock: number;
    minStock: number;
  };
  inputClass: string;
  onNewIngredientChange: (v: typeof newIngredient) => void;
  onAddIngredient: (e: FormEvent) => void;
  onAdjustStock: (item: StockItem, addAmount: number) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500">
        NVL mẫu có thể nhập thêm tồn. Bạn cũng <strong>tự thêm NVL mới</strong> (syrup riêng, bột
        mới…) rồi dùng trong tab Công thức.
      </p>

      <section className="rounded-2xl border border-dashed border-[#2F80ED]/40 bg-white p-5">
        <h2 className="font-bold text-stone-900">Thêm nguyên liệu mới</h2>
        <form onSubmit={onAddIngredient} className="mt-3 space-y-3">
          <input
            className={inputClass}
            placeholder="Tên NVL, VD: Syrup dưa hấu"
            value={newIngredient.name}
            onChange={(e) => onNewIngredientChange({ ...newIngredient, name: e.target.value })}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className={`flex-1 ${inputClass}`}
              value={newIngredient.category}
              onChange={(e) =>
                onNewIngredientChange({
                  ...newIngredient,
                  category: e.target.value as IngredientCategory,
                })
              }
            >
              {Object.values(IngredientCategory).map((c) => (
                <option key={c} value={c}>
                  {INGREDIENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Tồn ban đầu"
              title="Tồn ban đầu (quầy bếp)"
              className={`sm:w-32 ${inputClass}`}
              value={newIngredient.currentStock}
              onChange={(e) =>
                onNewIngredientChange({
                  ...newIngredient,
                  currentStock: parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <input
              type="number"
              min={0}
              placeholder="Mức cảnh báo"
              title="Mức cảnh báo sắp hết"
              className={`sm:w-32 ${inputClass}`}
              value={newIngredient.minStock}
              onChange={(e) =>
                onNewIngredientChange({
                  ...newIngredient,
                  minStock: parseInt(e.target.value, 10) || 0,
                })
              }
            />
            <button
              type="submit"
              disabled={saving || !newIngredient.name.trim()}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${BRAND.primary}`}
            >
              Thêm NVL
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-bold text-stone-900">Tồn quầy bếp</h2>
        <ul className="mt-3 space-y-2">
          {sorted.map((item) => (
            <li
              key={`${item.warehouseId}-${item.id}`}
              className={`rounded-2xl border px-4 py-3 ${
                item.isLow ? 'border-amber-200 bg-amber-50/60' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{item.name}</p>
                  <p className="text-sm text-stone-500">
                    Còn{' '}
                    <span className="font-medium text-stone-800">
                      {item.displayStock} {item.displayUnit}
                    </span>
                    {item.isLow && (
                      <span className="ml-2 text-xs font-semibold text-amber-700">· Sắp hết</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="Nhập thêm"
                    className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-[#2F80ED]"
                    value={drafts[item.id] ?? ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      const n = Number(drafts[item.id]);
                      if (n > 0) {
                        onAdjustStock(item, n);
                        setDrafts((prev) => ({ ...prev, [item.id]: '' }));
                      }
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${BRAND.primary}`}
                  >
                    + Nhập
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {sorted.length === 0 && (
          <p className="mt-2 text-sm text-stone-500">Chưa có NVL — thêm ở form phía trên.</p>
        )}
      </section>
    </div>
  );
}

function LevelsTab({
  tenant,
  saving,
  inputClass,
  onSave,
}: {
  tenant: TenantInfo | null;
  saving: boolean;
  inputClass: string;
  onSave: (patch: {
    posSugarChoiceEnabled?: boolean;
    posIceChoiceEnabled?: boolean;
    sugarLevels?: number[];
    iceLevels?: number[];
  }) => void;
}) {
  const sugarOn = tenant?.settings?.posSugarChoiceEnabled !== false;
  const iceOn = tenant?.settings?.posIceChoiceEnabled !== false;

  const [sugarLevels, setSugarLevels] = useState<number[]>(
    normalizePercentLevels(tenant?.settings?.sugarLevels, DEFAULT_SUGAR_LEVELS),
  );
  const [iceLevels, setIceLevels] = useState<number[]>(
    normalizePercentLevels(tenant?.settings?.iceLevels, DEFAULT_ICE_LEVELS),
  );
  const [newSugar, setNewSugar] = useState('');
  const [newIce, setNewIce] = useState('');

  useEffect(() => {
    setSugarLevels(
      normalizePercentLevels(tenant?.settings?.sugarLevels, DEFAULT_SUGAR_LEVELS),
    );
    setIceLevels(normalizePercentLevels(tenant?.settings?.iceLevels, DEFAULT_ICE_LEVELS));
  }, [tenant?.settings?.sugarLevels, tenant?.settings?.iceLevels]);

  const addLevel = (kind: 'sugar' | 'ice', raw: string) => {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < 0 || n > 100) return;
    if (kind === 'sugar') {
      setSugarLevels((prev) => normalizePercentLevels([...prev, n], DEFAULT_SUGAR_LEVELS));
      setNewSugar('');
    } else {
      setIceLevels((prev) => normalizePercentLevels([...prev, n], DEFAULT_ICE_LEVELS));
      setNewIce('');
    }
  };

  const removeLevel = (kind: 'sugar' | 'ice', value: number) => {
    if (kind === 'sugar') {
      setSugarLevels((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== value)));
    } else {
      setIceLevels((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x !== value)));
    }
  };

  const applyPreset = (kind: 'sugar' | 'ice', preset: number[]) => {
    if (kind === 'sugar') setSugarLevels([...preset]);
    else setIceLevels([...preset]);
  };

  const handleSave = () => {
    onSave({
      posSugarChoiceEnabled: sugarOn,
      posIceChoiceEnabled: iceOn,
      sugarLevels,
      iceLevels,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500">
        Công thức mỗi món = <strong>100% chuẩn quán</strong>. Các mức % dưới đây hiện trên POS sau
        khi chọn topping — khách chọn mức → trừ kho = công thức × mức đó.
      </p>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">Khi bán hàng (POS)</h2>
        <ul className="mt-3 space-y-2">
          <li className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
            <span className="text-sm font-medium text-stone-800">🍬 Hỏi mức đường</span>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave({ posSugarChoiceEnabled: !sugarOn })}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                sugarOn ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {sugarOn ? 'Đang bật' : 'Đang tắt'}
            </button>
          </li>
          <li className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
            <span className="text-sm font-medium text-stone-800">🧊 Hỏi mức đá</span>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave({ posIceChoiceEnabled: !iceOn })}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                iceOn ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {iceOn ? 'Đang bật' : 'Đang tắt'}
            </button>
          </li>
        </ul>
      </section>

      <LevelEditor
        title="Mức % đường"
        emoji="🍬"
        levels={sugarLevels}
        newValue={newSugar}
        inputClass={inputClass}
        onNewValueChange={setNewSugar}
        onAdd={() => addLevel('sugar', newSugar)}
        onRemove={(v) => removeLevel('sugar', v)}
        presets={[
          { label: '4 mức: 25 · 50 · 75 · 100', values: [25, 50, 75, 100] },
          { label: '3 mức: 20 · 30 · 60', values: [20, 30, 60] },
          { label: 'Có 0% (không đường)', values: [0, 25, 50, 75, 100] },
        ]}
        onApplyPreset={(values) => applyPreset('sugar', values)}
      />

      <LevelEditor
        title="Mức % đá"
        emoji="🧊"
        levels={iceLevels}
        newValue={newIce}
        inputClass={inputClass}
        onNewValueChange={setNewIce}
        onAdd={() => addLevel('ice', newIce)}
        onRemove={(v) => removeLevel('ice', v)}
        presets={[
          { label: '4 mức: 25 · 50 · 75 · 100', values: [25, 50, 75, 100] },
          { label: '3 mức: 20 · 30 · 60', values: [20, 30, 60] },
          { label: 'Có 0% (không đá)', values: [0, 25, 50, 75, 100] },
        ]}
        onApplyPreset={(values) => applyPreset('ice', values)}
      />

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className={`w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 ${BRAND.primary}`}
      >
        {saving ? 'Đang lưu...' : 'Lưu định lượng lên quán'}
      </button>
    </div>
  );
}

function LevelEditor({
  title,
  emoji,
  levels,
  newValue,
  inputClass,
  onNewValueChange,
  onAdd,
  onRemove,
  presets,
  onApplyPreset,
}: {
  title: string;
  emoji: string;
  levels: number[];
  newValue: string;
  inputClass: string;
  onNewValueChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: number) => void;
  presets: { label: string; values: number[] }[];
  onApplyPreset: (values: number[]) => void;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="font-bold text-stone-900">
        {emoji} {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {levels.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1 rounded-full bg-[#2F80ED]/10 px-3 py-1.5 text-sm font-semibold text-[#2F80ED]"
          >
            {p}%
            <button
              type="button"
              onClick={() => onRemove(p)}
              className="ml-1 text-xs text-stone-400 hover:text-red-500"
              aria-label={`Xóa ${p}%`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((pr) => (
          <button
            key={pr.label}
            type="button"
            onClick={() => onApplyPreset(pr.values)}
            className="rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-[#2F80ED]/50"
          >
            {pr.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="Thêm mức % (0–100)"
          className={`flex-1 ${inputClass}`}
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        />
        <button
          type="button"
          onClick={onAdd}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${BRAND.primary}`}
        >
          + Thêm
        </button>
      </div>
    </section>
  );
}

function ShopTab({
  storeName,
  tenant,
  trackInventory,
  payments,
  bankPayment,
  saving,
  inputClass,
  onStoreNameChange,
  onSaveStoreName,
  onTogglePayment,
  onToggleTrackInventory,
  onSaveBankQr,
}: {
  storeName: string;
  tenant: TenantInfo | null;
  trackInventory: boolean;
  payments: PaymentMethodConfig[];
  bankPayment?: PaymentMethodConfig;
  saving: boolean;
  inputClass: string;
  onStoreNameChange: (v: string) => void;
  onSaveStoreName: (e: FormEvent) => void;
  onTogglePayment: (p: PaymentMethodConfig) => void;
  onToggleTrackInventory: (enabled: boolean) => void;
  onSaveBankQr: (payload: { qrImageUrl?: string; bankAccountInfo?: string }) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">Quản lý kho & trừ NVL</h2>
        <p className="mt-1 text-sm text-stone-500">
          Bật nếu muốn theo dõi tồn kho và tự trừ nguyên liệu mỗi cốc theo công thức. Tắt nếu chỉ
          cần bán hàng và hóa đơn. Mức đường/đá cấu hình ở tab <strong>Định lượng</strong>.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3">
          <span className="text-sm font-medium text-stone-800">
            {trackInventory ? 'Đang bật — trừ kho khi hoàn thành đơn' : 'Đang tắt — chỉ hóa đơn'}
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={() => onToggleTrackInventory(!trackInventory)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-60 ${
              trackInventory ? 'bg-stone-100 text-stone-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {trackInventory ? 'Tắt quản lý kho' : 'Bật quản lý kho'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">Tên quán trên hóa đơn</h2>
        <form onSubmit={onSaveStoreName} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={`flex-1 ${inputClass}`}
            value={storeName}
            onChange={(e) => onStoreNameChange(e.target.value)}
            placeholder={tenant?.storeName ?? 'Tên cửa hàng'}
          />
          <button
            type="submit"
            disabled={saving}
            className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${BRAND.primary}`}
          >
            Lưu
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">Hình thức thanh toán</h2>
        <ul className="mt-3 space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3"
            >
              <span className="text-sm font-medium text-stone-800">{p.label}</span>
              <button
                type="button"
                onClick={() => onTogglePayment(p)}
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
        <BankTransferQrSection
          payment={bankPayment}
          saving={saving}
          inputClass={inputClass}
          onSave={onSaveBankQr}
        />
      )}
    </div>
  );
}

const MAX_QR_BYTES = 400_000;

function BankTransferQrSection({
  payment,
  saving,
  inputClass,
  onSave,
}: {
  payment: PaymentMethodConfig;
  saving: boolean;
  inputClass: string;
  onSave: (payload: { qrImageUrl?: string; bankAccountInfo?: string }) => Promise<void>;
}) {
  const [qrUrl, setQrUrl] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void AdminPaymentController.getOne(payment.id).then((full) => {
      if (cancelled) return;
      setQrUrl(full.qrImageUrl ?? '');
      setBankInfo(full.bankAccountInfo ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [payment.id]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ chấp nhận file ảnh (PNG, JPG…)');
      return;
    }
    if (file.size > MAX_QR_BYTES) {
      setUploadError('Ảnh tối đa ~400KB — nén nhỏ hơn rồi thử lại');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setQrUrl(String(reader.result ?? ''));
      setUploadError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave({
      qrImageUrl: qrUrl.trim() || undefined,
      bankAccountInfo: bankInfo.trim() || undefined,
    });
  };

  const handleClear = async () => {
    setQrUrl('');
    setBankInfo('');
    setUploadError('');
    await onSave({ qrImageUrl: undefined, bankAccountInfo: undefined });
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="font-bold text-stone-900">QR chuyển khoản</h2>
      <p className="mt-1 text-sm text-stone-500">
        Dán link ảnh QR hoặc tải ảnh từ điện thoại/máy tính. Khách sẽ thấy mã khi chọn{' '}
        <strong>{payment.label}</strong> tại quầy.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Ảnh QR
          </label>
          <input
            className={`mt-1.5 ${inputClass}`}
            value={qrUrl.startsWith('data:') ? '(Ảnh đã tải lên — lưu để áp dụng)' : qrUrl}
            onChange={(e) => {
              setUploadError('');
              setQrUrl(e.target.value);
            }}
            placeholder="https://… hoặc dán link ảnh QR"
            readOnly={qrUrl.startsWith('data:')}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
              Tải ảnh QR
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            {(qrUrl || bankInfo) && (
              <button
                type="button"
                onClick={() => void handleClear()}
                disabled={saving}
                className="rounded-xl px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 disabled:opacity-60"
              >
                Xóa QR
              </button>
            )}
          </div>
          {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Thông tin TK (tuỳ chọn)
          </label>
          <textarea
            className={`mt-1.5 min-h-[72px] ${inputClass}`}
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            placeholder="VD: Vietcombank — 0123456789 — NGUYEN VAN A"
            rows={2}
          />
        </div>

        {qrUrl && (
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 text-center">
            <p className="text-xs font-semibold text-stone-500">Xem trước</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR xem trước"
              className="mx-auto mt-2 max-h-40 rounded-lg border border-stone-200 object-contain"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${BRAND.primary}`}
        >
          {saving ? 'Đang lưu…' : 'Lưu QR chuyển khoản'}
        </button>
      </form>
    </section>
  );
}
