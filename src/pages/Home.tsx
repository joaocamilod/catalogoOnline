import React, { useState, useMemo, useEffect, useCallback } from "react";
import Header from "../components/Header";
import ProductGrid from "../components/ProductGrid";
import FilterSidebar from "../components/FilterSidebar";
import Cart from "../components/Cart";
import Footer from "../components/Footer";
import ProductDetailModal from "../components/ProductDetailModal";
import Dialog from "../components/Dialog";
import Toast from "../components/Toast";
import { AlertCircle, Loader2, Mail, Phone, UserRound } from "lucide-react";
import {
  fetchProdutos,
  fetchDepartamentosComProdutos,
  fetchSubdepartamentosComProdutos,
  fetchMarcasComProdutos,
  fetchAllVendedores,
} from "../lib/supabase";
import { openWhatsAppChat } from "../lib/whatsapp";
import { getPrecoComPromocao } from "../lib/promocoes";
import { useCartStore } from "../store/cartStore";
import type {
  CartItem,
  CatalogProduct,
  CatalogoTema,
  Departamento,
  Subdepartamento,
  Marca,
  Vendedor,
} from "../types";
import { normalizeProduto } from "../types";
import type { StoreSettings } from "../lib/supabase";

const PRODUCTS_PER_PAGE = 20;

interface HomeProps {
  storeSettings: StoreSettings;
  tema?: CatalogoTema | null;
  storefrontPath?: string;
  hideLoginButton?: boolean;
}

const Home: React.FC<HomeProps> = ({
  storeSettings,
  tema,
  storefrontPath = "/",
  hideLoginButton = false,
}) => {
  const [produtos, setProdutos] = useState<CatalogProduct[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [subdepartamentos, setSubdepartamentos] = useState<Subdepartamento[]>(
    [],
  );
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubdepartments, setSelectedSubdepartments] = useState<
    string[]
  >([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState("name");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [notifyProduct, setNotifyProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [notifySelectedVariations, setNotifySelectedVariations] = useState<
    CartItem["selectedVariations"]
  >([]);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [sellers, setSellers] = useState<Vendedor[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerLoadError, setSellerLoadError] = useState("");
  const [sellerValidationError, setSellerValidationError] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [manualSellerName, setManualSellerName] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
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
    Promise.all([
      fetchDepartamentosComProdutos(),
      fetchSubdepartamentosComProdutos(),
      fetchMarcasComProdutos(),
    ])
      .then(([deps, subs, marcs]) => {
        setDepartamentos(deps);
        setSubdepartamentos(subs);
        setMarcas(marcs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProdutos(1, debouncedSearch, selectedCategory);
  }, [debouncedSearch, selectedCategory, loadProdutos]);

  const filteredProducts = useMemo(() => {
    const getPriceForFilters = (product: CatalogProduct) =>
      getPrecoComPromocao(product, Number(product.price) || 0, 1)
        .finalUnitPrice;

    let list = produtos.filter((p) => {
      const price = getPriceForFilters(p);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    if (selectedSubdepartments.length > 0) {
      list = list.filter(
        (p) =>
          p.subdepartamento_id &&
          selectedSubdepartments.includes(p.subdepartamento_id),
      );
    }
    if (selectedBrands.length > 0) {
      list = list.filter(
        (p) => p.marca_id && selectedBrands.includes(p.marca_id),
      );
    }
    list.sort((a, b) => {
      const priceA = getPriceForFilters(a);
      const priceB = getPriceForFilters(b);
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [produtos, priceRange, sortBy, selectedSubdepartments, selectedBrands]);

  const sidebarCategories = useMemo(
    () => [
      { id: "all", name: "Todos os Produtos" },
      ...departamentos.map((d) => ({ id: d.id, name: d.descricao })),
    ],
    [departamentos],
  );

  const sidebarSubdepartments = useMemo(
    () =>
      subdepartamentos.filter(
        (sub) =>
          selectedCategory === "all" ||
          (sub.departamento_ids ?? []).includes(selectedCategory),
      ),
    [subdepartamentos, selectedCategory],
  );

  useEffect(() => {
    const availableIds = new Set(sidebarSubdepartments.map((sub) => sub.id));
    setSelectedSubdepartments((prev) =>
      prev.filter((itemId) => availableIds.has(itemId)),
    );
  }, [sidebarSubdepartments]);

  const handlePriceRangeChange = useCallback((range: [number, number]) => {
    const min = Math.max(0, Number.isFinite(range[0]) ? range[0] : 0);
    const maxCandidate = Math.max(0, Number.isFinite(range[1]) ? range[1] : min);
    const max = Math.max(min, maxCandidate);
    setPriceRange([min, max]);
  }, []);

  const getSelectedVariationStockLimit = (
    product: CatalogProduct,
    selectedVariations: CartItem["selectedVariations"],
  ) => {
    if (!selectedVariations.length) return null;
    const limits = selectedVariations
      .map((selected) => {
        const variacao = (product.variacoes ?? []).find(
          (item) => item.id === selected.variacaoId,
        );
        const opcao = variacao?.opcoes?.find(
          (item) => item.id === selected.opcaoId,
        );
        const stock = Number(opcao?.estoque);
        return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null;
      })
      .filter((item): item is number => item !== null);
    if (!limits.length) return null;
    return Math.min(...limits);
  };

  const handleAddToCart = (
    product: CatalogProduct,
    selectedVariations: CartItem["selectedVariations"] = [],
  ) => {
    const stockLimit = getSelectedVariationStockLimit(
      product,
      selectedVariations,
    );
    addItem(product, selectedVariations, stockLimit);
  };
  const handleBuyNow = (
    product: CatalogProduct,
    quantity: number,
    selectedVariations: CartItem["selectedVariations"] = [],
  ) => {
    const stockLimit = getSelectedVariationStockLimit(
      product,
      selectedVariations,
    );
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedVariations, stockLimit);
    }
    setSelectedProduct(null);
    setIsCartOpen(true);
  };
  const handleRemoveFromCart = (itemId: string) => removeItem(itemId);
  const handleUpdateQuantity = (itemId: string, qty: number) =>
    updateQuantity(itemId, qty);

  const loadSellers = useCallback(async () => {
    setLoadingSellers(true);
    setSellerLoadError("");
    try {
      const data = await fetchAllVendedores();
      setSellers(data);
      setSelectedSellerId(data[0]?.id ?? "");
    } catch (_) {
      setSellerLoadError("Não foi possível carregar vendedores agora.");
      setSellers([]);
      setSelectedSellerId("");
    } finally {
      setLoadingSellers(false);
    }
  }, []);

  const openNotifyDialog = useCallback(
    (
      product: CatalogProduct,
      selectedVariations: CartItem["selectedVariations"] = [],
    ) => {
      setNotifyProduct(product);
      setNotifySelectedVariations(selectedVariations);
      setManualSellerName("");
      setSellerValidationError("");
      setIsNotifyDialogOpen(true);
      loadSellers();
    },
    [loadSellers],
  );

  const handleConfirmNotifySeller = () => {
    if (!notifyProduct) return;

    const selectedSeller = sellers.find(
      (seller) => seller.id === selectedSellerId,
    );
    const sellerName = selectedSeller?.nome || manualSellerName.trim();
    if (!sellerName) {
      setSellerValidationError("Selecione ou informe um vendedor.");
      return;
    }

    const phoneDigits = (selectedSeller?.telefone_whatsapp ?? "").replace(
      /\D/g,
      "",
    );

    if (selectedSeller && phoneDigits.length < 10) {
      setSellerValidationError(
        "Este vendedor não possui WhatsApp válido cadastrado.",
      );
      return;
    }

    if (!selectedSeller) {
      setSellerValidationError(
        "Nenhum vendedor ativo com WhatsApp válido encontrado para envio.",
      );
      return;
    }

    const waNumber = phoneDigits.startsWith("55")
      ? phoneDigits
      : `55${phoneDigits}`;
    const variacoesTexto =
      notifySelectedVariations.length > 0
        ? notifySelectedVariations
            .map((v) => `${v.variacaoNome}: ${v.opcaoValor}`)
            .join(" | ")
        : "";
    const msg =
      `Olá ${sellerName}, tudo bem?\n\n` +
      `Tenho interesse no produto "*${notifyProduct.name}*" que está esgotado no catálogo.\n` +
      (variacoesTexto ? `(${variacoesTexto}).\n` : "") +
      `Pode me avisar por aqui quando ele voltar ao estoque?\n\n` +
      `Obrigado(a)!`;

    openWhatsAppChat(waNumber, msg);

    setIsNotifyDialogOpen(false);
    setNotifyProduct(null);
    setNotifySelectedVariations([]);
    setToast({
      msg: "Mensagem aberta no WhatsApp para aviso de reposição.",
      type: "success",
    });
  };

  return (
    <div
      className="flex flex-col min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: tema?.pagina_bg_cor || "#f9fafb",
        fontFamily: tema ? `${tema.fonte_familia}, sans-serif` : undefined,
      }}
    >
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Header
        storeName={storeSettings.nome_loja}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        cartCount={count()}
        onCartClick={() => setIsCartOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        tema={tema}
        homePath={storefrontPath}
        hideLoginButton={hideLoginButton}
      />

      <main className="flex-1 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <FilterSidebar
            categories={sidebarCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubdepartments([]);
              setCurrentPage(1);
            }}
            subdepartments={sidebarSubdepartments}
            selectedSubdepartments={selectedSubdepartments}
            onSubdepartmentsChange={setSelectedSubdepartments}
            brands={marcas}
            selectedBrands={selectedBrands}
            onBrandsChange={setSelectedBrands}
            priceRange={priceRange}
            onPriceRangeChange={handlePriceRangeChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            tema={tema}
          />

          <div className="min-h-[400px]">
            <div className="flex items-center justify-between mb-6 gap-2">
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight whitespace-nowrap">
                Nossos Produtos
              </h2>

              {loading ? (
                <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">
                  Carregando…
                </span>
              ) : error ? (
                <span className="text-xs sm:text-sm text-red-500 flex-shrink-0">
                  {error}
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 text-right">
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
                onNotifyRestock={openNotifyDialog}
                onProductClick={setSelectedProduct}
                tema={tema}
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
                    className={`px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:opacity-80 transition-colors focus:outline-none focus:ring-2 ${!tema ? "text-violet-600 border-violet-200 hover:bg-violet-50 focus:ring-violet-400" : ""}`}
                    style={
                      tema
                        ? {
                            color: tema.cor_primaria,
                            borderColor: tema.cor_primaria + "40",
                          }
                        : undefined
                    }
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
                    className={`px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:opacity-80 transition-colors focus:outline-none focus:ring-2 ${!tema ? "text-violet-600 border-violet-200 hover:bg-violet-50 focus:ring-violet-400" : ""}`}
                    style={
                      tema
                        ? {
                            color: tema.cor_primaria,
                            borderColor: tema.cor_primaria + "40",
                          }
                        : undefined
                    }
                  >
                    Próxima ›
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer storeSettings={storeSettings} tema={tema} />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={clearCart}
        total={total()}
        tema={tema}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onNotifyRestock={openNotifyDialog}
          onBuyNow={handleBuyNow}
          tema={tema}
        />
      )}

      <Dialog
        isOpen={isNotifyDialogOpen}
        onClose={() => {
          setIsNotifyDialogOpen(false);
          setNotifyProduct(null);
          setNotifySelectedVariations([]);
        }}
        title="Avise-me quando voltar ao estoque"
        maxWidth="max-w-xl"
        closeOnOverlayClick={false}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5">
            <p className="text-sm text-indigo-900">
              Produto: <strong>{notifyProduct?.name}</strong>
            </p>
            {notifySelectedVariations.length > 0 && (
              <p className="text-xs text-indigo-800 mt-1">
                Variação/grade:{" "}
                <strong>
                  {notifySelectedVariations
                    .map((v) => `${v.variacaoNome}: ${v.opcaoValor}`)
                    .join(" | ")}
                </strong>
              </p>
            )}
            <p className="text-xs text-indigo-700 mt-1">
              Selecione o vendedor para abrir o WhatsApp com mensagem
              padronizada.
            </p>
          </div>

          {loadingSellers ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-sm text-gray-600">
                Carregando vendedores...
              </span>
            </div>
          ) : sellers.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sellers.map((seller) => (
                <label
                  key={seller.id}
                  className={`block cursor-pointer rounded-xl border p-3 transition-all ${
                    selectedSellerId === seller.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="notify-seller"
                      checked={selectedSellerId === seller.id}
                      onChange={() => {
                        setSelectedSellerId(seller.id);
                        setSellerValidationError("");
                      }}
                      className="mt-1"
                      style={{ accentColor: "#4f46e5" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <UserRound className="h-4 w-4 text-indigo-600" />
                        <span className="truncate">{seller.nome}</span>
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {seller.telefone_whatsapp && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {seller.telefone_whatsapp}
                          </p>
                        )}
                        {seller.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {seller.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Nenhum vendedor ativo cadastrado. Informe o nome do vendedor
                  para gerar a mensagem.
                </span>
              </div>
              <input
                type="text"
                value={manualSellerName}
                onChange={(e) => {
                  setManualSellerName(e.target.value);
                  setSellerValidationError("");
                }}
                placeholder="Nome do vendedor"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {sellerLoadError && (
            <p className="text-xs text-red-600 font-medium">
              {sellerLoadError}
            </p>
          )}
          {sellerValidationError && (
            <p className="text-xs text-red-600 font-medium">
              {sellerValidationError}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsNotifyDialogOpen(false);
                setNotifyProduct(null);
                setNotifySelectedVariations([]);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmNotifySeller}
              disabled={loadingSellers}
              className="px-4 py-2 text-sm font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Enviar no WhatsApp
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Home;
