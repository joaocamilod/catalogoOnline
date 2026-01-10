import { FaRedo } from 'react-icons/fa'
import { categories } from '../data/products'
import './FilterSidebar.css'

function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange
}) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <aside className="filter-sidebar">
      <div className="filter-section">
        <h3 className="filter-title">Categorias</h3>
        <div className="category-list">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <button
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => onCategoryChange(category.id)}
              >
                <IconComponent className="category-icon" />
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
          />
          <span className="price-separator">-</span>
          <input
            type="number"
            placeholder="Máx"
            value={priceRange[1]}
            onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
            className="price-input"
          />
        </div>
        <div className="price-range-display">
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
      >
        <FaRedo /> Limpar Filtros
      </button>
    </aside>
  )
}

export default FilterSidebar
