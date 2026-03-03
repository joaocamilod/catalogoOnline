import type {
  CatalogProduct,
  PromocaoProduto,
  TipoDescontoPromocao,
} from "../types";

const round2 = (value: number) => Math.round(value * 100) / 100;

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return timestamp;
};

export function isPromocaoAtiva(
  promocao: PromocaoProduto,
  now = new Date(),
): boolean {
  if (!promocao.ativo) return false;
  const nowTs = now.getTime();
  const start = parseDate(promocao.data_inicio);
  const end = parseDate(promocao.data_fim);
  if (start !== null && start > nowTs) return false;
  if (end !== null && end < nowTs) return false;
  return true;
}

function applyDiscountByType(
  basePrice: number,
  tipo: TipoDescontoPromocao,
  valorDesconto: number,
): number {
  if (!Number.isFinite(basePrice) || basePrice < 0) return 0;
  const cleanBase = round2(basePrice);
  const cleanValor = Math.max(0, Number(valorDesconto) || 0);

  if (tipo === "percentual") {
    const percent = Math.min(100, cleanValor);
    return round2(cleanBase * (1 - percent / 100));
  }
  if (tipo === "valor_fixo") {
    return round2(Math.max(0, cleanBase - cleanValor));
  }
  return round2(Math.max(0, cleanValor));
}

function getPromoUnitPriceAndSavings(
  promocao: PromocaoProduto,
  basePrice: number,
): { unitPrice: number; savings: number } {
  const unitPrice = applyDiscountByType(
    basePrice,
    promocao.tipo_desconto,
    promocao.valor_desconto,
  );
  const savings = round2(Math.max(0, basePrice - unitPrice));
  return { unitPrice, savings };
}

export function getPromocaoAplicada(
  product: Pick<CatalogProduct, "promocoes">,
  basePrice: number,
  quantity: number,
  now = new Date(),
): PromocaoProduto | null {
  const promos = (product.promocoes ?? []).filter(
    (promo) =>
      isPromocaoAtiva(promo, now) &&
      quantity >= Math.max(1, promo.quantidade_minima),
  );

  if (!promos.length) return null;

  const sorted = [...promos].sort((a, b) => {
    const savingsA = getPromoUnitPriceAndSavings(a, basePrice).savings;
    const savingsB = getPromoUnitPriceAndSavings(b, basePrice).savings;
    if (savingsB !== savingsA) return savingsB - savingsA;
    return (a.created_at || "").localeCompare(b.created_at || "");
  });

  return sorted[0] ?? null;
}

export function getPrecoComPromocao(
  product: Pick<CatalogProduct, "promocoes">,
  basePrice: number,
  quantity = 1,
): {
  basePrice: number;
  finalUnitPrice: number;
  savingsPerUnit: number;
  appliedPromotion: PromocaoProduto | null;
} {
  const safeBasePrice = round2(Math.max(0, Number(basePrice) || 0));
  const appliedPromotion = getPromocaoAplicada(
    product,
    safeBasePrice,
    quantity,
  );
  if (!appliedPromotion) {
    return {
      basePrice: safeBasePrice,
      finalUnitPrice: safeBasePrice,
      savingsPerUnit: 0,
      appliedPromotion: null,
    };
  }

  const { unitPrice, savings } = getPromoUnitPriceAndSavings(
    appliedPromotion,
    safeBasePrice,
  );
  return {
    basePrice: safeBasePrice,
    finalUnitPrice: unitPrice,
    savingsPerUnit: savings,
    appliedPromotion,
  };
}
