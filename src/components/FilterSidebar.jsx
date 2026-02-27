import { useEffect } from "react";
import {
  FaRedo,
  FaTimes,
  FaStore,
  FaLaptop,
  FaTshirt,
  FaCouch,
  FaHome,
  FaBook,
  FaBriefcase,
  FaTag,
} from "react-icons/fa";
import "./FilterSidebar.css";

const ICON_MAP = {
  all: FaStore,
  todos: FaStore,
  "todos os produtos": FaStore,
  eletrônicos: FaLaptop,
  eletronicos: FaLaptop,
  moda: FaTshirt,
  vestuário: FaTshirt,
  vestuario: FaTshirt,
  móveis: FaCouch,
  moveis: FaCouch,
  casa: FaHome,
  "casa & cozinha": FaHome,
  livros: FaBook,
  acessórios: FaBriefcase,
  acessorios: FaBriefcase,
};

const hexToRgb = (hex = "#000000") => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0, 0, 0";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

const getIcon = (id = "", name = "") => {
  if (id === "all") return FaStore;
  const key = name.toLowerCase();
  return ICON_MAP[key] || FaTag;
};

const DEFAULT_CATEGORIES = [
  { id: "all", name: "Todos os Produtos", icon: FaStore },
  { id: "eletronicos", name: "Eletrônicos", icon: FaLaptop },
  { id: "moda", name: "Moda", icon: FaTshirt },
  { id: "moveis", name: "Móveis", icon: FaCouch },
  { id: "casa", name: "Casa & Cozinha", icon: FaHome },
  { id: "livros", name: "Livros", icon: FaBook },
  { id: "acessorios", name: "Acessórios", icon: FaBriefcase },
];

function FilterSidebar({
  categories: categoriesProp,
  selectedCategory,
  onCategoryChange,
  subdepartments = [],
  selectedSubdepartments = [],
  onSubdepartmentsChange = (_value) => {},
  brands = [],
  selectedBrands = [],
  onBrandsChange = (_value) => {},
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  isOpen,
  onClose,
  tema,
}) {
  const resolvedCategories =
    categoriesProp && categoriesProp.length > 0
      ? categoriesProp.map((c) => ({
          ...c,
          icon: c.icon || getIcon(c.id, c.name),
        }))
      : DEFAULT_CATEGORIES;

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => document.body.classList.remove("sidebar-open");
  }, [isOpen]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`filter-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Painel de filtros"
        style={
          tema
            ? {
                "--primary-color": tema.cor_primaria,
                "--secondary-color": tema.cor_secundaria,
                "--primary-color-rgb": hexToRgb(tema.cor_primaria),
              }
            : undefined
        }
      >
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
            {resolvedCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? "active" : ""}`}
                  onClick={() => onCategoryChange(category.id)}
                  type="button"
                  aria-pressed={selectedCategory === category.id}
                  aria-label={`Filtrar por ${category.name}`}
                >
                  <IconComponent className="category-icon" aria-hidden="true" />
                  <span className="category-name">{category.name}</span>
                </button>
              );
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
            <option value="name">Nome (A–Z)</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
          </select>
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Subdepartamentos</h3>
          {subdepartments.length === 0 ? (
            <p className="filter-empty-state">
              Sem subdepartamentos para este filtro.
            </p>
          ) : (
            <div className="checkbox-filter-list">
              {subdepartments.map((item) => {
                const checked = selectedSubdepartments.includes(item.id);
                return (
                  <label key={item.id} className="checkbox-filter-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          onSubdepartmentsChange(
                            selectedSubdepartments.filter(
                              (id) => id !== item.id,
                            ),
                          );
                        } else {
                          onSubdepartmentsChange([
                            ...selectedSubdepartments,
                            item.id,
                          ]);
                        }
                      }}
                    />
                    <span>{item.nome}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Marcas</h3>
          {brands.length === 0 ? (
            <p className="filter-empty-state">Sem marcas cadastradas.</p>
          ) : (
            <div className="checkbox-filter-list">
              {brands.map((item) => {
                const checked = selectedBrands.includes(item.id);
                return (
                  <label key={item.id} className="checkbox-filter-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          onBrandsChange(
                            selectedBrands.filter((id) => id !== item.id),
                          );
                        } else {
                          onBrandsChange([...selectedBrands, item.id]);
                        }
                      }}
                    />
                    <span>{item.nome}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="filter-section">
          <h3 className="filter-title">Faixa de Preço</h3>
          <div className="price-range-inputs">
            <input
              type="number"
              placeholder="Mín"
              value={priceRange[0]}
              onChange={(e) =>
                onPriceRangeChange([Number(e.target.value), priceRange[1]])
              }
              className="price-input"
              aria-label="Preço mínimo"
              min="0"
            />
            <span className="price-separator" aria-hidden="true">
              –
            </span>
            <input
              type="number"
              placeholder="Máx"
              value={priceRange[1]}
              onChange={(e) =>
                onPriceRangeChange([priceRange[0], Number(e.target.value)])
              }
              className="price-input"
              aria-label="Preço máximo"
              min="0"
            />
          </div>
          <div className="price-range-display" aria-live="polite">
            {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
          </div>
        </div>

        <button
          className="reset-filters-btn"
          onClick={() => {
            onCategoryChange("all");
            onSubdepartmentsChange([]);
            onBrandsChange([]);
            onPriceRangeChange([0, 50000]);
            onSortChange("name");
          }}
          type="button"
          aria-label="Limpar todos os filtros"
        >
          <FaRedo aria-hidden="true" />
          Limpar Filtros
        </button>
      </aside>
    </>
  );
}

export default FilterSidebar;
