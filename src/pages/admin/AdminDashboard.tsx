import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ShoppingBag,
  ChevronRight,
  Palette,
  GitBranch,
  BadgePercent,
  Menu,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { signOut } from "../../lib/supabase";
import AdminGlobalNotifier from "../../components/AdminGlobalNotifier";

const navigation = [
  { name: "Produtos", href: "/admin/produtos", icon: Package },
  {
    name: "Departamentos",
    href: "/admin/departamentos",
    icon: LayoutDashboard,
  },
  {
    name: "Subdepartamentos",
    href: "/admin/subdepartamentos",
    icon: GitBranch,
  },
  { name: "Marcas", href: "/admin/marcas", icon: BadgePercent },
  { name: "Vendedores", href: "/admin/vendedores", icon: Users },
  { name: "Temas", href: "/admin/temas", icon: Palette },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth > 640 && window.innerWidth <= 1024,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("admin:sidebar-collapsed");
    return saved ? saved === "true" : window.innerWidth <= 1024;
  });
  const firstNavLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 640;
      const tablet = width > 640 && width <= 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (!mobile) {
        setIsSidebarOpen(false);
      }
      if (width > 1024) {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin:sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      firstNavLinkRef.current?.focus();
    }
  }, [isMobile, isSidebarOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (_) {}
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminGlobalNotifier />
      {isMobile && isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          flex flex-col bg-white border-r border-gray-200 transition-all duration-200
          ${isMobile ? (isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-72") : "translate-x-0"}
          ${!isMobile && isTablet ? (isSidebarCollapsed ? "w-20" : "w-64") : ""}
          ${!isMobile && !isTablet ? "w-64" : ""}
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          {(!isTablet || !isSidebarCollapsed) && (
            <span className="text-base font-bold text-gray-900">Administração</span>
          )}
          {isTablet && !isMobile && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((v) => !v)}
              className="ml-auto p-1.5 rounded-lg hover:bg-gray-100"
              aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform ${isSidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                ref={!firstNavLinkRef.current ? firstNavLinkRef : undefined}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                aria-label={item.name}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-indigo-500" : "text-gray-400"}`}
                />
                {(!isTablet || !isSidebarCollapsed) && item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link
            to="/"
            onClick={() => isMobile && setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            <ShoppingBag className="h-5 w-5 text-gray-400" />
            {(!isTablet || !isSidebarCollapsed) && "Ver loja"}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-5 w-5" />
            {(!isTablet || !isSidebarCollapsed) && "Sair"}
          </button>
        </div>

        {(!isTablet || !isSidebarCollapsed) && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
      </aside>

      <div
        className="flex flex-col flex-1 overflow-hidden"
        aria-hidden={isMobile && isSidebarOpen}
      >
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(isMobile || isTablet) && (
                <button
                  type="button"
                  onClick={() =>
                    isMobile
                      ? setIsSidebarOpen(true)
                      : setIsSidebarCollapsed((v) => !v)
                  }
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5 text-gray-700" />
                </button>
              )}
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-4 px-3 sm:py-6 sm:px-5 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
