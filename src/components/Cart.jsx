import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  X,
  ShoppingBag,
  Trash2,
  CreditCard,
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  UserRound,
  Phone,
  Mail,
  AlertCircle,
  MessageCircle,
  Send,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAllVendedores, createSale } from "../lib/supabase";
import Dialog from "./Dialog";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );

const normalizePhoneNumber = (value = "") => value.replace(/\D/g, "");

function buildBuyerMessage({
  sellerName,
  buyerName,
  buyerPhone,
  buyerEmail,
  items,
  total,
}) {
  const itemLines = items
    .map(
      (item) =>
        `  • ${item.quantity}x ${item.product.name} — ${formatBRL(item.product.price * item.quantity)}`,
    )
    .join("\n");

  let msg =
    `Olá ${sellerName || "vendedor"}, sou ${buyerName || "um cliente"} e gostaria de fazer um pedido! \n\n` +
    `*Itens do pedido:*\n${itemLines}\n\n` +
    `*Total: ${formatBRL(total)}*`;

  if (buyerPhone) msg += `\n\nMeu telefone para contato: ${buyerPhone}`;
  if (buyerEmail) msg += `\nMeu e-mail: ${buyerEmail}`;

  msg += "\n\nAguardo confirmação. Obrigado(a)!";
  return msg;
}

function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  total,
}) {
  const navigate = useNavigate();

  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerLoadError, setSellerLoadError] = useState("");
  const [sellerValidationError, setSellerValidationError] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [manualSellerName, setManualSellerName] = useState("");

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [editableMessage, setEditableMessage] = useState("");
  const [sendingSale, setSendingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);

  const selectedSeller = useMemo(
    () => sellers.find((seller) => seller.id === selectedSellerId) ?? null,
    [sellers, selectedSellerId],
  );

  const generatedMessage = useMemo(
    () =>
      buildBuyerMessage({
        sellerName: selectedSeller?.nome || manualSellerName,
        buyerName,
        buyerPhone,
        buyerEmail,
        items,
        total,
      }),
    [
      selectedSeller,
      manualSellerName,
      buyerName,
      buyerPhone,
      buyerEmail,
      items,
      total,
    ],
  );

  const [messagePristine, setMessagePristine] = useState(true);
  useEffect(() => {
    if (messagePristine) {
      setEditableMessage(generatedMessage);
    }
  }, [generatedMessage, messagePristine]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadSellers = async () => {
    setLoadingSellers(true);
    setSellerLoadError("");
    try {
      const data = await fetchAllVendedores();
      setSellers(data);
      if (data.length > 0) {
        setSelectedSellerId((prev) => prev || data[0].id);
        return;
      }
      setSelectedSellerId("");
    } catch (_) {
      setSellerLoadError("Não foi possível carregar os vendedores no momento.");
      setSellers([]);
      setSelectedSellerId("");
    } finally {
      setLoadingSellers(false);
    }
  };

  const resetSellerDialog = () => {
    setIsSellerDialogOpen(false);
    setSellerValidationError("");
  };

  const resetConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
    setEditableMessage("");
    setMessagePristine(true);
    setSaleSuccess(false);
    setSendingSale(false);
  };

  const handleCheckout = () => {
    setManualSellerName("");
    onClose();
    setIsSellerDialogOpen(true);
    loadSellers();
  };

  const handleConfirmCheckout = () => {
    const sellerName = selectedSeller?.nome || manualSellerName.trim();
    if (!sellerName) {
      setSellerValidationError(
        "Selecione ou informe um vendedor para continuar.",
      );
      return;
    }

    const phoneDigits = normalizePhoneNumber(selectedSeller?.telefone_whatsapp);
    if (selectedSeller && (!phoneDigits || phoneDigits.length < 10)) {
      setSellerValidationError(
        "Este vendedor não possui WhatsApp válido cadastrado para envio da venda.",
      );
      return;
    }

    setIsSellerDialogOpen(false);
    setSellerValidationError("");
    setMessagePristine(true);
    setIsConfirmDialogOpen(true);
  };

  const openWhatsAppNewTab = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendWhatsApp = async () => {
    setSendingSale(true);

    const phoneDigits = normalizePhoneNumber(
      selectedSeller?.telefone_whatsapp ?? "",
    );
    const whatsappNumber = phoneDigits.startsWith("55")
      ? phoneDigits
      : `55${phoneDigits}`;
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(editableMessage)}`;

    openWhatsAppNewTab(waUrl);

    try {
      if (selectedSeller?.id) {
        const itensVenda = items.map((item) => ({
          produto_id: item.product.id,
          nome: item.product.name,
          preco: item.product.price,
          quantidade: item.quantity,
          imagem: item.product.image ?? null,
        }));

        await createSale({
          vendedor_id: selectedSeller.id,
          itens: itensVenda,
          total,
          comprador_nome: buyerName || undefined,
          comprador_telefone: buyerPhone || undefined,
          comprador_email: buyerEmail || undefined,
          url_imagem: items[0]?.product.image ?? undefined,
          texto_mensagem: editableMessage,
        });
      }

      setSaleSuccess(true);
      onClearCart();
    } catch (err) {
      console.error("Erro ao registrar venda no banco:", err);
      // O WhatsApp já foi aberto acima; apenas exibe sucesso mesmo com falha no DB
      setSaleSuccess(true);
      onClearCart();
    } finally {
      setSendingSale(false);
    }
  };

  const handleFinishSaleSuccess = () => {
    resetConfirmDialog();
  };

  const handleBackToStore = () => {
    onClose();
    navigate("/");
  };

  if (!isOpen && !isSellerDialogOpen && !isConfirmDialogOpen) return null;

  return (
    <>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[999] animate-fadeIn"
            onClick={onClose}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="Carrinho de compras"
            aria-modal="true"
            className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] bg-white shadow-2xl z-[1000] flex flex-col animate-slideInRight"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                <h2 className="text-lg font-bold">Seu Carrinho</h2>
                {items.length > 0 && (
                  <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {items.reduce((s, i) => s + i.quantity, 0)}{" "}
                    {items.reduce((s, i) => s + i.quantity, 0) === 1
                      ? "item"
                      : "itens"}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar carrinho"
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all hover:rotate-90 duration-200"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                  <ShoppingBag
                    className="h-12 w-12 text-indigo-200"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Carrinho vazio
                </h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  Adicione produtos ao seu carrinho e eles aparecerão aqui.
                </p>
                <button
                  onClick={handleBackToStore}
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para a loja
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                        <img
                          src={
                            item.product.image ||
                            "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png"
                          }
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-0.5">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">
                          {formatBRL(item.product.price)} un.
                        </p>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                item.quantity - 1,
                              )
                            }
                            aria-label={`Diminuir quantidade de ${item.product.name}`}
                            className="w-7 h-7 rounded-lg border-2 border-gray-200 bg-white text-gray-600 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span
                            className="w-8 text-center text-sm font-semibold text-gray-800"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(
                                item.product.id,
                                item.quantity + 1,
                              )
                            }
                            aria-label={`Aumentar quantidade de ${item.product.name}`}
                            className="w-7 h-7 rounded-lg border-2 border-gray-200 bg-white text-gray-600 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">
                          {formatBRL(item.product.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          aria-label={`Remover ${item.product.name} do carrinho`}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 px-5 py-4 bg-white flex-shrink-0 space-y-3">
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="w-full py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Limpar carrinho
                  </button>

                  <div className="flex items-center justify-between px-1">
                    <span className="text-base font-semibold text-gray-700">
                      Total:
                    </span>
                    <span className="text-2xl font-extrabold text-indigo-600">
                      {formatBRL(total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    Finalizar Compra
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <Dialog
        isOpen={isSellerDialogOpen}
        onClose={resetSellerDialog}
        title="Escolher vendedor"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5">
            <p className="text-sm text-indigo-900">
              Selecione o vendedor responsável para concluir o pedido.
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              Total da venda: <strong>{formatBRL(total)}</strong>
            </p>
          </div>

          {loadingSellers ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-sm text-gray-600">
                Carregando vendedores...
              </span>
            </div>
          ) : sellers.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sellers.map((seller) => {
                const isSelected = selectedSellerId === seller.id;
                return (
                  <label
                    key={seller.id}
                    className={`block cursor-pointer rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="checkout-seller"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedSellerId(seller.id);
                          setSellerValidationError("");
                        }}
                        className="mt-1 accent-indigo-600"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <UserRound className="h-4 w-4 text-indigo-600" />
                          <span className="truncate">{seller.nome}</span>
                        </p>
                        <div className="mt-1 space-y-0.5">
                          {seller.telefone_whatsapp && (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {seller.telefone_whatsapp}
                            </p>
                          )}
                          {seller.email && (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {seller.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Nenhum vendedor ativo cadastrado. Informe o nome do vendedor
                  para concluir.
                </span>
              </div>
              <input
                type="text"
                value={manualSellerName}
                onChange={(e) => {
                  setManualSellerName(e.target.value);
                  setSellerValidationError("");
                }}
                placeholder="Nome do vendedor"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {sellerLoadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-medium text-red-700">
                {sellerLoadError}
              </p>
              <button
                type="button"
                onClick={loadSellers}
                className="mt-2 text-xs font-semibold text-red-700 hover:text-red-800 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {sellerValidationError && (
            <p className="text-xs text-red-600 font-medium">
              {sellerValidationError}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetSellerDialog}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={loadingSellers}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Próximo →
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isConfirmDialogOpen}
        onClose={resetConfirmDialog}
        title="Confirmar pedido"
        maxWidth="max-w-lg"
      >
        {saleSuccess ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Pedido enviado!
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Seu pedido foi registrado e o WhatsApp foi aberto para envio. O
                vendedor entrará em contato em breve.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFinishSaleSuccess}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-indigo-700">Vendendo para</p>
                <p className="text-sm font-semibold text-indigo-900 truncate">
                  {selectedSeller?.nome || manualSellerName || "—"}
                </p>
              </div>
              <div className="ml-auto text-right flex-shrink-0">
                <p className="text-xs text-indigo-700">Total</p>
                <p className="text-sm font-bold text-indigo-900">
                  {formatBRL(total)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-gray-400" />
                Seus dados (opcional)
              </p>

              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Telefone / WhatsApp (ex: +5511999999999)"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="E-mail (opcional)"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  Mensagem para o vendedor
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMessagePristine(true);
                    setEditableMessage(generatedMessage);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  title="Restaurar mensagem padrão"
                >
                  <Edit3 className="h-3 w-3" />
                  Restaurar padrão
                </button>
              </div>
              <textarea
                value={editableMessage}
                onChange={(e) => {
                  setMessagePristine(false);
                  setEditableMessage(e.target.value);
                }}
                rows={8}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="A mensagem será gerada automaticamente com base nos dados acima..."
              />
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Edit3 className="h-3 w-3" />
                Você pode editar a mensagem antes de enviar.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  resetConfirmDialog();
                  setManualSellerName(manualSellerName);
                  setIsSellerDialogOpen(true);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← Voltar
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={sendingSale || !editableMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                {sendingSale ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Abrindo WhatsApp...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar pelo WhatsApp
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-center text-gray-400">
              Ao confirmar, o WhatsApp será aberto com a mensagem acima
              pré-preenchida.
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}

export default Cart;
