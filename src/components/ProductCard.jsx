import { useState } from "react";
import { FaStar, FaShoppingCart, FaCheck, FaEye } from "react-icons/fa";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(Number(value)) ? Number(value) : 0,
  );

const PLACEHOLDER =
  "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png";

function ProductCard({ product, onAddToCart, onProductClick }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 700);
  };

  const handleCardClick = () => {
    onProductClick?.(product);
  };

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < 10;
  const rating = product.rating ?? 5;

  return (
    <article
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Ver detalhes de ${product.name}`}
      className="
        bg-white rounded-xl shadow-sm border border-gray-100
        hover:shadow-xl hover:-translate-y-1.5 hover:border-violet-300
        transition-all duration-200
        overflow-hidden flex flex-col
        cursor-pointer group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2
      "
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={product.image || PLACEHOLDER}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 bg-white/95 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
            <FaEye className="text-violet-500" />
            Ver detalhes
          </span>
        </div>

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
        {product.category && (
          <span className="absolute bottom-2 left-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 mb-1 leading-snug group-hover:text-violet-700 transition-colors">
          {product.name}
        </h3>

        {product.description ? (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        ) : (
          <div className="mb-3" />
        )}

        <div
          className="flex items-center gap-1.5 mb-4"
          role="img"
          aria-label={`Avaliação ${rating.toFixed(1)} de 5`}
        >
          <div className="flex gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar
                key={i}
                className={`text-xs ${
                  i < Math.floor(rating) ? "text-amber-400" : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-xl font-extrabold text-violet-600">
                {formatBRL(product.price)}
              </span>
              <p className="text-xs text-green-600 font-medium">
                {formatBRL(product.price * 0.95)} no Pix
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {product.stock > 0
                ? `${product.stock} em estoque`
                : "Indisponível"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || isAdding}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className={`
              w-full flex items-center justify-center gap-2
              py-2.5 rounded-lg font-semibold text-sm
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
              ${
                outOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isAdding
                    ? "bg-green-500 text-white scale-95"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              }
            `}
          >
            {isAdding ? (
              <>
                <FaCheck className="text-sm" aria-hidden="true" />
                Adicionado!
              </>
            ) : (
              <>
                <FaShoppingCart className="text-sm" aria-hidden="true" />
                {outOfStock ? "Indisponível" : "Adicionar"}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
