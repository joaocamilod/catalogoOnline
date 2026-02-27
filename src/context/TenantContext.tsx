import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { fetchLojaBySlug, setTenantContext } from "../lib/supabase";

interface TenantContextValue {
  tenantId: string | null;
  slug: string | null;
  nome: string | null;
  loading: boolean;
  notFound: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: null,
  slug: null,
  nome: null,
  loading: false,
  notFound: false,
});

const TENANT_CACHE_PREFIX = "tenant:slug:";

function extractSlugFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  if (parts[0] === "admin") {
    return parts[1] ?? null;
  }

  if (parts[0] === "login" || parts[0] === "nova-loja") {
    return null;
  }

  return parts[0] ?? null;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const slug = useMemo(
    () => extractSlugFromPath(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    let active = true;

    if (!slug) {
      setTenantId(null);
      setNome(null);
      setNotFound(false);
      setTenantContext(null);
      return () => {
        active = false;
      };
    }

    const loadTenant = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const cacheKey = `${TENANT_CACHE_PREFIX}${slug}`;
        const cached =
          typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;
        if (cached) {
          const parsed = JSON.parse(cached) as { id: string; nome: string };
          if (active) {
            setTenantId(parsed.id);
            setNome(parsed.nome);
            setTenantContext(parsed.id);
            setLoading(false);
            return;
          }
        }

        const loja = await fetchLojaBySlug(slug);
        if (!active) return;
        setTenantId(loja.id);
        setNome(loja.nome);
        setTenantContext(loja.id);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ id: loja.id, nome: loja.nome }),
          );
        }
      } catch (_error) {
        if (!active) return;
        setTenantId(null);
        setNome(null);
        setNotFound(true);
        setTenantContext(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTenant();

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <TenantContext.Provider value={{ tenantId, slug, nome, loading, notFound }}>
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant() {
  return useContext(TenantContext);
}
