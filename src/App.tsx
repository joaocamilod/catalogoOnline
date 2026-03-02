import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  DEFAULT_STORE_NAME,
  fetchProfile,
  getSession,
  fetchStoreSettings,
  fetchTemaAtivo,
  supabase,
  type StoreSettings,
} from "./lib/supabase";
import type { CatalogoTema } from "./types";
import { useAuthStore } from "./store/authStore";
import { buildStorePath, isReservedStoreSlug } from "./lib/routes";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

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

const StorefrontRoute = ({
  storePath,
  storeSettings,
  temaAtivo,
}: {
  storePath: string;
  storeSettings: StoreSettings;
  temaAtivo: CatalogoTema | null;
}) => {
  const { storeSlug } = useParams();
  const canonicalStoreSlug = storePath.replace(/^\//, "").toLowerCase();

  if (isReservedStoreSlug(storeSlug)) {
    return <Navigate to={storePath} replace />;
  }

  if ((storeSlug || "").toLowerCase() !== canonicalStoreSlug) {
    return <Navigate to={storePath} replace />;
  }

  return (
    <Home
      storeSettings={storeSettings}
      tema={temaAtivo}
      storefrontPath={storePath}
      hideLoginButton
    />
  );
};

function App() {
  const { setUser, setLoading } = useAuthStore();
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
  const storePath = useMemo(
    () => buildStorePath(storeSettings.nome_loja),
    [storeSettings.nome_loja],
  );

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      setLoading(true);
      try {
        const session = await getSession();
        if (!session?.user) {
          if (isMounted) setUser(null);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        if (!isMounted) return;

        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
        });
      } catch (error) {
        console.error("Erro ao sincronizar sessão:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profile = await fetchProfile(session.user.id);
        if (!isMounted) return;
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
        });
      } catch (error) {
        console.error("Erro ao atualizar sessão:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setLoading, setUser]);

  useEffect(() => {
    const nome = storeSettings.nome_loja?.trim();
    document.title =
      nome && nome !== DEFAULT_STORE_NAME
        ? `${nome} - Catálogo Online`
        : "Catálogo Online";
  }, [storeSettings.nome_loja]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to={storePath} replace />} />
          <Route
            path="/:storeSlug"
            element={
              <StorefrontRoute
                storePath={storePath}
                storeSettings={storeSettings}
                temaAtivo={temaAtivo}
              />
            }
          />
          <Route path="/entrar" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/cadastro" element={<Register />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/produtos" replace />} />
            <Route path="produtos" element={<ProductManager />} />
            <Route path="departamentos" element={<DepartmentManager />} />
            <Route path="subdepartamentos" element={<SubdepartmentManager />} />
            <Route path="marcas" element={<BrandManager />} />
            <Route path="vendedores" element={<SellerManager />} />
            <Route path="temas" element={<ThemeManager />} />
            <Route
              path="configuracoes"
              element={
                <StoreSettingsManager
                  storeSettings={storeSettings}
                  onStoreSettingsChange={setStoreSettings}
                />
              }
            />
          </Route>

          <Route path="*" element={<Navigate to={storePath} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
