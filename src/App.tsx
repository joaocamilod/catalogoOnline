import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  DEFAULT_STORE_NAME,
  fetchStoreSettings,
  type StoreSettings,
} from "./lib/supabase";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ProductManager = lazy(() => import("./pages/admin/ProductManager"));
const DepartmentManager = lazy(() => import("./pages/admin/DepartmentManager"));
const SellerManager = lazy(() => import("./pages/admin/SellerManager"));
const StoreSettingsManager = lazy(
  () => import("./pages/admin/StoreSettingsManager"),
);

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

function App() {
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
    let isMounted = true;

    const loadStoreSettings = async () => {
      try {
        const loadedSettings = await fetchStoreSettings();
        if (isMounted) setStoreSettings(loadedSettings);
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error);
      }
    };

    loadStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.title = storeSettings.nome_loja;
  }, [storeSettings.nome_loja]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home storeSettings={storeSettings} />} />
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
            <Route path="vendedores" element={<SellerManager />} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
