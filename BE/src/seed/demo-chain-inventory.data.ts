import { STORE_DEMO_PACK } from './demo-store-inventory.data';
import { DemoInventoryPack } from './demo-inventory.types';

/** Catalog chuỗi — giống Store nhưng menu prefix [Chain] */
export const CHAIN_DEMO_PACK: DemoInventoryPack = {
  ...STORE_DEMO_PACK,
  menuItems: STORE_DEMO_PACK.menuItems.map((m) => ({
    ...m,
    name: m.name.replace('[Store]', '[Chain]'),
    description: m.description?.replace('cửa hàng', 'chi nhánh'),
  })),
  recipes: STORE_DEMO_PACK.recipes.map((r) => ({
    ...r,
    menuName: r.menuName.replace('[Store]', '[Chain]'),
  })),
  supplierReceipt: {
    ...STORE_DEMO_PACK.supplierReceipt,
    documentNumber: 'CHAIN-NCC-2026-001',
    supplierName: 'NCC tập trung — BOBAPOS Chain',
    note: 'Nhập kho tổng chuỗi (MAIN)',
  },
};
