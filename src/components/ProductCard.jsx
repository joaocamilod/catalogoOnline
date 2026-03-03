import { useEffect, useRef, useState } from "react";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { getPrecoComPromocao, isPromocaoAtiva } from "../lib/promocoes";

const formatPrice = (value) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `R$ ${amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const PLACEHOLDER =
  "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png";

function ProductCard({
  product,
  onAddToCart,
  onNotifyRestock,
  onProductClick,
  tema,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const hoverTimerRef = useRef(null);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (outOfStock) {
      onNotifyRestock?.(product);
      return;
    }
    if (hasVariations) {
      onProductClick?.(product);
      return;
    }
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 700);
  };

  const handleCardClick = () => {
    onProductClick?.(product);
  };

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < 10;
  const orderedImages = [...(product.imagens ?? [])].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });
  const firstImage = orderedImages[0]?.url || product.image || PLACEHOLDER;
  const secondImage = orderedImages[1]?.url || null;
  const displayedImage =
    showSecondImage && secondImage ? secondImage : firstImage;

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleShowSecondImage = () => {
    if (!secondImage) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowSecondImage(true);
    }, 180);
  };

  const handleHideSecondImage = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowSecondImage(false);
  };
  const originalPrice = Number(product.preco_original ?? 0) || 0;
  const discountPct = Number(product.desconto_percentual ?? 0) || 0;
  const promoResult = getPrecoComPromocao(
    product,
    Number(product.price) || 0,
    1,
  );
  const finalPrice = promoResult.finalUnitPrice;
  const hasPromotion = Boolean(promoResult.appliedPromotion);
  const activePromotions = (product.promocoes ?? []).filter((promo) =>
    isPromocaoAtiva(promo),
  );
  const promotionForBadge =
    [...activePromotions].sort((a, b) => {
      if (a.quantidade_minima !== b.quantidade_minima) {
        return a.quantidade_minima - b.quantidade_minima;
      }
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aCreated - bCreated;
    })[0] ?? null;
  const formatPromotionRule = (promotion) => {
    if (promotion.tipo_desconto === "percentual") {
      return `${Number(promotion.valor_desconto).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      })}% OFF`;
    }
    if (promotion.tipo_desconto === "valor_fixo") {
      return `${formatPrice(promotion.valor_desconto)} OFF`;
    }
    return `${formatPrice(promotion.valor_desconto)} final`;
  };
  const promotionBadgeDetail = promotionForBadge
    ? `Min ${promotionForBadge.quantidade_minima} • ${formatPromotionRule(
        promotionForBadge,
      )}`
    : "";
  const promoPct =
    promoResult.basePrice > 0
      ? Math.round((promoResult.savingsPerUnit / promoResult.basePrice) * 100)
      : 0;
  const hasDiscountBadge = hasPromotion ? promoPct > 0 : discountPct > 0;
  const hasCustomPricing =
    hasPromotion ||
    originalPrice > 0 ||
    discountPct > 0 ||
    Number(product.preco_pix ?? 0) > 0 ||
    Number(product.desconto_pix_percentual ?? 0) > 0 ||
    Number(product.total_cartao ?? 0) > 0 ||
    Number(product.parcelas_quantidade ?? 0) > 0;
  const pixPrice =
    (!hasPromotion && Number(product.preco_pix ?? 0)) ||
    (Number(product.desconto_pix_percentual ?? 0) > 0
      ? finalPrice * (1 - Number(product.desconto_pix_percentual ?? 0) / 100)
      : finalPrice);
  const stockLabel =
    product.stock > 0 ? `${product.stock} em estoque` : "Indisponível";
  const descriptionText = product.description?.trim() || "Sem descrição.";
  const hasVariations = (product.variacoes ?? []).some(
    (variacao) =>
      (variacao.opcoes ?? []).filter((opcao) => opcao.ativo !== false).length >
      0,
  );

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={handleShowSecondImage}
      onMouseLeave={handleHideSecondImage}
      onFocus={handleShowSecondImage}
      onBlur={handleHideSecondImage}
      onTouchStart={handleShowSecondImage}
      onTouchEnd={() => {
        if (!secondImage) return;
        setTimeout(() => setShowSecondImage(false), 500);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Ver detalhes de ${product.name}`}
      className={`
        bg-white shadow-sm border border-gray-100
        hover:shadow-xl hover:-translate-y-1.5
        transition-all duration-200
        overflow-hidden flex flex-col h-full
        cursor-pointer group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${!tema ? "rounded-xl hover:border-violet-300 focus-visible:ring-violet-400" : ""}
      `}
      style={
        tema
          ? {
              borderRadius: tema.card_borda_raio,
              "--tw-shadow": tema.card_sombra === "none" ? "none" : undefined,
            }
          : undefined
      }
    >
      <div className="relative w-full aspect-square overflow-hidden bg-gray-50 flex items-center justify-center">
        <img
          src={displayedImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = firstImage || PLACEHOLDER;
          }}
        />

        {lowStock && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
            Últimas unidades!
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
            Esgotado
          </span>
        )}
        {product.featured && !lowStock && !outOfStock && (
          <span className="absolute top-2 right-2 bg-violet-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
            Destaque
          </span>
        )}
        {hasDiscountBadge && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
            -{hasPromotion ? promoPct : discountPct.toFixed(0)}%
          </span>
        )}
        {promotionForBadge && (
          <span
            className={`absolute left-2 z-10 inline-flex max-w-[78%] items-center bg-emerald-500/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-emerald-400/60 backdrop-blur-[1px] leading-none ${
              hasDiscountBadge ? "top-10" : "top-2"
            }`}
          >
            {promotionBadgeDetail}
          </span>
        )}
        {product.category && (
          <span className="absolute bottom-2 left-2 bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-violet-200">
            {product.category}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-3 min-h-[3.9rem] mb-2 leading-snug break-words">
          {product.name}
        </h3>

        <div className="flex flex-col gap-0.5 mb-3">
          {(originalPrice > 0 || hasPromotion) && (
            <p className="text-xs text-gray-400 line-through">
              {formatPrice(
                hasPromotion ? promoResult.basePrice : originalPrice,
              )}
            </p>
          )}
          <span
            className={`text-xl font-extrabold leading-tight ${!tema ? "text-violet-600" : ""}`}
            style={tema ? { color: tema.cor_primaria } : undefined}
          >
            {formatPrice(finalPrice)}
          </span>
          <p
            className={`text-xs font-medium ${
              hasCustomPricing ? "text-green-600" : "text-gray-500"
            }`}
          >
            {formatPrice(pixPrice)} no Pix
          </p>
          <span className="text-xs text-gray-400" aria-live="polite">
            {stockLabel}
          </span>
        </div>

        <p className="text-xs text-gray-500 line-clamp-3 min-h-[3.4rem] mb-3 leading-relaxed">
          {descriptionText}
        </p>

        <div className="mt-auto pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            aria-label={
              outOfStock
                ? `Avise-me quando ${product.name} voltar ao estoque`
                : `Adicionar ${product.name} ao carrinho`
            }
            className={`
              w-full flex items-center justify-center gap-2
              py-2.5 font-semibold text-xs sm:text-sm leading-none whitespace-nowrap
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${
                outOfStock
                  ? "bg-amber-500 text-white hover:bg-amber-600 rounded-lg"
                  : isAdding
                    ? "bg-green-500 text-white scale-95 rounded-lg"
                    : !tema
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:-translate-y-0.5 hover:shadow-md active:scale-95 rounded-lg focus:ring-violet-500"
                      : "hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              }
            `}
            style={
              tema && !outOfStock && !isAdding
                ? {
                    background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                    color: tema.botao_texto_cor,
                    borderRadius: tema.botao_borda_raio,
                  }
                : undefined
            }
          >
            {isAdding ? (
              <>
                <FaCheck className="text-sm" aria-hidden="true" />
                Adicionado!
              </>
            ) : (
              <>
                {!outOfStock && (
                  <FaShoppingCart className="text-sm" aria-hidden="true" />
                )}
                {outOfStock ? (
                  "Avise-me"
                ) : hasVariations ? (
                  <>
                    <span className="sm:hidden">Selecionar</span>
                    <span className="hidden sm:inline">Selecionar opções</span>
                  </>
                ) : (
                  "Adicionar"
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
