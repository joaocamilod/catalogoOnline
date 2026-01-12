import { FaShoppingBag, FaSearch, FaShoppingCart, FaBars } from 'react-icons/fa'
import './Header.css'

function Header({ searchTerm, onSearchChange, cartCount, onCartClick, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <button 
            className="sidebar-toggle-btn" 
            onClick={onToggleSidebar} 
            aria-label="Abrir/fechar filtros"
            type="button"
          >
            <FaBars aria-hidden="true" />
          </button>

          <div className="logo">
            <FaShoppingBag className="logo-icon" aria-hidden="true" />
            <h1>Catálogo Online</h1>
          </div>

          <div className="search-bar">
            <FaSearch className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
              aria-label="Buscar produtos"
            />
          </div>

          <button 
            className="cart-button" 
            onClick={onCartClick}
            type="button"
            aria-label={`Carrinho com ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
          >
            <FaShoppingCart className="cart-icon" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="cart-badge" aria-hidden="true">{cartCount}</span>
            )}
            <span className="cart-text">Carrinho</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
