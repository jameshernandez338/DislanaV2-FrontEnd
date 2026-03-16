import { Injectable, signal } from '@angular/core';

export interface CartItem {
  id: string;
  codigoItem: string;
  name: string;
  image: string;
  quantityA: number;
  quantityB: number;
  unitPriceA: number;
  unitPriceB: number;
  unitPriceALabel: string;
  unitPriceBLabel: string;
  qualityA: string;
  qualityB: string;
  price: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  get count(): number {
    return this._items().length;
  }

  get subtotal(): number {
    return this._items().reduce((sum, item) => sum + item.total, 0);
  }

  addItem(item: CartItem) {
    this._items.update((items) => {
      const existingIndex = items.findIndex((currentItem) => currentItem.codigoItem === item.codigoItem);

      if (existingIndex === -1) {
        return [...items, item];
      }

      const existingItem = items[existingIndex];
      const nextQuantityA = existingItem.quantityA + item.quantityA;
      const nextQuantityB = existingItem.quantityB + item.quantityB;
      const nextTotalA = nextQuantityA * existingItem.unitPriceA;
      const nextTotalB = nextQuantityB * existingItem.unitPriceB;
      const nextTotal = nextTotalA + nextTotalB;

      const nextItems = [...items];
      nextItems[existingIndex] = {
        ...existingItem,
        image: item.image || existingItem.image,
        quantityA: nextQuantityA,
        quantityB: nextQuantityB,
        unitPriceALabel: `Calidad 1 x metro: ${this.formatCurrency(existingItem.unitPriceA)}`,
        unitPriceBLabel: `Calidad B x metro: ${this.formatCurrency(existingItem.unitPriceB)}`,
        qualityA: `Calidad 1: ${nextQuantityA} mtrs. Valor: ${this.formatCurrency(nextTotalA)}`,
        qualityB: `Calidad B: ${nextQuantityB} mtrs. Valor: ${this.formatCurrency(nextTotalB)}`,
        price: this.formatCurrency(nextTotal),
        total: nextTotal
      };

      return nextItems;
    });
  }

  removeItem(itemId: string) {
    this._items.update((items) => items.filter((item) => item.id !== itemId));
  }

  clear() {
    this._items.set([]);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  }
}
