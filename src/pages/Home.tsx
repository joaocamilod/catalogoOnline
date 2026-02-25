import React, { useState, useMemo, useEffect, useCallback } from "react";
import Header from "../components/Header";
import ProductGrid from "../components/ProductGrid";
import FilterSidebar from "../components/FilterSidebar";
import Cart from "../components/Cart";
import Footer from "../components/Footer";
import { fetchProdutos, fetchAllDepartamentos } from "../lib/supabase";
import { useCartStore } from "../store/cartStore";
import type { CatalogProduct, Departamento } from "../types";
import { normalizeProduto } from "../types";

const PRODUCTS_PER_PAGE = 20;

const Home: React.FC = () => {
  const [produtos, setProdutos] = useState<CatalogProduct[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState("name");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    count,
  } = useCartStore();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadProdutos = useCallback(
    async (page: number, search: string, depId: string) => {
      setLoading(true);
      setError(null);
      try {
        const { produtos: raw, totalPages: tp } = await fetchProdutos(
          page,
          PRODUCTS_PER_PAGE,
          search,
          depId === "all" ? "" : depId,
        );
        setProdutos(raw.map(normalizeProduto));
        setTotalPages(tp);
        setCurrentPage(page);
      } catch (e: any) {
        setError(
          "Erro ao carregar produtos. Verifique as configurações do Supabase.",
        );
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchAllDepartamentos()
      .then(setDepartamentos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProdutos(1, debouncedSearch, selectedCategory);
  }, [debouncedSearch, selectedCategory, loadProdutos]);

  const filteredProducts = useMemo(() => {
    let list = produtos.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );
    list.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [produtos, priceRange, sortBy]);

  const sidebarCategories = useMemo(
    () => [
      { id: "all", name: "Todos os Produtos" },
      ...departamentos.map((d) => ({ id: d.id, name: d.descricao })),
    ],
    [departamentos],
  );

  const handleAddToCart = (product: CatalogProduct) => addItem(product);
  const handleRemoveFromCart = (productId: string) => removeItem(productId);
  const handleUpdateQuantity = (productId: string, qty: number) =>
    updateQuantity(productId, qty);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-gray-50">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        cartCount={count()}
        onCartClick={() => setIsCartOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <FilterSidebar
            categories={sidebarCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="min-h-[400px]">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Nossos Produtos
              </h2>

              {loading ? (
                <span className="text-sm text-gray-400">Carregando…</span>
              ) : error ? (
                <span className="text-sm text-red-500">{error}</span>
              ) : (
                <span className="text-sm text-gray-500">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "produto encontrado"
                    : "produtos encontrados"}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-violet-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Carregando produtos…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-600 font-medium mb-2">
                  Erro ao carregar produtos
                </p>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : (
              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
              />
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                {currentPage > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      loadProdutos(
                        currentPage - 1,
                        debouncedSearch,
                        selectedCategory,
                      )
                    }
                    className="px-4 py-2 text-sm font-medium bg-white text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    ‹ Anterior
                  </button>
                )}
                <span className="text-sm text-gray-500 select-none">
                  Página {currentPage} de {totalPages}
                </span>
                {currentPage < totalPages && (
                  <button
                    type="button"
                    onClick={() =>
                      loadProdutos(
                        currentPage + 1,
                        debouncedSearch,
                        selectedCategory,
                      )
                    }
                    className="px-4 py-2 text-sm font-medium bg-white text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    Próxima ›
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={clearCart}
        total={total()}
      />
    </div>
  );
};

export default Home;
