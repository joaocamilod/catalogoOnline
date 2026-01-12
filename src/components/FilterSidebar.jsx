import { useEffect } from 'react'
import { FaRedo, FaTimes } from 'react-icons/fa'
import { categories } from '../data/products'
import './FilterSidebar.css'

function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  isOpen,
  onClose
}) {

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }

    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [isOpen])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Filtros</h2>
          <button 
            className="close-sidebar-btn" 
            onClick={onClose} 
            aria-label="Fechar filtros"
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        <div className="filter-section">
          <div className="filter-title-row">
            <h3 className="filter-title">Departamentos</h3>
            <button 
              className="close-filter-btn" 
              onClick={onClose} 
              aria-label="Fechar filtros"
              type="button"
            >
              <FaTimes />
            </button>
          </div>
          <div className="category-list">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => onCategoryChange(category.id)}
                  type="button"
                  aria-pressed={selectedCategory === category.id}
                  aria-label={`Filtrar por ${category.name}`}
                >
                  <IconComponent className="category-icon" aria-hidden="true" />
                  <span className="category-name">{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Ordenar por</h3>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Ordenar produtos"
          >
            <option value="name">Nome (A-Z)</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
          </select>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Faixa de Preço</h3>
          <div className="price-range-inputs">
            <input
              type="number"
              placeholder="Mín"
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
              className="price-input"
              aria-label="Preço mínimo"
              min="0"
            />
            <span className="price-separator" aria-hidden="true">-</span>
            <input
              type="number"
              placeholder="Máx"
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
              className="price-input"
              aria-label="Preço máximo"
              min="0"
            />
          </div>
          <div className="price-range-display" aria-live="polite">
            {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </div>
        </div>

        <button
          className="reset-filters-btn"
          onClick={() => {
            onCategoryChange('all')
            onPriceRangeChange([0, 10000])
            onSortChange('name')
          }}
          type="button"
          aria-label="Limpar todos os filtros"
        >
          <FaRedo aria-hidden="true" /> Limpar Filtros
        </button>
      </aside>
    </>
  )
}

export default FilterSidebar
