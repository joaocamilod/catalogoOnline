import { useEffect } from "react";
import {
  ShoppingCart,
  X,
  ShoppingBag,
  Trash2,
  CreditCard,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
}) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCheckout = () => {
    alert(
      "Funcionalidade de checkout em desenvolvimento!\n\nTotal: " +
        formatBRL(total),
    );
  };

  const handleBackToStore = () => {
    onClose();
    navigate("/");
  };

  if (!isOpen) return null;

  return (
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
                          onUpdateQuantity(item.product.id, item.quantity - 1)
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
                          onUpdateQuantity(item.product.id, item.quantity + 1)
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
  );
}

export default Cart;
