import { useState } from 'react'
import { FaStar, FaShoppingCart, FaCheck } from 'react-icons/fa'
import './ProductCard.css'

function ProductCard({ product, onAddToCart }) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    setIsAdding(true)
    onAddToCart(product)
    setTimeout(() => setIsAdding(false), 600)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
        {product.stock < 10 && product.stock > 0 && (
          <span className="stock-badge low">Últimas unidades!</span>
        )}
        {product.stock === 0 && (
          <span className="stock-badge out">Esgotado</span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-rating">
          <div className="stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar 
                key={i} 
                className={i < Math.floor(product.rating) ? 'star filled' : 'star'}
              />
            ))}
          </div>
          <span className="rating-value">{product.rating.toFixed(1)}</span>
        </div>

        <div className="product-footer">
          <div className="price-section">
            <span className="product-price">{formatPrice(product.price)}</span>
            <span className="stock-info">
              {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
            </span>
          </div>

          <button
            className={`add-to-cart-btn ${isAdding ? 'adding' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
          >
            {isAdding ? (
              <>
                <FaCheck className="btn-icon" />
                Adicionado!
              </>
            ) : (
              <>
                <FaShoppingCart className="btn-icon" />
                Adicionar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
