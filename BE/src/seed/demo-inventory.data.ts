import { IngredientCategory } from '../common/enums/ingredient-category.enum';
import { MENU_IMAGE_BY_NAME } from '../modules/menu/menu-images';
import type {
  DemoIngredientSeed,
  DemoInventoryPack,
  DemoStockLine,
} from './demo-inventory.types';

export type { DemoIngredientSeed, DemoStockLine } from './demo-inventory.types';

const SOLO_INGREDIENTS: DemoIngredientSeed[] = [
  { name: 'Nước trà đen (pha sẵn)', category: IngredientCategory.LIQUID, sku: 'NL-TRA-DEN' },
  { name: 'Nước trà xanh (pha sẵn)', category: IngredientCategory.LIQUID, sku: 'NL-TRA-XANH' },
  { name: 'Nước lọc', category: IngredientCategory.LIQUID, sku: 'NL-LOC' },
  { name: 'Sữa tươi', category: IngredientCategory.LIQUID, sku: 'NL-SUA-TUOI' },
  { name: 'Sữa đặc', category: IngredientCategory.LIQUID, sku: 'NL-SUA-DAC' },
  { name: 'Syrup đào', category: IngredientCategory.LIQUID, sku: 'NL-SYRUP-DAO' },
  { name: 'Syrup vải', category: IngredientCategory.LIQUID, sku: 'NL-SYRUP-VAI' },
  { name: 'Puree chanh leo', category: IngredientCategory.LIQUID, sku: 'NL-CHANH-LEO' },
  { name: 'Đường', category: IngredientCategory.DRY, sku: 'KHO-DUONG' },
  { name: 'Đường đen (đường phèn)', category: IngredientCategory.DRY, sku: 'KHO-DUONG-DEN' },
  { name: 'Bột matcha', category: IngredientCategory.DRY, sku: 'KHO-MATCHA' },
  { name: 'Bột cacao', category: IngredientCategory.DRY, sku: 'KHO-CACAO' },
  { name: 'Bột khoai môn', category: IngredientCategory.DRY, sku: 'KHO-KHOAI-MON' },
  { name: 'Cà phê rang xay', category: IngredientCategory.DRY, sku: 'KHO-CAFE' },
  { name: 'Kem cheese', category: IngredientCategory.DRY, sku: 'KHO-KEM-CHEESE' },
  { name: 'Trân châu đen', category: IngredientCategory.TOPPING, sku: 'TOP-TC-DEN' },
  { name: 'Trân châu trắng', category: IngredientCategory.TOPPING, sku: 'TOP-TC-TRANG' },
  { name: 'Thạch dừa', category: IngredientCategory.TOPPING, sku: 'TOP-THACH-DUA' },
  { name: 'Pudding trứng', category: IngredientCategory.TOPPING, sku: 'TOP-PUDDING' },
  { name: 'Đá viên', category: IngredientCategory.OTHER, sku: 'KHAC-DA' },
];

/** Phân bổ tồn theo kho — có vài mặt hàng sắp hết để demo cảnh báo */
const SOLO_STOCK_BY_WAREHOUSE: Record<string, DemoStockLine[]> = {
  KHO_TONG: [
    { ingredient: 'Đường', currentStock: 48_000, minStock: 5_000 },
    { ingredient: 'Đường đen (đường phèn)', currentStock: 22_000, minStock: 3_000 },
    { ingredient: 'Bột matcha', currentStock: 12_000, minStock: 1_500 },
    { ingredient: 'Bột cacao', currentStock: 9_500, minStock: 1_200 },
    { ingredient: 'Bột khoai môn', currentStock: 7_200, minStock: 1_000 },
    { ingredient: 'Cà phê rang xay', currentStock: 11_000, minStock: 1_500 },
    { ingredient: 'Trân châu đen', currentStock: 25_000, minStock: 3_000 },
    { ingredient: 'Trân châu trắng', currentStock: 18_000, minStock: 2_500 },
    { ingredient: 'Sữa đặc', currentStock: 60_000, minStock: 8_000 },
  ],
  KHO1: [
    { ingredient: 'Nước trà đen (pha sẵn)', currentStock: 95_000, minStock: 20_000 },
    { ingredient: 'Nước trà xanh (pha sẵn)', currentStock: 72_000, minStock: 15_000 },
    { ingredient: 'Sữa tươi', currentStock: 42_000, minStock: 10_000 },
    { ingredient: 'Nước lọc', currentStock: 120_000, minStock: 15_000 },
    { ingredient: 'Trân châu đen', currentStock: 12_500, minStock: 2_000 },
    { ingredient: 'Thạch dừa', currentStock: 8_800, minStock: 1_500 },
    { ingredient: 'Đá viên', currentStock: 85_000, minStock: 12_000 },
    { ingredient: 'Đường', currentStock: 8_500, minStock: 2_000 },
  ],
  KHO2: [
    { ingredient: 'Bột matcha', currentStock: 2_800, minStock: 5_000 },
    { ingredient: 'Bột cacao', currentStock: 6_200, minStock: 1_000 },
    { ingredient: 'Bột khoai môn', currentStock: 4_500, minStock: 800 },
    { ingredient: 'Cà phê rang xay', currentStock: 5_800, minStock: 1_200 },
    { ingredient: 'Đường', currentStock: 14_000, minStock: 3_000 },
    { ingredient: 'Kem cheese', currentStock: 3_200, minStock: 800 },
    { ingredient: 'Trân châu trắng', currentStock: 9_500, minStock: 2_000 },
  ],
  KHO3: [
    { ingredient: 'Sữa tươi', currentStock: 38_000, minStock: 8_000 },
    { ingredient: 'Kem cheese', currentStock: 5_600, minStock: 3_000 },
    { ingredient: 'Syrup đào', currentStock: 24_000, minStock: 5_000 },
    { ingredient: 'Syrup vải', currentStock: 19_500, minStock: 4_500 },
    { ingredient: 'Puree chanh leo', currentStock: 16_000, minStock: 3_500 },
    { ingredient: 'Sữa đặc', currentStock: 28_000, minStock: 5_000 },
    { ingredient: 'Thạch dừa', currentStock: 6_400, minStock: 1_200 },
  ],
};

const SOLO_TOPPINGS = [
  { name: 'Trân châu đen', price: 5_000, sortOrder: 1 },
  { name: 'Trân châu trắng', price: 5_000, sortOrder: 2 },
  { name: 'Thạch dừa', price: 5_000, sortOrder: 3 },
  { name: 'Pudding trứng', price: 7_000, sortOrder: 4 },
  { name: 'Kem cheese', price: 10_000, sortOrder: 5 },
  { name: 'Đậu đỏ', price: 5_000, sortOrder: 6 },
];

const SOLO_MENU_ITEMS = [
  {
    name: 'Trà sữa trân châu đường đen',
    category: 'Trà sữa',
    price: 35_000,
    description: 'Trà sữa đậm vị, trân châu dai',
    imageUrl: MENU_IMAGE_BY_NAME['Trà sữa trân châu đường đen'],
  },
  {
    name: 'Trà sữa matcha',
    category: 'Trà sữa',
    price: 40_000,
    description: 'Matcha Nhật Bản, béo vừa',
    imageUrl: MENU_IMAGE_BY_NAME['Trà sữa matcha'],
  },
  {
    name: 'Trà sữa oolong',
    category: 'Trà sữa',
    price: 32_000,
    description: 'Hương oolong thanh',
    imageUrl: MENU_IMAGE_BY_NAME['Trà sữa oolong'],
  },
  {
    name: 'Trà sữa khoai môn',
    category: 'Trà sữa',
    price: 38_000,
    description: 'Khoai môn thơm bùi',
    imageUrl: MENU_IMAGE_BY_NAME['Trà sữa khoai môn'],
  },
  {
    name: 'Trà đào cam sả',
    category: 'Trà trái cây',
    price: 45_000,
    description: 'Đào + cam + sả mát',
    imageUrl: MENU_IMAGE_BY_NAME['Trà đào cam sả'],
  },
  {
    name: 'Trà vải',
    category: 'Trà trái cây',
    price: 42_000,
    description: 'Vải ngọt thanh',
    imageUrl: MENU_IMAGE_BY_NAME['Trà vải'],
  },
  {
    name: 'Trà chanh leo',
    category: 'Trà trái cây',
    price: 40_000,
    description: 'Chanh leo chua nhẹ',
    imageUrl: MENU_IMAGE_BY_NAME['Trà chanh leo'],
  },
  {
    name: 'Hồng trà kem cheese',
    category: 'Kem cheese',
    price: 48_000,
    description: 'Kem cheese mặn ngọt',
    imageUrl: MENU_IMAGE_BY_NAME['Hồng trà kem cheese'],
  },
  {
    name: 'Trà xanh kem cheese',
    category: 'Kem cheese',
    price: 48_000,
    description: 'Trà xanh + kem cheese',
    imageUrl: MENU_IMAGE_BY_NAME['Trà xanh kem cheese'],
  },
  {
    name: 'Cacao sữa',
    category: 'Cacao',
    price: 36_000,
    description: 'Cacao đậm vị',
    imageUrl: MENU_IMAGE_BY_NAME['Cacao sữa'],
  },
  {
    name: 'Cacao đá xay',
    category: 'Cacao',
    price: 42_000,
    description: 'Cacao xay mát lạnh',
    imageUrl: MENU_IMAGE_BY_NAME['Cacao đá xay'],
  },
  {
    name: 'Cà phê sữa đá',
    category: 'Cà phê',
    price: 30_000,
    description: 'Cà phê phin truyền thống',
    imageUrl: MENU_IMAGE_BY_NAME['Cà phê sữa đá'],
  },
];

const SOLO_RECIPES = [
  {
    menuName: 'Trà sữa trân châu đường đen',
    lines: [
      { ingredient: 'Nước trà đen (pha sẵn)', quantity: 180 },
      { ingredient: 'Sữa tươi', quantity: 120 },
      { ingredient: 'Đường đen (đường phèn)', quantity: 35 },
      { ingredient: 'Trân châu đen', quantity: 50 },
      { ingredient: 'Đá viên', quantity: 150 },
    ],
  },
  {
    menuName: 'Trà sữa matcha',
    lines: [
      { ingredient: 'Nước lọc', quantity: 100 },
      { ingredient: 'Sữa tươi', quantity: 150 },
      { ingredient: 'Bột matcha', quantity: 8 },
      { ingredient: 'Đường', quantity: 25 },
      { ingredient: 'Đá viên', quantity: 150 },
    ],
  },
  {
    menuName: 'Trà đào cam sả',
    lines: [
      { ingredient: 'Nước trà xanh (pha sẵn)', quantity: 200 },
      { ingredient: 'Syrup đào', quantity: 45 },
      { ingredient: 'Đường', quantity: 15 },
      { ingredient: 'Đá viên', quantity: 180 },
    ],
  },
  {
    menuName: 'Hồng trà kem cheese',
    lines: [
      { ingredient: 'Nước trà đen (pha sẵn)', quantity: 220 },
      { ingredient: 'Kem cheese', quantity: 40 },
      { ingredient: 'Đường', quantity: 20 },
      { ingredient: 'Đá viên', quantity: 120 },
    ],
  },
  {
    menuName: 'Cà phê sữa đá',
    lines: [
      { ingredient: 'Cà phê rang xay', quantity: 18 },
      { ingredient: 'Nước lọc', quantity: 80 },
      { ingredient: 'Sữa đặc', quantity: 35 },
      { ingredient: 'Đá viên', quantity: 120 },
    ],
  },
  {
    menuName: 'Cacao đá xay',
    lines: [
      { ingredient: 'Bột cacao', quantity: 25 },
      { ingredient: 'Sữa tươi', quantity: 180 },
      { ingredient: 'Đường', quantity: 20 },
      { ingredient: 'Đá viên', quantity: 200 },
    ],
  },
  {
    menuName: 'Trà sữa oolong',
    lines: [
      { ingredient: 'Nước trà đen (pha sẵn)', quantity: 200 },
      { ingredient: 'Sữa tươi', quantity: 100 },
      { ingredient: 'Đường', quantity: 18 },
      { ingredient: 'Trân châu đen', quantity: 45 },
      { ingredient: 'Đá viên', quantity: 140 },
    ],
  },
  {
    menuName: 'Trà sữa khoai môn',
    lines: [
      { ingredient: 'Sữa tươi', quantity: 160 },
      { ingredient: 'Bột khoai môn', quantity: 30 },
      { ingredient: 'Đường', quantity: 22 },
      { ingredient: 'Đá viên', quantity: 150 },
    ],
  },
  {
    menuName: 'Trà vải',
    lines: [
      { ingredient: 'Nước trà xanh (pha sẵn)', quantity: 200 },
      { ingredient: 'Syrup vải', quantity: 40 },
      { ingredient: 'Đường', quantity: 12 },
      { ingredient: 'Đá viên', quantity: 170 },
    ],
  },
  {
    menuName: 'Trà chanh leo',
    lines: [
      { ingredient: 'Nước lọc', quantity: 120 },
      { ingredient: 'Puree chanh leo', quantity: 50 },
      { ingredient: 'Đường', quantity: 15 },
      { ingredient: 'Đá viên', quantity: 160 },
    ],
  },
  {
    menuName: 'Trà xanh kem cheese',
    lines: [
      { ingredient: 'Nước trà xanh (pha sẵn)', quantity: 210 },
      { ingredient: 'Kem cheese', quantity: 38 },
      { ingredient: 'Đường', quantity: 18 },
      { ingredient: 'Đá viên', quantity: 120 },
    ],
  },
  {
    menuName: 'Cacao sữa',
    lines: [
      { ingredient: 'Bột cacao', quantity: 18 },
      { ingredient: 'Sữa tươi', quantity: 200 },
      { ingredient: 'Đường', quantity: 18 },
      { ingredient: 'Đá viên', quantity: 100 },
    ],
  },
];

const SOLO_SUPPLIER_RECEIPT = {
  supplierName: 'Công ty TNHH Nguyên liệu BOBA Việt',
  documentNumber: 'SOLO-NCC-2026-001',
  warehouseCode: 'KHO_TONG',
  note: 'Nhập đầu tháng — demo thuyết trình',
  lines: [
    { ingredient: 'Bột matcha', quantity: 5_000, unitPrice: 420_000 },
    { ingredient: 'Trân châu đen', quantity: 10_000, unitPrice: 85_000 },
    { ingredient: 'Sữa đặc', quantity: 24_000, unitPrice: 28_000 },
    { ingredient: 'Syrup đào', quantity: 8_000, unitPrice: 95_000 },
  ],
};

/** Catalog đầy đủ cho demo-solo & demo-chain */
export const SOLO_DEMO_PACK: DemoInventoryPack = {
  ingredients: SOLO_INGREDIENTS,
  stockByWarehouse: SOLO_STOCK_BY_WAREHOUSE,
  toppings: SOLO_TOPPINGS,
  menuItems: SOLO_MENU_ITEMS,
  recipes: SOLO_RECIPES,
  supplierReceipt: SOLO_SUPPLIER_RECEIPT,
};

/** @deprecated dùng SOLO_DEMO_PACK — giữ cho import cũ */
export const DEMO_INGREDIENTS = SOLO_INGREDIENTS;
export const DEMO_STOCK_BY_WAREHOUSE = SOLO_STOCK_BY_WAREHOUSE;
export const DEMO_TOPPINGS = SOLO_TOPPINGS;
export const DEMO_MENU_ITEMS = SOLO_MENU_ITEMS;
export const DEMO_RECIPES = SOLO_RECIPES;
export const DEMO_SUPPLIER_RECEIPT = SOLO_SUPPLIER_RECEIPT;
