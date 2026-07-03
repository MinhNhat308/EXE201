import { IngredientCategory } from './ingredient-category.model';

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  isKitchenSource: boolean;
  isCentralWarehouse?: boolean;
  branchId?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  category: IngredientCategory;
  currentStock: number;
  minStock: number;
  shelfLifeDays?: number;
  isActive?: boolean;
}

export interface StockItem extends Ingredient {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  isLow: boolean;
  displayStock: number;
  displayUnit: string;
  displayMinStock: number;
  nearestExpiry?: string;
  expiringQty?: number;
}

export interface WarehouseOverview {
  warehouseId: string;
  lowCount: number;
  totalItems: number;
  liquidLow: number;
  todayUsageLines: number;
  todayReceiptCount: number;
  todayReceiptValue: number;
  monthReceiptCount: number;
  monthReceiptValue: number;
  byCategory: Record<IngredientCategory, StockItem[]>;
  warehouses: WarehouseLocation[];
}

export interface RecipeLine {
  ingredientId: string;
  quantity: number;
  ingredientName?: string;
  unit?: string;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  intensityPercent?: number;
  sugarPercent?: number;
  icePercent?: number;
  lines: RecipeLine[];
}

export interface SupplierReceiptLine {
  ingredientId: string;
  ingredientName?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  expiryDate?: string;
}

export interface SupplierReceipt {
  id: string;
  supplierName: string;
  documentNumber: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  documentDate: string;
  note?: string;
  lines: SupplierReceiptLine[];
  lineCount?: number;
  totalValue?: number;
  createdByName?: string;
  createdAt?: string;
}

export interface DailyUsageItem {
  ingredientId: string;
  name: string;
  unit: string;
  totalUsed: number;
}

export interface DailyUsage {
  date: string;
  items: DailyUsageItem[];
  movementCount: number;
}
