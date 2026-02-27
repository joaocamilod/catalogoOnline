import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Menu,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { signOut } from "../lib/supabase";
import { useTenant } from "../context/TenantContext";

function Header({
  storeName,
  searchTerm,
  onSearchChange,
  cartCount,
  onCartClick,
  onToggleSidebar,
  tema,
}) {
  const { user, logout } = useAuthStore();
  const { slug } = useTenant();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (_) {}
    logout();
    setIsUserMenuOpen(false);
    navigate(slug ? `/${slug}` : "/");
  };

  return (
    <header
      className={`shadow-lg sticky top-0 z-50 ${!tema ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white" : ""}`}
      style={
        tema
          ? {
              background: `linear-gradient(to right, ${tema.header_bg_de}, ${tema.header_bg_para})`,
              color: tema.header_texto_cor,
            }
          : undefined
      }
    >
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 items-center gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onToggleSidebar}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Abrir filtros"
            type="button"
          >
            <Menu className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">
              Filtros
            </span>
          </button>

          <Link
            to={slug ? `/${slug}` : "/"}
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0"
          >
            <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
            <span className="text-base sm:text-xl font-bold truncate max-w-[110px] sm:max-w-[200px]">
              {storeName}
            </span>
          </Link>
        </div>

        <div className="hidden md:flex justify-center">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              type="text"
              placeholder="Buscar produtos…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full py-2 pl-9 pr-4 rounded-full bg-white/20 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        <div className="md:hidden" />

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCartClick}
            className="relative p-2 rounded-lg hover:bg-white/20 transition-colors"
            type="button"
            aria-label={`Carrinho — ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                type="button"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 z-20 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {user.name || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    {user.role === "admin" && (
                      <Link
                        to={
                          slug
                            ? `/admin/${slug}/produtos`
                            : user.tenant_slug
                              ? `/admin/${user.tenant_slug}/produtos`
                              : "/login"
                        }
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Painel Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-full text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <User className="h-4 w-4" />
              Entrar
            </Link>
          )}
        </div>
      </div>

      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Buscar produtos…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full py-2 pl-9 pr-4 rounded-full bg-white/20 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
