import React from "react";
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
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900">
            Administração
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-indigo-500" : "text-gray-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            <ShoppingBag className="h-5 w-5 text-gray-400" />
            Ver loja
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-900 truncate">
            {user?.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin</span>
            </div>
            <div className="flex items-center text-gray-400 text-xs">
              <span>deslize</span>
              <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          </div>
          <nav className="flex px-2 pb-3 overflow-x-auto space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center px-5 py-3 text-xs font-medium rounded-xl min-w-[100px] ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 mb-1 ${active ? "text-indigo-500" : "text-gray-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center px-5 py-3 text-xs font-medium rounded-xl min-w-[100px] text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-6 w-6 mb-1" />
              Sair
            </button>
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
