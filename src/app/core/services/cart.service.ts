import { Injectable, signal } from '@angular/core';
import { NumberFormatService } from '@shared/services/number-format.service';

export interface CartItemFinish {
  id: string;
  acabado: string;
  texto: boolean;
  textoValor: string;
  valor: number;
}

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
  acabados?: CartItemFinish[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'cartItems';
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  constructor(private numberFormatService: NumberFormatService) {
    this.restoreItems();
  }

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
        const nextItems = [...items, item];
        this.persistItems(nextItems);
        return nextItems;
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

      this.persistItems(nextItems);
      return nextItems;
    });
  }

  removeItem(itemId: string) {
    this._items.update((items) => {
      const nextItems = items.filter((item) => item.id !== itemId);
      this.persistItems(nextItems);
      return nextItems;
    });
  }

  updateItemFinishes(itemId: string, acabados: CartItemFinish[]) {
    this._items.update((items) =>
      {
        const nextItems = items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              acabados: acabados.map((acabado) => ({ ...acabado }))
            }
          : item
        );

        this.persistItems(nextItems);
        return nextItems;
      }
    );
  }

  clear() {
    this._items.set([]);
    this.persistItems([]);
  }

  private formatCurrency(value: number): string {
    return this.numberFormatService.formatCurrency(value);
  }

  private restoreItems() {
    try {
      const storedItems = localStorage.getItem(this.storageKey);

      if (!storedItems) {
        return;
      }

      const parsedItems = JSON.parse(storedItems) as CartItem[];

      if (!Array.isArray(parsedItems)) {
        this.persistItems([]);
        return;
      }

      this._items.set(this.normalizeStoredItems(parsedItems));
    } catch {
      this.persistItems([]);
    }
  }

  private persistItems(items: CartItem[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private normalizeStoredItems(items: CartItem[]): CartItem[] {
    return items.map((item) => ({
      ...item,
      acabados: (item.acabados ?? []).map((acabado, index) => ({
        id: acabado.id || `${item.id}-acabado-${index}`,
        acabado: acabado.acabado,
        texto: typeof acabado.texto === 'boolean',
        textoValor: typeof acabado.texto === 'string' ? acabado.texto : (acabado.textoValor ?? ''),
        valor: acabado.valor
      }))
    }));
  }
}
