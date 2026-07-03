import { CartItem, MenuItem, Topping } from '@/models/menu.model';

export function toppingsKey(toppings: Topping[]): string {
  return toppings
    .map((t) => t.name)
    .sort()
    .join('|');
}

export function cartLineKey(
  menuItemId: string,
  toppings: Topping[],
  sugarPercent = 100,
  icePercent = 100,
): string {
  return `${menuItemId}|${toppingsKey(toppings)}|s${sugarPercent}|i${icePercent}`;
}

export function unitPrice(basePrice: number, toppings: Topping[]): number {
  return basePrice + toppings.reduce((sum, t) => sum + t.price, 0);
}

export function buildCartLine(
  item: MenuItem,
  toppings: Topping[],
  quantity = 1,
  sugarPercent = 100,
  icePercent = 100,
): CartItem {
  const tops = [...toppings];
  return {
    cartLineId: `${cartLineKey(item.id, tops, sugarPercent, icePercent)}-${Date.now()}`,
    menuItemId: item.id,
    name: item.name,
    basePrice: item.price,
    toppings: tops,
    price: unitPrice(item.price, tops),
    quantity,
    sugarPercent,
    icePercent,
  };
}

export function findMatchingLine(
  cart: CartItem[],
  menuItemId: string,
  toppings: Topping[],
  sugarPercent = 100,
  icePercent = 100,
): CartItem | undefined {
  const key = cartLineKey(menuItemId, toppings, sugarPercent, icePercent);
  return cart.find(
    (c) =>
      cartLineKey(
        c.menuItemId,
        c.toppings,
        c.sugarPercent ?? 100,
        c.icePercent ?? 100,
      ) === key,
  );
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function formatToppingsLabel(toppings: Topping[]): string {
  if (!toppings.length) return '';
  return toppings.map((t) => t.name).join(', ');
}
