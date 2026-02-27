import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CatalogProduct } from "../types";

const getMaxStock = (product: CatalogProduct) => {
  const stock = Number(product.stock);
  if (!Number.isFinite(stock)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor(stock));
};

interface CartState {
  items: CartItem[];
  addItem: (product: CatalogProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const maxStock = getMaxStock(product);
          if (maxStock <= 0) return state;

          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            const nextQuantity = Math.min(existing.quantity + 1, maxStock);
            if (nextQuantity === existing.quantity) return state;
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: nextQuantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          return {
            items: state.items
              .map((i) => {
                if (i.product.id !== productId) return i;
                const maxStock = getMaxStock(i.product);
                const clampedQuantity = Math.min(quantity, maxStock);
                if (clampedQuantity <= 0) return null;
                return { ...i, quantity: clampedQuantity };
              })
              .filter(Boolean) as CartItem[],
          };
        }),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "catalogo-cart",
    },
  ),
);
