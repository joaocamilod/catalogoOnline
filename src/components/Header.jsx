import { FaShoppingBag, FaSearch, FaShoppingCart } from 'react-icons/fa'
import './Header.css'

function Header({ searchTerm, onSearchChange, cartCount, onCartClick }) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="logo">
            <FaShoppingBag className="logo-icon" />
            <h1>Catálogo Online</h1>
          </div>

          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          <button className="cart-button" onClick={onCartClick}>
            <FaShoppingCart className="cart-icon" />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
            <span className="cart-text">Carrinho</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
