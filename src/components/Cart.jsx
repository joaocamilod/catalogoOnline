import { useEffect } from 'react'
import { FaShoppingCart, FaTimes, FaShoppingBag, FaTrash, FaCreditCard } from 'react-icons/fa'
import './Cart.css'

function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onClearCart, total }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleCheckout = () => {
    alert('Funcionalidade de checkout em desenvolvimento!\n\nTotal: ' + formatPrice(total))
  }

  if (!isOpen) return null

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>
            <FaShoppingCart className="cart-header-icon" />
            Seu Carrinho
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <FaShoppingBag className="empty-cart-icon" />
            <h3>Carrinho vazio</h3>
            <p>Adicione produtos ao seu carrinho</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">{formatPrice(item.price)}</p>
                    
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-item-total">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveItem(item.id)}
                      title="Remover item"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <button className="clear-cart-btn" onClick={onClearCart}>
                Limpar Carrinho
              </button>

              <div className="cart-total">
                <span className="total-label">Total:</span>
                <span className="total-value">{formatPrice(total)}</span>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                <FaCreditCard />
                Finalizar Compra
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Cart
