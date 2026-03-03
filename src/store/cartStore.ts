import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CatalogProduct } from "../types";

const getMaxStock = (product: CatalogProduct) => {
  const stock = Number(product.stock);
  if (!Number.isFinite(stock)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor(stock));
};

const getSelectedVariationBasePrice = (
  product: CatalogProduct,
  selectedVariations: CartItem["selectedVariations"],
) => {
  for (const selected of selectedVariations ?? []) {
    const variacao = (product.variacoes ?? []).find(
      (item) => item.id === selected.variacaoId,
    );
    const opcao = variacao?.opcoes?.find(
      (item) => item.id === selected.opcaoId,
    );
    const precoOpcao = Number(opcao?.preco);
    if (Number.isFinite(precoOpcao) && precoOpcao >= 0) return precoOpcao;
  }
  return Number(product.price) || 0;
};

const getItemMaxStock = (item: CartItem) => {
  const customLimit = Number(item.stock_limit);
  if (Number.isFinite(customLimit)) return Math.max(0, Math.floor(customLimit));
  return getMaxStock(item.product);
};

const getItemUnitBasePrice = (item: CartItem) =>
  getSelectedVariationBasePrice(item.product, item.selectedVariations);

interface CartState {
  items: CartItem[];
  addItem: (
    product: CatalogProduct,
    selectedVariations?: CartItem["selectedVariations"],
    stockLimit?: number | null,
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

      addItem: (product, selectedVariations = [], stockLimit = null) =>
        set((state) => {
          const maxStock = Number.isFinite(Number(stockLimit))
            ? Math.max(0, Math.floor(Number(stockLimit)))
            : getMaxStock(product);
          if (maxStock <= 0) return state;
          const itemId = buildCartItemId(product.id, selectedVariations);
          const quantityAlreadyInProduct = state.items
            .filter((i) => i.id === itemId)
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
              {
                id: itemId,
                product,
                quantity: 1,
                selectedVariations,
                stock_limit: Number.isFinite(Number(stockLimit))
                  ? Math.max(0, Math.floor(Number(stockLimit)))
                  : null,
              },
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
          const maxStock = getItemMaxStock(target);

          return {
            items: state.items
              .map((i) => {
                if (i.id !== itemId) return i;
                const clampedQuantity = Math.min(quantity, maxStock);
                if (clampedQuantity <= 0) return null;
                return { ...i, quantity: clampedQuantity };
              })
              .filter(Boolean) as CartItem[],
          };
        }),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, i) => sum + getItemUnitBasePrice(i) * i.quantity,
          0,
        ),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "catalogo-cart",
    },
  ),
);
