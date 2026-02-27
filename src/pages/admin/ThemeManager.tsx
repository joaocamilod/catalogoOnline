import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Palette,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  ShoppingBag,
  ShoppingCart,
  Star,
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Heart,
  Truck,
  Shield,
  Zap,
  Menu,
  User,
} from "lucide-react";
import {
  fetchTemas,
  createTema,
  updateTema,
  deleteTema,
  ativarTema,
  desativarTema,
} from "../../lib/supabase";
import type { CatalogoTema } from "../../types";
import { TEMA_PADRAO } from "../../types";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";

const FONTES_DISPONIVEIS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Nunito",
  "Raleway",
  "Playfair Display",
  "Merriweather",
];

const SOMBRAS = [
  { value: "none", label: "Nenhuma" },
  { value: "sm", label: "Pequena" },
  { value: "md", label: "Média" },
  { value: "lg", label: "Grande" },
  { value: "xl", label: "Extra Grande" },
];

const BORDER_RADIUS_OPTIONS = [
  { value: "0", label: "Quadrado" },
  { value: "0.25rem", label: "Pouco" },
  { value: "0.375rem", label: "Suave" },
  { value: "0.5rem", label: "Médio" },
  { value: "0.75rem", label: "Arredondado" },
  { value: "1rem", label: "Muito arredondado" },
  { value: "9999px", label: "Pílula" },
];

const CARD_RADIUS_OPTIONS = [
  { value: "0", label: "Quadrado" },
  { value: "0.375rem", label: "Suave" },
  { value: "0.5rem", label: "Médio" },
  { value: "0.75rem", label: "Arredondado" },
  { value: "1rem", label: "Muito arredondado" },
  { value: "1.25rem", label: "Extra arredondado" },
];

type DeviceView = "desktop" | "tablet" | "mobile";

const TEMAS_PRONTOS: Omit<CatalogoTema, "id" | "created_at" | "updated_at">[] =
  [
    {
      nome: "Roxo Elegante",
      ativo: false,
      header_bg_de: "#4f46e5",
      header_bg_para: "#7e22ce",
      header_texto_cor: "#ffffff",
      cor_primaria: "#7c3aed",
      cor_secundaria: "#6366f1",
      botao_bg_de: "#7c3aed",
      botao_bg_para: "#4f46e5",
      botao_texto_cor: "#ffffff",
      botao_borda_raio: "0.5rem",
      card_borda_raio: "0.75rem",
      card_sombra: "sm",
      footer_bg_cor: "#0f1724",
      footer_texto_cor: "#ffffff",
      pagina_bg_cor: "#f9fafb",
      fonte_familia: "Inter",
    },
    {
      nome: "Azul Moderno",
      ativo: false,
      header_bg_de: "#0284c7",
      header_bg_para: "#0369a1",
      header_texto_cor: "#ffffff",
      cor_primaria: "#0ea5e9",
      cor_secundaria: "#0284c7",
      botao_bg_de: "#0ea5e9",
      botao_bg_para: "#0284c7",
      botao_texto_cor: "#ffffff",
      botao_borda_raio: "9999px",
      card_borda_raio: "1rem",
      card_sombra: "md",
      footer_bg_cor: "#0c4a6e",
      footer_texto_cor: "#e0f2fe",
      pagina_bg_cor: "#f0f9ff",
      fonte_familia: "Poppins",
    },
    {
      nome: "Verde Natural",
      ativo: false,
      header_bg_de: "#15803d",
      header_bg_para: "#166534",
      header_texto_cor: "#ffffff",
      cor_primaria: "#16a34a",
      cor_secundaria: "#15803d",
      botao_bg_de: "#16a34a",
      botao_bg_para: "#15803d",
      botao_texto_cor: "#ffffff",
      botao_borda_raio: "0.5rem",
      card_borda_raio: "0.75rem",
      card_sombra: "sm",
      footer_bg_cor: "#14532d",
      footer_texto_cor: "#dcfce7",
      pagina_bg_cor: "#f0fdf4",
      fonte_familia: "Nunito",
    },
    {
      nome: "Rosa Vibrante",
      ativo: false,
      header_bg_de: "#db2777",
      header_bg_para: "#be185d",
      header_texto_cor: "#ffffff",
      cor_primaria: "#ec4899",
      cor_secundaria: "#db2777",
      botao_bg_de: "#ec4899",
      botao_bg_para: "#db2777",
      botao_texto_cor: "#ffffff",
      botao_borda_raio: "9999px",
      card_borda_raio: "1.25rem",
      card_sombra: "lg",
      footer_bg_cor: "#831843",
      footer_texto_cor: "#fce7f3",
      pagina_bg_cor: "#fdf2f8",
      fonte_familia: "Montserrat",
    },
    {
      nome: "Escuro Premium",
      ativo: false,
      header_bg_de: "#1f2937",
      header_bg_para: "#111827",
      header_texto_cor: "#f9fafb",
      cor_primaria: "#f59e0b",
      cor_secundaria: "#d97706",
      botao_bg_de: "#f59e0b",
      botao_bg_para: "#d97706",
      botao_texto_cor: "#111827",
      botao_borda_raio: "0.375rem",
      card_borda_raio: "0.5rem",
      card_sombra: "md",
      footer_bg_cor: "#030712",
      footer_texto_cor: "#d1d5db",
      pagina_bg_cor: "#f3f4f6",
      fonte_familia: "Raleway",
    },
    {
      nome: "Laranja Quente",
      ativo: false,
      header_bg_de: "#ea580c",
      header_bg_para: "#c2410c",
      header_texto_cor: "#ffffff",
      cor_primaria: "#f97316",
      cor_secundaria: "#ea580c",
      botao_bg_de: "#f97316",
      botao_bg_para: "#ea580c",
      botao_texto_cor: "#ffffff",
      botao_borda_raio: "0.75rem",
      card_borda_raio: "1rem",
      card_sombra: "sm",
      footer_bg_cor: "#431407",
      footer_texto_cor: "#fed7aa",
      pagina_bg_cor: "#fff7ed",
      fonte_familia: "Open Sans",
    },
  ];

function hexToRgbArr(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (h.length !== 6) return [0, 0, 0];
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgbArr(hex1);
  const [r2, g2, b2] = hexToRgbArr(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

type ContrastLevel = "AAA" | "AA" | "FAIL";

function getContrastLevel(fg: string, bg: string): ContrastLevel {
  const ratio = contrastRatio(fg, bg);
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "FAIL";
}

function adjustForContrast(fg: string, bg: string): string[] {
  const [r, g, b] = hexToRgbArr(fg);
  const suggestions: string[] = [];
  const lighter = [
    Math.min(255, r + 60),
    Math.min(255, g + 60),
    Math.min(255, b + 60),
  ];
  const lighterHex = `#${lighter.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  if (contrastRatio(lighterHex, bg) >= 4.5) suggestions.push(lighterHex);
  const darker = [
    Math.max(0, r - 60),
    Math.max(0, g - 60),
    Math.max(0, b - 60),
  ];
  const darkerHex = `#${darker.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  if (contrastRatio(darkerHex, bg) >= 4.5) suggestions.push(darkerHex);
  if (suggestions.length === 0) {
    suggestions.push(
      contrastRatio("#ffffff", bg) >= 4.5 ? "#ffffff" : "#000000",
    );
  }
  return suggestions.slice(0, 2);
}

function getShadowCSS(value: string): string {
  switch (value) {
    case "none":
      return "none";
    case "sm":
      return "0 1px 2px rgba(0,0,0,0.05)";
    case "md":
      return "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)";
    case "lg":
      return "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)";
    case "xl":
      return "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)";
    default:
      return "0 1px 2px rgba(0,0,0,0.05)";
  }
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-full"
        aria-label="Ajuda"
        tabIndex={0}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {show && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap z-50 animate-fadeIn pointer-events-none"
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}

function Accordion({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 transition-colors hover:bg-gray-50/50"
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
          {icon}
        </span>
        <span className="text-sm font-semibold text-gray-800 flex-1">
          {title}
        </span>
        {badge}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{
          maxHeight: isOpen
            ? contentRef.current?.scrollHeight
              ? contentRef.current.scrollHeight + 32 + "px"
              : "2000px"
            : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-5 pb-5 pt-1 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const level = getContrastLevel(fg, bg);
  const ratio = contrastRatio(fg, bg);
  if (level === "FAIL") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700"
        title={`Contraste: ${ratio.toFixed(1)}:1 — Não atende WCAG AA`}
      >
        <AlertTriangle className="h-3 w-3" /> FALHA {ratio.toFixed(1)}:1
      </span>
    );
  }
  if (level === "AAA") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700"
        title={`Contraste: ${ratio.toFixed(1)}:1 — Excelente (AAA)`}
      >
        <CheckCircle2 className="h-3 w-3" /> AAA {ratio.toFixed(1)}:1
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"
      title={`Contraste: ${ratio.toFixed(1)}:1 — Atende WCAG AA`}
    >
      <CheckCircle2 className="h-3 w-3" /> AA {ratio.toFixed(1)}:1
    </span>
  );
}

function ColorFieldContrast({
  label,
  value,
  onChange,
  helpText,
  contrastAgainst,
  contrastLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helpText?: string;
  contrastAgainst?: string;
  contrastLabel?: string;
}) {
  const level = contrastAgainst
    ? getContrastLevel(value, contrastAgainst)
    : null;
  const suggestions =
    contrastAgainst && level === "FAIL"
      ? adjustForContrast(value, contrastAgainst)
      : [];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        {helpText && <Tooltip text={helpText} />}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5 hover:border-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label={label}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "") onChange(v || "#");
          }}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-colors"
          maxLength={7}
          placeholder="#000000"
          aria-label={`${label} (HEX)`}
        />
        <div
          className="w-10 h-10 rounded-xl border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
      </div>
      {contrastAgainst && (
        <div className="flex items-center gap-2 mt-1">
          <ContrastBadge fg={value} bg={contrastAgainst} />
          {contrastLabel && (
            <span className="text-[10px] text-gray-400">
              vs {contrastLabel}
            </span>
          )}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex items-center gap-2 mt-1 p-2 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-[10px] text-amber-700 font-medium">
            Sugestões acessíveis:
          </span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(s)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-amber-200 hover:border-amber-400 text-[10px] font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              title={`Aplicar ${s}`}
            >
              <span
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: s }}
              />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helpText,
  style,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  helpText?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        {helpText && <Tooltip text={helpText} />}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white text-sm transition-colors"
        style={style}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function GradientPreview({ from, to }: { from: string; to: string }) {
  return (
    <div
      className="h-8 rounded-lg border border-gray-200 mt-1"
      style={{ background: `linear-gradient(to right, ${from}, ${to})` }}
      aria-hidden="true"
    />
  );
}

function PreviewFrame({
  tema,
  device,
}: {
  tema: CatalogoTema | Omit<CatalogoTema, "id" | "created_at" | "updated_at">;
  device: DeviceView;
}) {
  const shadowCSS = getShadowCSS(tema.card_sombra);
  const width = device === "mobile" ? 375 : device === "tablet" ? 768 : "100%";
  const scale = device === "mobile" ? 0.85 : device === "tablet" ? 0.75 : 1;

  return (
    <div className="flex justify-center">
      <div
        className="origin-top transition-all duration-300 ease-out"
        style={{
          width: typeof width === "number" ? width : undefined,
          maxWidth: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div
          className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg"
          style={{ fontFamily: tema.fonte_familia + ", sans-serif" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{
              background: `linear-gradient(to right, ${tema.header_bg_de}, ${tema.header_bg_para})`,
              color: tema.header_texto_cor,
            }}
          >
            {device === "mobile" && <Menu className="h-4 w-4 opacity-70" />}
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-bold tracking-tight">Minha Loja</span>
            <div className="flex-1 mx-2">
              <div
                className="w-full h-8 rounded-full px-3 flex items-center text-xs gap-2"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <Search className="h-3.5 w-3.5 opacity-50" />
                <span className="opacity-50 text-xs">Buscar produtos…</span>
              </div>
            </div>
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[8px] font-bold rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: tema.cor_primaria,
                  color: tema.botao_texto_cor,
                }}
              >
                3
              </span>
            </div>
            <User className="h-4 w-4 opacity-70" />
          </div>

          <div className="p-4" style={{ backgroundColor: tema.pagina_bg_cor }}>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-3">
              <span>Início</span>
              <ChevronRight className="h-2.5 w-2.5" />
              <span style={{ color: tema.cor_primaria }}>
                Todos os Produtos
              </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Nossos Produtos
            </h3>

            <div
              className={`grid gap-3 ${device === "mobile" ? "grid-cols-2" : "grid-cols-3"}`}
            >
              {[
                { name: "Camiseta Premium", price: 89.9, badge: "Novo" },
                { name: "Tênis Esportivo", price: 299.9, badge: null },
                { name: "Bolsa Elegante", price: 159.9, badge: "-20%" },
              ].map((product, i) => (
                <div
                  key={i}
                  className="bg-white border overflow-hidden group transition-all duration-200"
                  style={{
                    borderRadius: tema.card_borda_raio,
                    boxShadow: shadowCSS,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-300" />
                    </div>
                    {product.badge && (
                      <span
                        className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: tema.cor_primaria }}
                      >
                        {product.badge}
                      </span>
                    )}
                    <button
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Heart className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <div className="text-[10px] font-semibold text-gray-800 mb-0.5 truncate">
                      {product.name}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span
                        className="text-xs font-extrabold"
                        style={{ color: tema.cor_primaria }}
                      >
                        R$ {product.price.toFixed(2).replace(".", ",")}
                      </span>
                      {i === 2 && (
                        <span className="text-[9px] text-gray-400 line-through">
                          R${" "}
                          {(product.price * 1.25).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    <button
                      className="w-full text-[9px] font-bold py-1.5 text-center transition-all duration-200 flex items-center justify-center gap-1"
                      style={{
                        background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                        color: tema.botao_texto_cor,
                        borderRadius: tema.botao_borda_raio,
                      }}
                      aria-hidden="true"
                    >
                      <ShoppingCart className="h-2.5 w-2.5" />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-200/60">
              {[
                { icon: Truck, text: "Frete grátis" },
                { icon: Shield, text: "Compra segura" },
                { icon: Zap, text: "Pix com desconto" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Icon
                    className="h-3 w-3"
                    style={{ color: tema.cor_secundaria }}
                  />
                  <span className="text-[8px] text-gray-500 font-medium">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: tema.footer_bg_cor,
              color: tema.footer_texto_cor,
            }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs font-bold">Minha Loja</span>
            </div>
            <span className="text-[9px] opacity-60">
              © 2026 Todos os direitos reservados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonStatesPreview({
  tema,
}: {
  tema: CatalogoTema | Omit<CatalogoTema, "id" | "created_at" | "updated_at">;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Estados do Botão
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Normal", opacity: 1, scale: 1 },
          { label: "Hover", opacity: 0.9, scale: 1.02 },
          { label: "Pressionado", opacity: 0.85, scale: 0.98 },
        ].map(({ label, opacity, scale }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <button
              className="w-full py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={{
                background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
                color: tema.botao_texto_cor,
                borderRadius: tema.botao_borda_raio,
                opacity,
                transform: `scale(${scale})`,
              }}
              aria-hidden="true"
              tabIndex={-1}
            >
              <ShoppingCart className="h-3 w-3" />
              Adicionar
            </button>
            <span className="text-[9px] text-gray-400 font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemePreviewMini({
  tema,
}: {
  tema: CatalogoTema | Omit<CatalogoTema, "id" | "created_at" | "updated_at">;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ fontFamily: tema.fonte_familia + ", sans-serif" }}
    >
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{
          background: `linear-gradient(to right, ${tema.header_bg_de}, ${tema.header_bg_para})`,
          color: tema.header_texto_cor,
        }}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold">Minha Loja</span>
        <div className="ml-auto">
          <ShoppingCart className="h-3 w-3" />
        </div>
      </div>
      <div
        className="p-2.5 space-y-1.5"
        style={{ backgroundColor: tema.pagina_bg_cor }}
      >
        <div
          className="bg-white p-2 border border-gray-100"
          style={{
            borderRadius: tema.card_borda_raio,
            boxShadow: getShadowCSS(tema.card_sombra),
          }}
        >
          <div className="w-full h-8 bg-gray-100 rounded mb-1" />
          <div className="text-[9px] font-semibold text-gray-800">
            Produto Exemplo
          </div>
          <div
            className="text-[9px] font-bold"
            style={{ color: tema.cor_primaria }}
          >
            R$ 99,90
          </div>
          <button
            className="w-full mt-1 text-[8px] font-bold py-0.5 text-center"
            style={{
              background: `linear-gradient(to right, ${tema.botao_bg_de}, ${tema.botao_bg_para})`,
              color: tema.botao_texto_cor,
              borderRadius: tema.botao_borda_raio,
            }}
            aria-hidden="true"
            tabIndex={-1}
          >
            Adicionar
          </button>
        </div>
      </div>
      <div
        className="px-2.5 py-1.5 flex items-center gap-1"
        style={{
          backgroundColor: tema.footer_bg_cor,
          color: tema.footer_texto_cor,
        }}
      >
        <Star className="h-2.5 w-2.5" />
        <span className="text-[8px]">© 2026 Minha Loja</span>
      </div>
    </div>
  );
}

const ThemeManager: React.FC = () => {
  const [temas, setTemas] = useState<CatalogoTema[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    msg: string;
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingTema, setEditingTema] = useState<CatalogoTema | null>(null);
  const [draft, setDraft] = useState(TEMA_PADRAO);
  const [isSaving, setIsSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<DeviceView>("desktop");

  const [deletingTheme, setDeletingTheme] = useState<CatalogoTema | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadTemas = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const { temas: data, totalPages: tp } = await fetchTemas(p, 20, s);
      setTemas(data);
      setTotalPages(tp);
      setPage(p);
    } catch (e: any) {
      console.error(e);
      showFeedback("error", "Erro ao carregar temas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemas(1, debouncedSearch);
  }, [debouncedSearch, loadTemas]);

  const showFeedback = (type: "success" | "error" | "info", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const openNew = () => {
    setEditingTema(null);
    setDraft({ ...TEMA_PADRAO });
    setIsEditing(true);
  };

  const openEdit = (tema: CatalogoTema) => {
    setEditingTema(tema);
    setDraft({ ...tema });
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setEditingTema(null);
  };

  const updateDraft = (key: keyof CatalogoTema, value: string | boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!draft.nome.trim()) {
      showFeedback("error", "Informe um nome para o tema.");
      return;
    }
    setIsSaving(true);
    try {
      const { id, created_at, updated_at, ...payload } = draft as any;
      if (editingTema) {
        await updateTema(editingTema.id, payload);
        showFeedback("success", "Tema atualizado com sucesso!");
      } else {
        await createTema(payload);
        showFeedback("success", "Tema criado com sucesso!");
      }
      closeEditor();
      loadTemas(page, debouncedSearch);
    } catch (e: any) {
      showFeedback("error", e?.message || "Erro ao salvar tema.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTheme) return;
    setIsDeleting(true);
    try {
      await deleteTema(deletingTheme.id);
      showFeedback("success", "Tema excluído com sucesso!");
      setDeletingTheme(null);
      loadTemas(page, debouncedSearch);
    } catch (e: any) {
      showFeedback("error", e?.message || "Erro ao excluir tema.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleAtivo = async (tema: CatalogoTema) => {
    try {
      if (tema.ativo) {
        await desativarTema(tema.id);
        showFeedback("success", `Tema "${tema.nome}" desativado.`);
      } else {
        await ativarTema(tema.id);
        showFeedback("success", `Tema "${tema.nome}" ativado!`);
      }
      loadTemas(page, debouncedSearch);
    } catch (e: any) {
      showFeedback("error", e?.message || "Erro ao alterar status do tema.");
    }
  };

  const handleDuplicate = (tema: CatalogoTema) => {
    setEditingTema(null);
    setDraft({ ...tema, id: "", nome: `${tema.nome} (Cópia)`, ativo: false });
    setIsEditing(true);
  };

  const openFromTemplate = (
    tpl: Omit<CatalogoTema, "id" | "created_at" | "updated_at">,
  ) => {
    setEditingTema(null);
    setDraft({ ...TEMA_PADRAO, ...tpl, id: "", nome: tpl.nome });
    setIsEditing(true);
  };

  const FeedbackBar = () =>
    feedback ? (
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium transition-all duration-300 animate-slideUp ${
          feedback.type === "success"
            ? "bg-green-600 text-white"
            : feedback.type === "error"
              ? "bg-red-600 text-white"
              : "bg-indigo-600 text-white"
        }`}
      >
        {feedback.type === "success" && <CheckCircle2 className="h-4 w-4" />}
        {feedback.type === "error" && <AlertTriangle className="h-4 w-4" />}
        {feedback.type === "info" && <Info className="h-4 w-4" />}
        {feedback.msg}
        <button
          onClick={() => setFeedback(null)}
          className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : null;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={closeEditor}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {editingTema ? "Editar Tema" : "Novo Tema"}
              </h1>
              <p className="text-xs text-gray-500">
                Personalize as cores e estilos — alterações aparecem em tempo
                real no preview.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={closeEditor}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-3">
            <Accordion
              title="Informações Gerais"
              icon={<Palette className="h-4 w-4" />}
              defaultOpen={true}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Nome do tema
                  </label>
                  <Tooltip text="Nome interno para identificar este tema na listagem." />
                </div>
                <input
                  type="text"
                  value={draft.nome}
                  onChange={(e) => updateDraft("nome", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white text-sm transition-colors"
                  placeholder="Ex.: Tema Verão 2026"
                  maxLength={80}
                  aria-label="Nome do tema"
                />
              </div>
              <SelectField
                label="Fonte"
                value={draft.fonte_familia}
                onChange={(v) => updateDraft("fonte_familia", v)}
                options={FONTES_DISPONIVEIS.map((f) => ({
                  value: f,
                  label: f,
                }))}
                helpText="Família tipográfica usada em todo o catálogo."
                style={{ fontFamily: draft.fonte_familia }}
              />
              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.ativo}
                    onChange={(e) => updateDraft("ativo", e.target.checked)}
                    className="sr-only peer"
                    aria-label={draft.ativo ? "Tema ativo" : "Tema inativo"}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
                <span className="text-sm text-gray-700 font-medium">
                  {draft.ativo ? "Tema ativo" : "Tema inativo"}
                </span>
                <Tooltip text="Apenas um tema pode ficar ativo por vez. Ao ativar este, o anterior será desativado automaticamente." />
              </div>
            </Accordion>

            <Accordion
              title="Cabeçalho (Header)"
              icon={<Menu className="h-4 w-4" />}
            >
              <p className="text-xs text-gray-500 -mt-1">
                Controle a faixa superior do catálogo: gradiente de fundo e cor
                do texto.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorFieldContrast
                  label="Gradiente — De"
                  value={draft.header_bg_de}
                  onChange={(v) => updateDraft("header_bg_de", v)}
                  helpText="Cor inicial do gradiente do cabeçalho."
                />
                <ColorFieldContrast
                  label="Gradiente — Para"
                  value={draft.header_bg_para}
                  onChange={(v) => updateDraft("header_bg_para", v)}
                  helpText="Cor final do gradiente do cabeçalho."
                />
              </div>
              <GradientPreview
                from={draft.header_bg_de}
                to={draft.header_bg_para}
              />
              <ColorFieldContrast
                label="Cor do Texto"
                value={draft.header_texto_cor}
                onChange={(v) => updateDraft("header_texto_cor", v)}
                helpText="Cor do texto e ícones sobre o cabeçalho."
                contrastAgainst={draft.header_bg_de}
                contrastLabel="fundo do header"
              />
            </Accordion>

            <Accordion
              title="Cores de Destaque"
              icon={<Zap className="h-4 w-4" />}
              badge={
                <div className="flex items-center gap-1 mr-2">
                  <span
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: draft.cor_primaria }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: draft.cor_secundaria }}
                  />
                </div>
              }
            >
              <p className="text-xs text-gray-500 -mt-1">
                Cores usadas em preços, links, badges e destaques.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorFieldContrast
                  label="Cor Primária"
                  value={draft.cor_primaria}
                  onChange={(v) => updateDraft("cor_primaria", v)}
                  helpText="Cor primária usada em preços, badges, ícones e links."
                  contrastAgainst={draft.pagina_bg_cor}
                  contrastLabel="fundo da página"
                />
                <ColorFieldContrast
                  label="Cor Secundária"
                  value={draft.cor_secundaria}
                  onChange={(v) => updateDraft("cor_secundaria", v)}
                  helpText="Cor secundária para ícones de suporte e selos de confiança."
                  contrastAgainst={draft.pagina_bg_cor}
                  contrastLabel="fundo da página"
                />
              </div>
            </Accordion>

            <Accordion
              title="Botões"
              icon={
                <span
                  className="w-4 h-2 rounded-sm"
                  style={{
                    background: `linear-gradient(to right, ${draft.botao_bg_de}, ${draft.botao_bg_para})`,
                  }}
                />
              }
            >
              <p className="text-xs text-gray-500 -mt-1">
                Estilo dos botões de ação (ex.: "Adicionar ao Carrinho").
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorFieldContrast
                  label="Gradiente — De"
                  value={draft.botao_bg_de}
                  onChange={(v) => updateDraft("botao_bg_de", v)}
                  helpText="Cor inicial do gradiente do botão."
                />
                <ColorFieldContrast
                  label="Gradiente — Para"
                  value={draft.botao_bg_para}
                  onChange={(v) => updateDraft("botao_bg_para", v)}
                  helpText="Cor final do gradiente do botão."
                />
              </div>
              <GradientPreview
                from={draft.botao_bg_de}
                to={draft.botao_bg_para}
              />
              <ColorFieldContrast
                label="Cor do Texto"
                value={draft.botao_texto_cor}
                onChange={(v) => updateDraft("botao_texto_cor", v)}
                helpText="Cor do texto dentro do botão."
                contrastAgainst={draft.botao_bg_de}
                contrastLabel="fundo do botão"
              />
              <SelectField
                label="Arredondamento do Botão"
                value={draft.botao_borda_raio}
                onChange={(v) => updateDraft("botao_borda_raio", v)}
                options={BORDER_RADIUS_OPTIONS}
                helpText="Quão arredondados ficam os cantos do botão."
              />
              <div className="pt-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Resultado:
                </p>
                <button
                  className="px-6 py-3 text-sm font-bold transition-all"
                  style={{
                    background: `linear-gradient(to right, ${draft.botao_bg_de}, ${draft.botao_bg_para})`,
                    color: draft.botao_texto_cor,
                    borderRadius: draft.botao_borda_raio,
                  }}
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </Accordion>

            <Accordion
              title="Cards de Produto"
              icon={<ShoppingBag className="h-4 w-4" />}
            >
              <p className="text-xs text-gray-500 -mt-1">
                Aparência dos cards na grade de produtos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Arredondamento"
                  value={draft.card_borda_raio}
                  onChange={(v) => updateDraft("card_borda_raio", v)}
                  options={CARD_RADIUS_OPTIONS}
                  helpText="Quão arredondados ficam os cantos do card."
                />
                <SelectField
                  label="Sombra"
                  value={draft.card_sombra}
                  onChange={(v) => updateDraft("card_sombra", v)}
                  options={SOMBRAS}
                  helpText="Intensidade da sombra abaixo do card."
                />
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Resultado:
                </p>
                <div className="max-w-[200px]">
                  <div
                    className="bg-white border border-gray-200 overflow-hidden"
                    style={{
                      borderRadius: draft.card_borda_raio,
                      boxShadow: getShadowCSS(draft.card_sombra),
                    }}
                  >
                    <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200" />
                    <div className="p-2.5">
                      <div className="text-[10px] font-semibold text-gray-800">
                        Produto Exemplo
                      </div>
                      <div
                        className="text-xs font-bold mt-0.5"
                        style={{ color: draft.cor_primaria }}
                      >
                        R$ 89,90
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Footer & Página"
              icon={<Star className="h-4 w-4" />}
            >
              <p className="text-xs text-gray-500 -mt-1">
                Cores do rodapé e fundo geral do catálogo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorFieldContrast
                  label="Fundo do Footer"
                  value={draft.footer_bg_cor}
                  onChange={(v) => updateDraft("footer_bg_cor", v)}
                  helpText="Cor de fundo do rodapé."
                />
                <ColorFieldContrast
                  label="Texto do Footer"
                  value={draft.footer_texto_cor}
                  onChange={(v) => updateDraft("footer_texto_cor", v)}
                  helpText="Cor do texto sobre o rodapé."
                  contrastAgainst={draft.footer_bg_cor}
                  contrastLabel="fundo do footer"
                />
                <ColorFieldContrast
                  label="Fundo da Página"
                  value={draft.pagina_bg_cor}
                  onChange={(v) => updateDraft("pagina_bg_cor", v)}
                  helpText="Cor de fundo geral do catálogo (atrás dos cards)."
                />
              </div>
            </Accordion>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-4 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-indigo-500" />
                    Pré-visualização
                  </h2>
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    {(
                      [
                        {
                          key: "desktop" as DeviceView,
                          icon: Monitor,
                          label: "Desktop",
                        },
                        {
                          key: "tablet" as DeviceView,
                          icon: Tablet,
                          label: "Tablet",
                        },
                        {
                          key: "mobile" as DeviceView,
                          icon: Smartphone,
                          label: "Mobile",
                        },
                      ] as const
                    ).map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setDeviceView(key)}
                        className={`p-1.5 rounded-md transition-all ${
                          deviceView === key
                            ? "bg-white shadow-sm text-indigo-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={label}
                        aria-label={`Visualizar como ${label}`}
                        aria-pressed={deviceView === key}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 overflow-hidden border border-gray-100">
                  <PreviewFrame tema={draft} device={deviceView} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <ButtonStatesPreview tema={draft} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Exemplo de Preço
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: draft.cor_primaria }}
                  >
                    R$ 129,90
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    R$ 199,90
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap
                    className="h-3.5 w-3.5"
                    style={{ color: draft.cor_primaria }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: draft.cor_primaria }}
                  >
                    35% de desconto no Pix
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FeedbackBar />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Palette className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Gerenciar Temas</h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar temas…"
              className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {loading && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Temas Padrão
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Comece a partir de um tema pronto. Clique em "Usar como base" para
            personalizar.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TEMAS_PRONTOS.map((tpl, idx) => (
            <div
              key={idx}
              className="rounded-xl transition-all hover:shadow-md group"
            >
              <ThemePreviewMini tema={tpl} />
              <div className="mt-2 px-0.5">
                <p className="text-[11px] font-semibold text-gray-700 truncate">
                  {tpl.nome}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {tpl.fonte_familia}
                </p>
              </div>
              <button
                onClick={() => openFromTemplate(tpl)}
                className="w-full mt-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <Plus className="h-3 w-3" />
                Usar como base
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Seus Temas
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {loading && temas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        </div>
      ) : temas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col items-center justify-center py-16">
            <Palette className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              Nenhum tema personalizado encontrado.
            </p>
            <button
              onClick={openNew}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Criar o primeiro tema →
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {temas.map((tema) => (
              <div
                key={tema.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all group ${
                  tema.ativo
                    ? "border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div className="p-3">
                  <ThemePreviewMini tema={tema} />
                </div>

                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        {tema.nome}
                      </h3>
                      {tema.ativo && (
                        <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> ATIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div
                        className="w-4 h-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: tema.cor_primaria }}
                        title="Primária"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white shadow-sm -ml-1"
                        style={{ backgroundColor: tema.cor_secundaria }}
                        title="Secundária"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white shadow-sm -ml-1"
                        style={{ backgroundColor: tema.header_bg_de }}
                        title="Header"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Fonte: {tema.fonte_familia}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleAtivo(tema)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        tema.ativo
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {tema.ativo ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Desativar
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Ativar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(tema)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleDuplicate(tema)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      title="Duplicar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTheme(tema)}
                      className="ml-auto p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => loadTemas(page - 1, debouncedSearch)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => loadTemas(page + 1, debouncedSearch)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={Boolean(deletingTheme)}
        title="Excluir tema"
        description={
          deletingTheme
            ? `Tem certeza que deseja excluir "${deletingTheme.nome}"?`
            : ""
        }
        onClose={() => setDeletingTheme(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      <FeedbackBar />
    </div>
  );
};

export default ThemeManager;
