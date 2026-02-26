import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  Package,
  Phone,
  Send,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { createSale } from "../lib/supabase";
import styles from "./PaymentModal.module.css";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );

const normalizePhone = (value = "") => value.replace(/\D/g, "");

const PAYMENT_METHODS = [
  {
    id: "pix",
    label: "PIX",
    Icon: Zap,
    sub: "Desconto imediato",
    defaultColor: "#00b37e",
  },
  {
    id: "credito",
    label: "Cartão de Crédito",
    Icon: CreditCard,
    sub: "Parcelamento",
    defaultColor: "#7c3aed",
  },
  {
    id: "debito",
    label: "Cartão de Débito",
    Icon: CreditCard,
    sub: "Débito à vista",
    defaultColor: "#2563eb",
  },
  {
    id: "dinheiro",
    label: "Dinheiro",
    Icon: Banknote,
    sub: "Pagamento físico",
    defaultColor: "#d97706",
  },
];

function getItemUnitPrice(product, method) {
  switch (method) {
    case "pix": {
      if (product.preco_pix != null && product.preco_pix > 0) {
        return product.preco_pix;
      }
      const disc = product.desconto_pix_percentual ?? 0;
      return product.price * (1 - disc / 100);
    }
    case "credito": {
      if (product.total_cartao != null && product.total_cartao > 0) {
        return product.total_cartao;
      }
      return product.price;
    }
    case "debito":
    case "dinheiro":
    default:
      return product.price;
  }
}

function buildWhatsAppMessage({
  orderId,
  sellerName,
  buyerName,
  buyerPhone,
  buyerEmail,
  items,
  totals,
  paymentMethod,
}) {
  const methodMeta =
    PAYMENT_METHODS.find((m) => m.id === paymentMethod) ?? PAYMENT_METHODS[0];

  const itemLines = items
    .map((item) => {
      const unitPrice = getItemUnitPrice(item.product, paymentMethod);
      return `  • ${item.quantity}x ${item.product.name} — ${formatBRL(unitPrice * item.quantity)}`;
    })
    .join("\n");

  let msg =
    `Olá ${sellerName || "vendedor"}, sou ${buyerName || "um cliente"} e gostaria de fazer um pedido!\n\n` +
    (orderId ? `*Pedido Nº ${orderId}*\n\n` : "") +
    `*Itens do pedido:*\n${itemLines}\n\n` +
    `*Forma de pagamento:* ${methodMeta.label}\n\n`;

  if (totals.discount > 0) {
    msg +=
      `Subtotal: ${formatBRL(totals.subtotal)}\n` +
      `Desconto (${methodMeta.label}): −${formatBRL(totals.discount)}\n`;
  } else if (totals.surcharge > 0) {
    msg +=
      `Subtotal: ${formatBRL(totals.subtotal)}\n` +
      `Taxa (${methodMeta.label}): +${formatBRL(totals.surcharge)}\n`;
  }

  msg += `*Total: ${formatBRL(totals.total)}*`;

  if (buyerPhone) msg += `\n\nMeu telefone: ${buyerPhone}`;
  if (buyerEmail) msg += `\nMeu e-mail: ${buyerEmail}`;

  msg += "\n\nAguardo confirmação. Obrigado(a)!";
  return msg;
}

function PaymentModal({
  isOpen,
  onClose,
  onBack,
  seller,
  manualSellerName,
  items,
  tema,
  onSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [generalError, setGeneralError] = useState("");

  const firstBtnRef = useRef(null);
  const sellerName = seller?.nome || manualSellerName || "Vendedor";

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod("pix");
      setBuyerName("");
      setBuyerPhone("");
      setBuyerEmail("");
      setSending(false);
      setSuccess(false);
      setOrderId(null);
      setGeneralError("");
    } else {
      const timer = setTimeout(() => firstBtnRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, item) => s + item.product.price * item.quantity,
      0,
    );
    const methodTotal = items.reduce(
      (s, item) =>
        s + getItemUnitPrice(item.product, paymentMethod) * item.quantity,
      0,
    );

    const diff = methodTotal - subtotal;
    const discount = diff < 0 ? Math.abs(diff) : 0;
    const surcharge = diff > 0 ? diff : 0;

    let installments = null;
    if (paymentMethod === "credito") {
      const maxParcelas = Math.max(
        ...items.map((i) => i.product.parcelas_quantidade ?? 1),
      );
      if (maxParcelas > 1) {
        installments = {
          count: maxParcelas,
          value: methodTotal / maxParcelas,
        };
      }
    }

    return { subtotal, total: methodTotal, discount, surcharge, installments };
  }, [items, paymentMethod]);

  const stockErrorIds = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.product.stock > 0 && item.quantity > item.product.stock,
        )
        .map((item) => item.product.id),
    [items],
  );
  const hasStockError = stockErrorIds.length > 0;

  const handleConfirm = async () => {
    if (hasStockError) return;
    setSending(true);
    setGeneralError("");

    let createdId = null;

    try {
      if (seller?.id) {
        const itensVenda = items.map((item) => ({
          produto_id: item.product.id,
          nome: item.product.name,
          preco: getItemUnitPrice(item.product, paymentMethod),
          quantidade: item.quantity,
          imagem: item.product.image ?? null,
        }));

        const saleData = await createSale({
          vendedor_id: seller.id,
          itens: itensVenda,
          total: totals.total,
          comprador_nome: buyerName || undefined,
          comprador_telefone: buyerPhone || undefined,
          comprador_email: buyerEmail || undefined,
          url_imagem: items[0]?.product.image ?? undefined,
          meio_pagamento: paymentMethod,
        });

        createdId = saleData?.id ?? null;
        setOrderId(createdId);
      }

      const phoneDigits = normalizePhone(seller?.telefone_whatsapp ?? "");
      if (phoneDigits && phoneDigits.length >= 10) {
        const waNumber = phoneDigits.startsWith("55")
          ? phoneDigits
          : `55${phoneDigits}`;

        const msg = buildWhatsAppMessage({
          orderId: createdId ? createdId.slice(0, 8).toUpperCase() : null,
          sellerName,
          buyerName,
          buyerPhone,
          buyerEmail,
          items,
          totals,
          paymentMethod,
        });

        const link = document.createElement("a");
        link.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Erro ao confirmar pedido:", err);
      setGeneralError(
        "Ocorreu um erro ao registrar o pedido. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleFinish = () => {
    onSuccess?.();
  };

  if (!isOpen) return null;

  const primaryColor = tema?.cor_primaria ?? "#7c3aed";

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Modal de forma de pagamento"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>Forma de pagamento</h2>
            <p className={styles.sellerBadge}>Vendedor: {sellerName}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal de pagamento"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>
              <CheckCircle2 className="h-8 w-8" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <h3 className={styles.successTitle}>
                Pedido enviado com sucesso!
              </h3>
              {orderId && (
                <p className={styles.successOrderId}>
                  Pedido Nº {orderId.slice(0, 8).toUpperCase()}
                </p>
              )}
              <p className={styles.successDesc}>
                O WhatsApp foi aberto com o resumo do pedido. O vendedor entrará
                em contato em breve.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className={styles.btnClose}
              style={
                tema
                  ? {
                      background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                      color: tema.botao_texto_cor,
                    }
                  : undefined
              }
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className={styles.body}>
              <div>
                <p className={styles.sectionTitle}>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Método de pagamento
                </p>
                <div
                  className={styles.paymentGrid}
                  role="group"
                  aria-label="Selecione o método de pagamento"
                >
                  {PAYMENT_METHODS.map((method, idx) => {
                    const { Icon } = method;
                    const selected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        ref={idx === 0 ? firstBtnRef : null}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`${styles.paymentOption} ${selected ? styles.paymentOptionSelected : ""}`}
                        aria-pressed={selected}
                        style={
                          selected
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: primaryColor + "12",
                                boxShadow: `0 0 0 2px ${primaryColor}30`,
                              }
                            : undefined
                        }
                      >
                        <Icon
                          className="h-5 w-5"
                          aria-hidden="true"
                          style={{
                            color: selected ? primaryColor : "#9ca3af",
                          }}
                        />
                        <span className={styles.paymentOptionLabel}>
                          {method.label}
                        </span>
                        <span className={styles.paymentOptionSub}>
                          {method.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={styles.sectionTitle}>
                  <Package className="h-4 w-4" aria-hidden="true" />
                  Resumo do pedido
                </p>
                <div className={styles.itemsList} aria-label="Itens do pedido">
                  {items.map((item) => {
                    const unitPrice = getItemUnitPrice(
                      item.product,
                      paymentMethod,
                    );
                    const hasErr = stockErrorIds.includes(item.product.id);
                    return (
                      <div
                        key={item.product.id}
                        className={`${styles.itemRow} ${hasErr ? styles.itemRowError : ""}`}
                      >
                        <img
                          src={
                            item.product.image ||
                            "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png"
                          }
                          alt={item.product.name}
                          className={styles.itemImg}
                        />
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName}>{item.product.name}</p>
                          <p className={styles.itemUnitPrice}>
                            {formatBRL(unitPrice)} un.
                          </p>
                          {hasErr && (
                            <p className={styles.stockError} role="alert">
                              ⚠ Estoque insuficiente (disp.&nbsp;
                              {item.product.stock})
                            </p>
                          )}
                        </div>
                        <span className={styles.itemQty}>{item.quantity}x</span>
                        <span
                          className={styles.itemPrice}
                          style={{ color: primaryColor }}
                        >
                          {formatBRL(unitPrice * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.totalsBox} aria-label="Resumo de valores">
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatBRL(totals.subtotal)}</span>
                </div>

                {totals.discount > 0 && (
                  <div
                    className={`${styles.totalRow} ${styles.totalRowHighlight}`}
                  >
                    <span>
                      Desconto&nbsp;(
                      {
                        PAYMENT_METHODS.find((m) => m.id === paymentMethod)
                          ?.label
                      }
                      )
                    </span>
                    <span>−&nbsp;{formatBRL(totals.discount)}</span>
                  </div>
                )}

                {totals.surcharge > 0 && (
                  <div className={`${styles.totalRow} ${styles.totalRowTax}`}>
                    <span>
                      Taxa&nbsp;(
                      {
                        PAYMENT_METHODS.find((m) => m.id === paymentMethod)
                          ?.label
                      }
                      )
                    </span>
                    <span>+&nbsp;{formatBRL(totals.surcharge)}</span>
                  </div>
                )}

                <hr className={styles.divider} />

                <div className={styles.totalFinal}>
                  <span>Total</span>
                  <span
                    className={styles.totalFinalValue}
                    style={{ color: primaryColor }}
                  >
                    {formatBRL(totals.total)}
                  </span>
                </div>

                {totals.installments && (
                  <p className={styles.installmentNote}>
                    ou {totals.installments.count}x de&nbsp;
                    {formatBRL(totals.installments.value)} sem juros
                  </p>
                )}
              </div>

              <div>
                <p className={styles.sectionTitle}>
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Seus dados&nbsp;
                  <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                    (opcional)
                  </span>
                </p>
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <UserRound
                      className={styles.inputIcon}
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Seu nome"
                      className={styles.input}
                      aria-label="Seu nome"
                    />
                  </div>
                  <div className={styles.inputWrapper}>
                    <Phone className={styles.inputIcon} aria-hidden="true" />
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="Telefone / WhatsApp"
                      className={styles.input}
                      aria-label="Telefone ou WhatsApp"
                    />
                  </div>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} aria-hidden="true" />
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="E-mail (opcional)"
                      className={styles.input}
                      aria-label="E-mail"
                    />
                  </div>
                </div>
              </div>

              {hasStockError && (
                <div className={styles.errorBanner} role="alert">
                  <AlertCircle
                    style={{
                      width: "1rem",
                      height: "1rem",
                      flexShrink: 0,
                      marginTop: "0.0625rem",
                    }}
                    aria-hidden="true"
                  />
                  <span>
                    Alguns itens estão com estoque insuficiente. Ajuste as
                    quantidades no carrinho para continuar.
                  </span>
                </div>
              )}

              {generalError && (
                <div className={styles.errorBanner} role="alert">
                  <AlertCircle
                    style={{
                      width: "1rem",
                      height: "1rem",
                      flexShrink: 0,
                      marginTop: "0.0625rem",
                    }}
                    aria-hidden="true"
                  />
                  <span>{generalError}</span>
                </div>
              )}
            </div>

            <div className={styles.footer}>
              <button type="button" onClick={onBack} className={styles.btnBack}>
                ← Voltar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={sending || hasStockError}
                className={styles.btnConfirm}
                style={
                  tema && !sending
                    ? {
                        background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                        color: tema.botao_texto_cor,
                      }
                    : undefined
                }
              >
                {sending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Processando…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Confirmar e Enviar Pedido
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
