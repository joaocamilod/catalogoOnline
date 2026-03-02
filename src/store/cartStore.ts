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
  addItem: (
    product: CatalogProduct,
    selectedVariations?: CartItem["selectedVariations"],
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

const buildCartItemId = (
  productId: string,
  selectedVariations: CartItem["selectedVariations"],
) => {
  const variationsKey = [...selectedVariations]
    .sort((a, b) => a.variacaoId.localeCompare(b.variacaoId))
    .map((item) => `${item.variacaoId}:${item.opcaoId}`)
    .join("|");
  return variationsKey ? `${productId}__${variationsKey}` : productId;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, selectedVariations = []) =>
        set((state) => {
          const maxStock = getMaxStock(product);
          if (maxStock <= 0) return state;
          const itemId = buildCartItemId(product.id, selectedVariations);
          const quantityAlreadyInProduct = state.items
            .filter((i) => i.product.id === product.id)
            .reduce((sum, i) => sum + i.quantity, 0);
          if (quantityAlreadyInProduct >= maxStock) return state;

          const existing = state.items.find((i) => i.id === itemId);
          if (existing) {
            const nextQuantity = Math.min(existing.quantity + 1, maxStock);
            if (nextQuantity === existing.quantity) return state;
            return {
              items: state.items.map((i) =>
                i.id === itemId ? { ...i, quantity: nextQuantity } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { id: itemId, product, quantity: 1, selectedVariations },
            ],
          };
        }),

      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        })),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const target = state.items.find((item) => item.id === itemId);
          if (!target) return state;

          const productId = target.product.id;
          const maxStock = getMaxStock(target.product);
          const totalWithoutTarget = state.items
            .filter(
              (item) => item.id !== itemId && item.product.id === productId,
            )
            .reduce((sum, item) => sum + item.quantity, 0);

          return {
            items: state.items
              .map((i) => {
                if (i.id !== itemId) return i;
                const allowedForTarget = Math.max(
                  0,
                  maxStock - totalWithoutTarget,
                );
                const clampedQuantity = Math.min(quantity, allowedForTarget);
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
