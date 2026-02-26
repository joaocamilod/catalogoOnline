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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAllVendedores } from "../lib/supabase";
import Dialog from "./Dialog";
import PaymentModal from "./PaymentModal";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );

function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  total,
  tema,
}) {
  const navigate = useNavigate();

  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerLoadError, setSellerLoadError] = useState("");
  const [sellerValidationError, setSellerValidationError] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [manualSellerName, setManualSellerName] = useState("");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const selectedSeller = useMemo(
    () => sellers.find((seller) => seller.id === selectedSellerId) ?? null,
    [sellers, selectedSellerId],
  );

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

  const handleCheckout = () => {
    setManualSellerName("");
    onClose();
    setIsSellerDialogOpen(true);
    loadSellers();
  };

  const handleConfirmSeller = () => {
    const sellerName = selectedSeller?.nome || manualSellerName.trim();
    if (!sellerName) {
      setSellerValidationError(
        "Selecione ou informe um vendedor para continuar.",
      );
      return;
    }

    const phoneDigits = (selectedSeller?.telefone_whatsapp ?? "").replace(
      /\D/g,
      "",
    );
    if (selectedSeller && (!phoneDigits || phoneDigits.length < 10)) {
      setSellerValidationError(
        "Este vendedor não possui WhatsApp válido cadastrado para envio da venda.",
      );
      return;
    }

    setIsSellerDialogOpen(false);
    setSellerValidationError("");
    setIsPaymentModalOpen(true);
  };

  const handlePaymentBack = () => {
    setIsPaymentModalOpen(false);
    setIsSellerDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    onClearCart();
  };

  const handleBackToStore = () => {
    onClose();
    navigate("/");
  };

  if (!isOpen && !isSellerDialogOpen && !isPaymentModalOpen) return null;

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
            <div
              className={`flex items-center justify-between px-5 py-4 flex-shrink-0 ${!tema ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white" : ""}`}
              style={
                tema
                  ? {
                      background: `linear-gradient(to right, ${tema.header_bg_de}, ${tema.header_bg_para})`,
                      color: tema.header_texto_cor,
                    }
                  : undefined
              }
            >
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
                  className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ${!tema ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white" : ""}`}
                  style={
                    tema
                      ? {
                          background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                          color: tema.botao_texto_cor,
                          borderRadius: tema.botao_borda_raio,
                        }
                      : undefined
                  }
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
                        <span
                          className={`text-sm font-bold ${!tema ? "text-indigo-600" : ""}`}
                          style={
                            tema ? { color: tema.cor_primaria } : undefined
                          }
                        >
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
                    <span
                      className={`text-2xl font-extrabold ${!tema ? "text-indigo-600" : ""}`}
                      style={tema ? { color: tema.cor_primaria } : undefined}
                    >
                      {formatBRL(total)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    className={`w-full flex items-center justify-center gap-2 py-3 font-bold hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${!tema ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl focus:ring-indigo-500" : ""}`}
                    style={
                      tema
                        ? {
                            background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                            color: tema.botao_texto_cor,
                            borderRadius: tema.botao_borda_raio,
                          }
                        : undefined
                    }
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
          <div
            className="rounded-xl border px-3 py-2.5"
            style={
              tema
                ? {
                    borderColor: tema.cor_primaria + "30",
                    backgroundColor: tema.cor_primaria + "10",
                  }
                : {
                    borderColor: "#e0e7ff",
                    backgroundColor: "rgba(238,242,255,0.7)",
                  }
            }
          >
            <p
              className="text-sm"
              style={tema ? { color: tema.cor_primaria } : { color: "#312e81" }}
            >
              Selecione o vendedor responsável para concluir o pedido.
            </p>
            <p
              className="text-xs mt-1"
              style={
                tema ? { color: tema.cor_secundaria } : { color: "#4338ca" }
              }
            >
              Total da venda: <strong>{formatBRL(total)}</strong>
            </p>
          </div>

          {loadingSellers ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-8">
              <Loader2
                className="h-4 w-4 animate-spin"
                style={
                  tema ? { color: tema.cor_primaria } : { color: "#4f46e5" }
                }
              />
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
                        ? !tema
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                          : ""
                        : !tema
                          ? "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                          : "border-gray-200 bg-white"
                    }`}
                    style={
                      tema && isSelected
                        ? {
                            borderColor: tema.cor_primaria,
                            backgroundColor: tema.cor_primaria + "10",
                            boxShadow: `0 0 0 2px ${tema.cor_primaria}30`,
                          }
                        : undefined
                    }
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
                        className="mt-1"
                        style={
                          tema
                            ? { accentColor: tema.cor_primaria }
                            : { accentColor: "#4f46e5" }
                        }
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <UserRound
                            className="h-4 w-4"
                            style={
                              tema
                                ? { color: tema.cor_primaria }
                                : { color: "#4f46e5" }
                            }
                          />
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
              onClick={handleConfirmSeller}
              disabled={loadingSellers}
              className={`px-4 py-2 text-sm font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${!tema ? "text-white bg-indigo-600 hover:bg-indigo-700" : "hover:opacity-90"}`}
              style={
                tema
                  ? {
                      backgroundColor: tema.cor_primaria,
                      color: tema.botao_texto_cor,
                    }
                  : undefined
              }
            >
              Próximo →
            </button>
          </div>
        </div>
      </Dialog>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onBack={handlePaymentBack}
        seller={selectedSeller}
        manualSellerName={manualSellerName}
        items={items}
        tema={tema}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

export default Cart;
