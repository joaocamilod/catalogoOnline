import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Check,
  Zap,
  CreditCard,
  Minus,
  Plus,
  Tag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Lock,
} from "lucide-react";

const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(Number(v)) ? Number(v) : 0,
  );

const PLACEHOLDER =
  "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png";

// const SIZES = ["P", "M", "G", "GG", "GGG"]; // mock por enquanto

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onNotifyRestock,
  onBuyNow,
  tema,
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [added, setAdded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [variationError, setVariationError] = useState("");

  const images = (() => {
    const gallery = (product?.imagens ?? [])
      .filter((i) => i?.url)
      .map((i) => i.url);
    return gallery.length > 0 ? gallery : [product?.image || PLACEHOLDER];
  })();

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  useEffect(() => {
    setSelectedOptions({});
    setVariationError("");
    setQty(1);
  }, [product?.id]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  const prevImg = () =>
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setImgIdx((i) => (i + 1) % images.length);

  const variations = (product?.variacoes ?? [])
    .map((variacao) => ({
      ...variacao,
      opcoes: (variacao.opcoes ?? []).filter((opcao) => opcao.ativo !== false),
    }))
    .filter((variacao) => variacao.opcoes.length > 0);

  useEffect(() => {
    setSelectedOptions((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const variacao of variations) {
        const selectedOptionId = prev[variacao.id];
        if (!selectedOptionId) continue;
        const selectedOption = variacao.opcoes.find(
          (opcao) => opcao.id === selectedOptionId,
        );
        if (!selectedOption) {
          delete next[variacao.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [variations]);

  const getMissingRequiredVariation = () =>
    variations.find(
      (variacao) => variacao.obrigatoria && !selectedOptions[variacao.id],
    );

  const buildSelectedVariations = () =>
    variations
      .map((variacao) => {
        const selectedOptionId = selectedOptions[variacao.id];
        if (!selectedOptionId) return null;
        const selectedOption = variacao.opcoes.find(
          (opcao) => opcao.id === selectedOptionId,
        );
        if (!selectedOption) return null;
        return {
          variacaoId: variacao.id,
          variacaoNome: variacao.nome,
          opcaoId: selectedOption.id,
          opcaoValor: selectedOption.valor,
        };
      })
      .filter(Boolean);

  const selectedVariationStockLimit = (() => {
    if (!variations.length) return null;
    const limits = variations
      .map((variacao) => {
        const selectedOptionId = selectedOptions[variacao.id];
        if (!selectedOptionId) return null;
        const selectedOption = variacao.opcoes.find(
          (opcao) => opcao.id === selectedOptionId,
        );
        const stock = Number(selectedOption?.estoque);
        return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null;
      })
      .filter((value) => value !== null);
    if (!limits.length) return null;
    return Math.min(...limits);
  })();

  const handleAdd = () => {
    if (adding || buyingNow || added || outOfStock) return;
    const missingRequired = getMissingRequiredVariation();
    if (missingRequired) {
      setVariationError(`Selecione uma opção de ${missingRequired.nome}.`);
      return;
    }
    setAdding(true);
    const selectedVariations = buildSelectedVariations();
    for (let i = 0; i < qty; i++) onAddToCart(product, selectedVariations);
    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        handleClose();
      }, 1000);
    }, 500);
  };

  const handleBuyNow = () => {
    if (adding || buyingNow || added || outOfStock) return;
    const missingRequired = getMissingRequiredVariation();
    if (missingRequired) {
      setVariationError(`Selecione uma opção de ${missingRequired.nome}.`);
      return;
    }
    setBuyingNow(true);
    const selectedVariations = buildSelectedVariations();

    if (onBuyNow) {
      onBuyNow(product, qty, selectedVariations);
    } else {
      for (let i = 0; i < qty; i++) onAddToCart(product, selectedVariations);
    }

    setTimeout(() => {
      setBuyingNow(false);
      handleClose();
    }, 250);
  };

  if (!product) return null;

  const productStock = Number(product.stock);
  const effectiveStock = Number.isFinite(selectedVariationStockLimit)
    ? selectedVariationStockLimit
    : Number.isFinite(productStock)
      ? Math.max(0, Math.floor(productStock))
      : 0;
  const outOfStock = effectiveStock <= 0;
  const qtyLimit = Math.max(1, effectiveStock);
  const originalPrice = Number(product.preco_original ?? 0) || 0;
  const discountPercent = Number(product.desconto_percentual ?? 0) || 0;
  const cardTotal = Number(product.total_cartao ?? product.price ?? 0) || 0;
  const pixDiscountPercent = Number(product.desconto_pix_percentual ?? 0) || 0;
  const hasPixPriceConfigured = Number(product.preco_pix ?? 0) > 0;
  const hasCardTotalConfigured = Number(product.total_cartao ?? 0) > 0;
  const hasInstallmentsConfigured =
    Number(product.parcelas_quantidade ?? 0) > 0;
  const hasPricingDetails =
    originalPrice > 0 ||
    discountPercent > 0 ||
    hasPixPriceConfigured ||
    pixDiscountPercent > 0 ||
    hasCardTotalConfigured ||
    hasInstallmentsConfigured ||
    Boolean(product.texto_adicional_preco);
  const pixPrice =
    Number(product.preco_pix ?? 0) ||
    (pixDiscountPercent > 0 ? cardTotal * (1 - pixDiscountPercent / 100) : 0);
  const installmentCount = Number(product.parcelas_quantidade ?? 0) || 0;
  const installment =
    installmentCount > 0 ? cardTotal / installmentCount : cardTotal;
  const additionalPriceText = product.texto_adicional_preco || "";
  const freteTexto =
    product.frete_gratis_texto ||
    (product.frete_gratis_valor_minimo
      ? `Frete Grátis acima de ${formatBRL(product.frete_gratis_valor_minimo)}`
      : "Frete Grátis");

  const stockMax = Math.max(effectiveStock, 50);
  const stockPct = Math.min(100, (effectiveStock / stockMax) * 100);
  const stockColor =
    effectiveStock < 5
      ? "bg-red-500"
      : effectiveStock < 15
        ? "bg-amber-400"
        : "bg-green-500";
  const stockLabel = outOfStock
    ? "Produto esgotado"
    : effectiveStock < 5
      ? `Restam apenas ${effectiveStock} unidades!`
      : effectiveStock < 15
        ? `${effectiveStock} unidades disponíveis`
        : `Em estoque`;
  const stockLabelColor = outOfStock
    ? "text-red-600"
    : effectiveStock < 5
      ? "text-red-600"
      : effectiveStock < 15
        ? "text-amber-600"
        : "text-green-600";

  useEffect(() => {
    setQty((current) => Math.min(Math.max(1, current), qtyLimit));
  }, [qtyLimit]);

  return (
    <div
      className={`
        fixed inset-0 z-[2000] flex items-end
        transition-colors duration-300
        ${visible ? "bg-black/60 sm:bg-black/40" : "bg-transparent"}
      `}
      aria-modal="true"
      role="dialog"
      aria-label={`Detalhes: ${product.name}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-white flex flex-col w-full overflow-hidden
          shadow-2xl
          /* mobile */
          h-[94dvh] rounded-t-2xl
          /* desktop — full screen */
          sm:h-screen sm:rounded-none
          /* animação */
          transition-all duration-300 ease-out
          ${
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-full sm:translate-y-0 sm:opacity-0 opacity-0"
          }
        `}
      >
        <div
          className="
          relative flex items-center justify-between
          px-4 py-3 sm:px-8 sm:py-4
          border-b border-gray-100 flex-shrink-0
          bg-white z-10
        "
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full sm:hidden" />

          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleClose}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
              aria-label="Voltar ao catálogo"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Voltar
            </button>

            {product.category && (
              <span className="hidden sm:block w-px h-4 bg-gray-200" />
            )}

            {product.category && (
              <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
                {product.category}
              </span>
            )}
            {product.featured && (
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Destaque
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain sm:overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:h-full">
            <div
              className="
              flex flex-col
              sm:h-full sm:overflow-hidden
              sm:border-r sm:border-gray-100
              sm:bg-gray-50
            "
            >
              <div
                className="
                relative overflow-hidden bg-gray-50 group
                aspect-square
                sm:aspect-auto sm:flex-1
              "
              >
                <img
                  key={imgIdx}
                  src={images[imgIdx] || PLACEHOLDER}
                  alt={product.name}
                  className="
                    w-full h-full
                    object-contain
                    transition-opacity duration-200
                  "
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="
                        absolute left-3 top-1/2 -translate-y-1/2
                        w-10 h-10 bg-white/90 shadow-md rounded-full
                        flex items-center justify-center
                        hover:bg-white hover:scale-105
                        transition-all
                        sm:opacity-100
                        opacity-0 group-hover:opacity-100 focus:opacity-100
                      "
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="
                        absolute right-3 top-1/2 -translate-y-1/2
                        w-10 h-10 bg-white/90 shadow-md rounded-full
                        flex items-center justify-center
                        hover:bg-white hover:scale-105
                        transition-all
                        sm:opacity-100
                        opacity-0 group-hover:opacity-100 focus:opacity-100
                      "
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                  </>
                )}

                {product.featured && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm sm:hidden">
                    Destaque
                  </span>
                )}

                {outOfStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-600 text-white font-bold text-base px-5 py-2 rounded-full shadow">
                      Esgotado
                    </span>
                  </div>
                )}

                {images.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
                    {imgIdx + 1} / {images.length}
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div
                  className="
                  flex gap-2.5 overflow-x-auto
                  px-4 py-3
                  sm:px-6 sm:py-4
                  flex-shrink-0
                  sm:bg-gray-50 sm:border-t sm:border-gray-200
                "
                >
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`
                        flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-150
                        w-16 h-16 sm:w-20 sm:h-20
                        ${
                          imgIdx === i
                            ? "border-violet-500 shadow-md scale-105 ring-2 ring-violet-200"
                            : "border-gray-200 opacity-55 hover:opacity-100 hover:border-gray-300"
                        }
                      `}
                      aria-label={`Ver imagem ${i + 1}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="
              flex flex-col gap-5
              px-4 pb-8 pt-5
              sm:px-10 sm:py-8
              sm:h-full sm:overflow-y-auto
            "
            >
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/60 rounded-2xl p-5 space-y-2.5 border border-gray-100">
                {hasPricingDetails && originalPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      {formatBRL(originalPrice)}
                    </span>
                    {discountPercent > 0 && (
                      <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                        -{discountPercent.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {hasPricingDetails ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <Zap className="h-5 w-5 text-green-500 flex-shrink-0 self-center" />
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                        {formatBRL(pixPrice || cardTotal || product.price)}
                      </span>
                      <span className="text-base font-bold text-green-600">
                        no Pix
                      </span>
                    </div>
                    {(additionalPriceText || pixDiscountPercent > 0) && (
                      <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5 font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        {additionalPriceText ||
                          `${pixDiscountPercent.toFixed(0)}% de desconto à vista`}
                      </p>
                    )}

                    {(installmentCount > 0 || hasCardTotalConfigured) && (
                      <div className="border-t border-gray-200 pt-3">
                        {installmentCount > 0 && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                              ou{" "}
                              <strong className="text-gray-900 text-base">
                                {installmentCount}× de {formatBRL(installment)}
                              </strong>{" "}
                              <span className="text-green-600 font-semibold">
                                sem juros
                              </span>
                            </span>
                          </div>
                        )}
                        {hasCardTotalConfigured && (
                          <p className="text-xs text-gray-400 ml-6 mt-0.5">
                            Total no cartão: {formatBRL(cardTotal)}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <Zap className="h-5 w-5 text-green-500 flex-shrink-0 self-center" />
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                      {formatBRL(product.price)}
                    </span>
                    <span className="text-base font-bold text-green-600">
                      no Pix
                    </span>
                  </div>
                )}
              </div>
              {(product.exibir_frete_gratis ||
                product.exibir_compra_segura ||
                product.exibir_criptografia_ssl ||
                product.exibir_devolucao_gratis) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.exibir_frete_gratis && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 text-green-700 border border-green-100 px-3 py-2 text-xs font-semibold">
                      <Truck className="h-3.5 w-3.5" />
                      {freteTexto}
                    </span>
                  )}
                  {product.exibir_compra_segura && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 text-xs font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {product.compra_segura_texto || "Compra Segura"}
                    </span>
                  )}
                  {product.exibir_criptografia_ssl && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-2 text-xs font-semibold">
                      <Lock className="h-3.5 w-3.5" />
                      {product.criptografia_ssl_texto || "Criptografia SSL"}
                    </span>
                  )}
                  {product.exibir_devolucao_gratis && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 px-3 py-2 text-xs font-semibold">
                      <RotateCcw className="h-3.5 w-3.5" />
                      {product.devolucao_texto || "Devolução Grátis"}
                      {product.devolucao_dias
                        ? ` em até ${product.devolucao_dias} dias`
                        : ""}
                    </span>
                  )}
                </div>
              )}
              {variations.length > 0 && (
                <div className="space-y-4">
                  {variations.map((variacao) => (
                    <div key={variacao.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-800">
                          {variacao.nome}
                          {variacao.obrigatoria && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </span>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {variacao.opcoes.map((opcao) => {
                          const selected =
                            selectedOptions[variacao.id] === opcao.id;
                          const opcaoStock = Number(opcao.estoque ?? 0);
                          const opcaoOutOfStock =
                            Number.isFinite(opcaoStock) && opcaoStock <= 0;

                          let chipClass =
                            "relative px-3 py-2 rounded-xl border-2 text-sm font-semibold " +
                            "min-w-[44px] min-h-[44px] " +
                            "transition-all duration-150 " +
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ";

                          if (opcaoOutOfStock) {
                            if (selected) {
                              chipClass +=
                                "border-amber-400 bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed";
                            } else {
                              chipClass +=
                                "border-gray-200 bg-gray-50 text-gray-400 opacity-55 cursor-not-allowed hover:border-gray-300";
                            }
                          } else if (selected) {
                            chipClass +=
                              "border-violet-600 bg-violet-600 text-white shadow-md scale-[1.03]";
                          } else {
                            chipClass +=
                              "border-gray-200 bg-white text-gray-700 hover:border-violet-400 hover:bg-violet-50 cursor-pointer";
                          }

                          return (
                            <button
                              key={opcao.id}
                              type="button"
                              role="button"
                              aria-pressed={selected && !opcaoOutOfStock}
                              aria-disabled={opcaoOutOfStock}
                              aria-label={`${variacao.nome}: ${opcao.valor}${opcaoOutOfStock ? " — esgotado" : ""}`}
                              title={opcaoOutOfStock ? "Esgotado" : undefined}
                              onClick={() => {
                                setVariationError("");
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [variacao.id]:
                                    prev[variacao.id] === opcao.id
                                      ? variacao.obrigatoria
                                        ? opcao.id
                                        : undefined
                                      : opcao.id,
                                }));
                              }}
                              className={chipClass}
                            >
                              {opcao.valor}

                              {opcaoOutOfStock && (
                                <span
                                  aria-hidden="true"
                                  className="absolute -top-2 -right-2 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white border border-gray-300 shadow"
                                >
                                  <X
                                    className="h-2.5 w-2.5 text-red-400"
                                    strokeWidth={3}
                                  />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {variationError && (
                <p className="text-xs text-red-600 font-semibold">
                  {variationError}
                </p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-800">
                  Quantidade:
                </span>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-30"
                    aria-label="Diminuir"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-base font-extrabold text-gray-900 select-none">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(qtyLimit, q + 1))}
                    disabled={outOfStock || qty >= qtyLimit}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-30"
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className={`text-xs font-bold mb-2 ${stockLabelColor}`}>
                  {stockLabel}
                </p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${stockColor}`}
                    style={{ width: `${stockPct}%` }}
                  />
                </div>
              </div>
              <button
                onClick={
                  outOfStock
                    ? () =>
                        onNotifyRestock?.(product, buildSelectedVariations())
                    : handleBuyNow
                }
                disabled={adding || buyingNow}
                className={`
                  w-full flex items-center justify-center gap-3
                  py-4 sm:py-5 font-extrabold text-base sm:text-lg
                  transition-all duration-200 shadow-sm rounded-2xl border-2
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${
                    outOfStock
                      ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 focus:ring-amber-400"
                      : !tema
                        ? "bg-white text-violet-600 border-violet-600 hover:bg-violet-50 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 focus:ring-violet-500"
                        : "bg-white hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                  }
                `}
                style={
                  tema && !outOfStock
                    ? {
                        color: tema.botao_bg_de,
                        borderColor: tema.botao_bg_de,
                        borderRadius: tema.botao_borda_raio,
                      }
                    : undefined
                }
              >
                {buyingNow ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />{" "}
                    {outOfStock
                      ? "Avise-me quando estiver pronto"
                      : "Comprar Agora"}
                  </>
                )}
              </button>
              {!outOfStock && (
                <button
                  onClick={handleAdd}
                  disabled={adding || buyingNow}
                  className={`
                    w-full flex items-center justify-center gap-3
                    py-4 sm:py-5 font-extrabold text-base sm:text-lg
                    transition-all duration-200 shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${
                      added
                        ? "bg-green-500 text-white shadow-green-200 shadow-lg rounded-2xl"
                        : adding
                          ? "bg-violet-400 text-white scale-95 rounded-2xl"
                          : !tema
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-violet-200 hover:-translate-y-0.5 active:scale-95 rounded-2xl focus:ring-violet-500"
                            : "hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                    }
                  `}
                  style={
                    tema && !added && !adding
                      ? {
                          background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                          color: tema.botao_texto_cor,
                          borderRadius: tema.botao_borda_raio,
                        }
                      : undefined
                  }
                >
                  {added ? (
                    <>
                      <Check className="h-5 w-5" /> Adicionado ao carrinho!
                    </>
                  ) : adding ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Adicionando…
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
                    </>
                  )}
                </button>
              )}
              {product.description && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                    Descrição do produto
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
              <div className="h-2 sm:h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
