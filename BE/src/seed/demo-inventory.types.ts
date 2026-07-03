import { IngredientCategory } from '../common/enums/ingredient-category.enum';

export type DemoIngredientSeed = {
  name: string;
  category: IngredientCategory;
  sku: string;
  /** Gợi ý HSD khi nhập NCC (ngày) */
  shelfLifeDays?: number;
};

export type DemoStockLine = {
  ingredient: string;
  currentStock: number;
  minStock: number;
};

export type DemoMenuSeed = {
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
};

export type DemoRecipeSeed = {
  menuName: string;
  lines: { ingredient: string; quantity: number }[];
};

export type DemoSupplierReceiptSeed = {
  supplierName: string;
  documentNumber: string;
  warehouseCode: string;
  note: string;
  lines: { ingredient: string; quantity: number; unitPrice: number; expiryDaysFromReceipt?: number }[];
};

export type DemoInventoryPack = {
  ingredients: DemoIngredientSeed[];
  stockByWarehouse: Record<string, DemoStockLine[]>;
  toppings: { name: string; price: number; sortOrder: number }[];
  menuItems: DemoMenuSeed[];
  recipes: DemoRecipeSeed[];
  supplierReceipt: DemoSupplierReceiptSeed;
};
