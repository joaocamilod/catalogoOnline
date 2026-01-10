import { FaSearch } from 'react-icons/fa'
import ProductCard from './ProductCard'
import './ProductGrid.css'

function ProductGrid({ products, onAddToCart }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <FaSearch className="empty-icon" />
        <h3>Nenhum produto encontrado</h3>
        <p>Tente ajustar seus filtros ou termo de busca</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}

export default ProductGrid
