import { DEFAULT_STORE_NAME } from "./supabase";

export const RESERVED_ROOT_PATHS = new Set([
  "admin",
  "entrar",
  "login",
  "registrar",
  "cadastro",
]);

export function slugifyStoreName(storeName?: string | null): string {
  const normalizedName = (storeName || DEFAULT_STORE_NAME).trim().toLowerCase();
  const withoutAccents = normalizedName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const slug = withoutAccents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "loja";
}

export function buildStorePath(storeName?: string | null): string {
  return `/${slugifyStoreName(storeName)}`;
}

export function isReservedStoreSlug(pathSegment?: string): boolean {
  if (!pathSegment) return false;
  return RESERVED_ROOT_PATHS.has(pathSegment.trim().toLowerCase());
}
