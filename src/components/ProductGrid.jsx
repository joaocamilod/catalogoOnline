import { FaSearch } from "react-icons/fa";
import ProductCard from "./ProductCard";

function ProductGrid({ products, onAddToCart, onProductClick, tema }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-xl shadow-sm text-center border border-gray-100">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <FaSearch className="text-3xl text-gray-300" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          Nenhum produto encontrado
        </h3>
        <p className="text-gray-400 text-sm">
          Tente ajustar seus filtros ou o termo de busca.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        grid gap-5
        grid-cols-2
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        animate-fadeIn
      "
      aria-label={`${products.length} produto${products.length !== 1 ? "s" : ""} encontrado${products.length !== 1 ? "s" : ""}`}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onProductClick={onProductClick}
          tema={tema}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
