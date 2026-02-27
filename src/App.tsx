import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  DEFAULT_STORE_NAME,
  fetchLojaById,
  fetchProfile,
  fetchStoreSettings,
  fetchTemaAtivo,
  getSession,
  supabase,
  type StoreSettings,
} from "./lib/supabase";
import type { CatalogoTema } from "./types";
import { useTenant } from "./context/TenantContext";
import { useAuthStore } from "./store/authStore";

const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const NewStore = lazy(() => import("./pages/NewStore"));
const Login = lazy(() => import("./pages/Login"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ProductManager = lazy(() => import("./pages/admin/ProductManager"));
const DepartmentManager = lazy(() => import("./pages/admin/DepartmentManager"));
const SubdepartmentManager = lazy(
  () => import("./pages/admin/SubdepartmentManager"),
);
const BrandManager = lazy(() => import("./pages/admin/BrandManager"));
const SellerManager = lazy(() => import("./pages/admin/SellerManager"));
const StoreSettingsManager = lazy(
  () => import("./pages/admin/StoreSettingsManager"),
);
const ThemeManager = lazy(() => import("./pages/admin/ThemeManager"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Carregando…</p>
    </div>
  </div>
);

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

function TenantGate() {
  const { loading, notFound } = useTenant();

  if (loading) {
    return <PageLoader />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Loja não encontrada
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Verifique o link da loja ou crie uma nova em /nova-loja.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function TenantCatalogRoute() {
  const { tenantId } = useTenant();
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    nome_loja: DEFAULT_STORE_NAME,
    footer_descricao:
      "Sua loja virtual completa com os melhores produtos e preços do mercado. Qualidade e conveniência em um só lugar.",
    footer_observacoes: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
  });
  const [temaAtivo, setTemaAtivo] = useState<CatalogoTema | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let isMounted = true;

    const loadStoreSettings = async () => {
      try {
        const loadedSettings = await fetchStoreSettings();
        if (isMounted) setStoreSettings(loadedSettings);
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error);
      }
    };

    const loadTema = async () => {
      try {
        const tema = await fetchTemaAtivo();
        if (isMounted) setTemaAtivo(tema);
      } catch (error) {
        console.error("Erro ao carregar tema ativo:", error);
      }
    };

    loadStoreSettings();
    loadTema();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  useEffect(() => {
    const nome = storeSettings.nome_loja?.trim();
    document.title =
      nome && nome !== DEFAULT_STORE_NAME
        ? `${nome} - Catálogo Online`
        : "Catálogo Online";
  }, [storeSettings.nome_loja]);

  return <Home storeSettings={storeSettings} tema={temaAtivo} />;
}

function StoreSettingsRoute() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    nome_loja: DEFAULT_STORE_NAME,
    footer_descricao:
      "Sua loja virtual completa com os melhores produtos e preços do mercado. Qualidade e conveniência em um só lugar.",
    footer_observacoes: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
  });

  useEffect(() => {
    fetchStoreSettings()
      .then(setStoreSettings)
      .catch((error) =>
        console.error("Erro ao carregar configurações da loja:", error),
      );
  }, []);

  return (
    <StoreSettingsManager
      storeSettings={storeSettings}
      onStoreSettingsChange={setStoreSettings}
    />
  );
}

function App() {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const applySession = async () => {
      try {
        const session = await getSession();
        const authUser = session?.user;
        if (!authUser) {
          if (mounted) logout();
          return;
        }

        const profile = await fetchProfile(authUser.id);
        const metadataTenantId =
          (authUser.user_metadata?.tenant_id as string | undefined) ?? null;
        const tenantId = profile.tenant_id ?? metadataTenantId;
        let tenantSlug: string | null = null;
        if (tenantId) {
          try {
            tenantSlug = (await fetchLojaById(tenantId)).slug;
          } catch (_) {
            tenantSlug = null;
          }
        }

        if (mounted) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            tenant_id: tenantId,
            tenant_slug: tenantSlug,
          });
        }
      } catch (_err) {
        if (mounted) logout();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    applySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        logout();
        return;
      }

      try {
        const profile = await fetchProfile(session.user.id);
        const metadataTenantId =
          (session.user.user_metadata?.tenant_id as string | undefined) ?? null;
        const tenantId = profile.tenant_id ?? metadataTenantId;
        let tenantSlug: string | null = null;
        if (tenantId) {
          try {
            tenantSlug = (await fetchLojaById(tenantId)).slug;
          } catch (_) {
            tenantSlug = null;
          }
        }
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          tenant_id: tenantId,
          tenant_slug: tenantSlug,
        });
      } catch (_err) {
        logout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [logout, setLoading, setUser]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/nova-loja" element={<NewStore />} />
        <Route path="/login" element={<Login />} />
        <Route path="/entrar" element={<Navigate to="/login" replace />} />

        <Route element={<TenantGate />}>
          <Route path="/:slug" element={<TenantCatalogRoute />} />

          <Route
            path="/admin/:slug"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="produtos" replace />} />
            <Route path="produtos" element={<ProductManager />} />
            <Route path="departamentos" element={<DepartmentManager />} />
            <Route path="subdepartamentos" element={<SubdepartmentManager />} />
            <Route path="marcas" element={<BrandManager />} />
            <Route path="vendedores" element={<SellerManager />} />
            <Route path="temas" element={<ThemeManager />} />
            <Route path="configuracoes" element={<StoreSettingsRoute />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
