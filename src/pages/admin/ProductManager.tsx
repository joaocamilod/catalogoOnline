import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
  Loader2,
  Search,
  ImagePlus,
  Star,
  StarOff,
  Settings,
  Upload,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Ruler,
  Lock,
  CircleHelp,
  RefreshCcw,
  PlusCircle,
} from "lucide-react";
import {
  fetchTodosProdutos,
  fetchAllDepartamentos,
  fetchAllSubdepartamentos,
  fetchAllMarcas,
  createProduto,
  updateProduto,
  deleteProduto,
  addImagemProduto,
  deleteImagemProduto,
  updateImagemDestaque,
  uploadImagemProduto,
  deleteImagemStorage,
} from "../../lib/supabase";
import Toast from "../../components/Toast";
import Dialog from "../../components/Dialog";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import { notifyAdmin } from "../../components/AdminGlobalNotifier";
import type {
  Produto,
  Departamento,
  ImagemProduto,
  Subdepartamento,
  Marca,
  ProdutoVariacao,
  ProdutoVariacaoOpcao,
} from "../../types";

interface ProductFormProps {
  initial?: Partial<Produto>;
  departments: Departamento[];
  brands: Marca[];
  loading: boolean;
  onSubmit: (
    d: Partial<Produto>,
    newImages: File[],
    removedImageIds: string[],
  ) => void;
  onCancel: () => void;
}

const VARIACOES_SUGERIDAS = [
  "Cor",
  "Tamanho",
  "Voltagem",
  "Especificação",
  "Modelo",
];

const createVariacaoOpcao = (valor = ""): ProdutoVariacaoOpcao => ({
  id: crypto.randomUUID(),
  valor,
  ativo: true,
  preco: null,
  estoque: null,
});

const createVariacao = (nome = ""): ProdutoVariacao => ({
  id: crypto.randomUUID(),
  nome,
  obrigatoria: true,
  opcoes: [createVariacaoOpcao()],
});

const normalizeVariacoesInput = (value: unknown): ProdutoVariacao[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const nome =
        typeof (item as ProdutoVariacao)?.nome === "string"
          ? (item as ProdutoVariacao).nome
          : "";
      const obrigatoria =
        typeof (item as ProdutoVariacao)?.obrigatoria === "boolean"
          ? (item as ProdutoVariacao).obrigatoria
          : true;
      const opcoesRaw = Array.isArray((item as ProdutoVariacao)?.opcoes)
        ? (item as ProdutoVariacao).opcoes
        : [];
      const opcoes = opcoesRaw.map((opcao) => ({
        id:
          typeof opcao?.id === "string" && opcao.id
            ? opcao.id
            : crypto.randomUUID(),
        valor: typeof opcao?.valor === "string" ? opcao.valor : "",
        ativo: typeof opcao?.ativo === "boolean" ? opcao.ativo : true,
        preco:
          opcao?.preco !== null &&
          opcao?.preco !== undefined &&
          Number.isFinite(Number(opcao.preco))
            ? Number(opcao.preco)
            : null,
        estoque:
          opcao?.estoque !== null &&
          opcao?.estoque !== undefined &&
          Number.isFinite(Number(opcao.estoque))
            ? Math.max(0, Math.floor(Number(opcao.estoque)))
            : null,
      }));

      return {
        id:
          typeof (item as ProdutoVariacao)?.id === "string" &&
          (item as ProdutoVariacao).id
            ? (item as ProdutoVariacao).id
            : crypto.randomUUID(),
        nome,
        obrigatoria,
        opcoes: opcoes.length > 0 ? opcoes : [createVariacaoOpcao()],
      };
    })
    .filter(
      (variacao) => variacao.nome.trim().length > 0 || variacao.opcoes.length,
    );
};

const sanitizeVariacoesForSave = (
  variacoes: ProdutoVariacao[],
): ProdutoVariacao[] => {
  return variacoes
    .map((variacao) => ({
      ...variacao,
      nome: variacao.nome.trim(),
      opcoes: variacao.opcoes
        .map((opcao) => ({
          ...opcao,
          valor: opcao.valor.trim(),
          preco:
            opcao.preco !== null &&
            opcao.preco !== undefined &&
            Number.isFinite(Number(opcao.preco)) &&
            Number(opcao.preco) >= 0
              ? Number(opcao.preco)
              : null,
          estoque:
            opcao.estoque !== null &&
            opcao.estoque !== undefined &&
            Number.isFinite(Number(opcao.estoque)) &&
            Number(opcao.estoque) >= 0
              ? Math.floor(Number(opcao.estoque))
              : null,
        }))
        .filter((opcao) => opcao.valor.length > 0),
    }))
    .filter(
      (variacao) => variacao.nome.length > 0 && variacao.opcoes.length > 0,
    );
};

const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  departments,
  brands,
  loading,
  onSubmit,
  onCancel,
}) => {
  const MAX_PRICE_DIGITS = 11;

  const formatPriceFromNumber = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatPriceInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS);
    if (!digits) return "";
    const cents = Number.parseInt(digits, 10);
    return formatPriceFromNumber(cents / 100);
  };

  const parsePriceToNumber = (formattedValue: string) => {
    if (!formattedValue.trim()) return NaN;
    const normalized = formattedValue.replace(/\./g, "").replace(",", ".");
    return Number.parseFloat(normalized);
  };

  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [infadicional, setInfoadicional] = useState(
    initial?.infadicional ?? "",
  );
  const [preco, setPreco] = useState(
    initial?.valorunitariocomercial !== undefined
      ? formatPriceFromNumber(initial.valorunitariocomercial)
      : "",
  );
  const [estoque, setEstoque] = useState(
    initial?.quantidademinima?.toString() ?? "",
  );
  const [destaque, setDestaque] = useState(initial?.destaque ?? false);
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [exibircatalogo, setExibircatalogo] = useState(
    initial?.exibircatalogo ?? true,
  );
  const [departamentoId, setDepartamentoId] = useState(
    initial?.departamento_id ?? "",
  );
  const [subdepartamentoId, setSubdepartamentoId] = useState(
    initial?.subdepartamento_id ?? "",
  );
  const [marcaId, setMarcaId] = useState(initial?.marca_id ?? "");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isDepartmentModalClosing, setIsDepartmentModalClosing] =
    useState(false);
  const departmentModalTimerRef = useRef<number | null>(null);
  const [existingImages, setExistingImages] = useState<ImagemProduto[]>(
    initial?.imagens ?? [],
  );
  const [departmentSubdepartments, setDepartmentSubdepartments] = useState<
    Subdepartamento[]
  >([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    descricao?: string;
    preco?: string;
    estoque?: string;
    variacoes?: string;
  }>({});
  const [activeTab, setActiveTab] = useState<
    "basico" | "variacoes" | "vitrine"
  >("basico");
  const [variacoes, setVariacoes] = useState<ProdutoVariacao[]>(
    normalizeVariacoesInput(initial?.variacoes),
  );

  const [exibirFreteGratis, setExibirFreteGratis] = useState(
    initial?.exibir_frete_gratis ?? false,
  );
  const [freteGratisValorMinimo, setFreteGratisValorMinimo] = useState(
    initial?.frete_gratis_valor_minimo !== null &&
      initial?.frete_gratis_valor_minimo !== undefined
      ? formatPriceFromNumber(initial.frete_gratis_valor_minimo)
      : "",
  );
  const [freteGratisTexto, setFreteGratisTexto] = useState(
    initial?.frete_gratis_texto ?? "",
  );
  const [exibirCompraSegura, setExibirCompraSegura] = useState(
    initial?.exibir_compra_segura ?? false,
  );
  const [compraSeguraTexto, setCompraSeguraTexto] = useState(
    initial?.compra_segura_texto ?? "",
  );
  const [exibirCriptografiaSsl, setExibirCriptografiaSsl] = useState(
    initial?.exibir_criptografia_ssl ?? false,
  );
  const [criptografiaSslTexto, setCriptografiaSslTexto] = useState(
    initial?.criptografia_ssl_texto ?? "",
  );
  const [exibirDevolucaoGratis, setExibirDevolucaoGratis] = useState(
    initial?.exibir_devolucao_gratis ?? false,
  );
  const [devolucaoDias, setDevolucaoDias] = useState(
    initial?.devolucao_dias?.toString() ?? "",
  );
  const [devolucaoTexto, setDevolucaoTexto] = useState(
    initial?.devolucao_texto ?? "",
  );
  const [exibirGuiaTamanhos, setExibirGuiaTamanhos] = useState(
    initial?.exibir_guia_tamanhos ?? false,
  );
  const [guiaTamanhosLink, setGuiaTamanhosLink] = useState(
    initial?.guia_tamanhos_link ?? "",
  );
  const [guiaTamanhosTexto, setGuiaTamanhosTexto] = useState(
    initial?.guia_tamanhos_texto ?? "",
  );
  const [precoOriginal, setPrecoOriginal] = useState(
    initial?.preco_original !== null && initial?.preco_original !== undefined
      ? formatPriceFromNumber(initial.preco_original)
      : "",
  );
  const [descontoPercentual, setDescontoPercentual] = useState(
    initial?.desconto_percentual !== null &&
      initial?.desconto_percentual !== undefined
      ? initial.desconto_percentual.toString()
      : "",
  );
  const [precoPix, setPrecoPix] = useState(
    initial?.preco_pix !== null && initial?.preco_pix !== undefined
      ? formatPriceFromNumber(initial.preco_pix)
      : "",
  );
  const [descontoPixPercentual, setDescontoPixPercentual] = useState(
    initial?.desconto_pix_percentual !== null &&
      initial?.desconto_pix_percentual !== undefined
      ? initial.desconto_pix_percentual.toString()
      : "",
  );
  const [parcelasQuantidade, setParcelasQuantidade] = useState(
    initial?.parcelas_quantidade?.toString() ?? "",
  );
  const [totalCartao, setTotalCartao] = useState(
    initial?.total_cartao !== null && initial?.total_cartao !== undefined
      ? formatPriceFromNumber(initial.total_cartao)
      : "",
  );
  const [textoAdicionalPreco, setTextoAdicionalPreco] = useState(
    initial?.texto_adicional_preco ?? "",
  );
  const [autoPreview, setAutoPreview] = useState(true);
  const [previewSnapshot, setPreviewSnapshot] = useState<null | {
    precoOriginalNum: number | null;
    precoPixNum: number | null;
    precoComDesconto: number;
    precoBase: number;
    parcelasQtdNum: number | null;
    valorParcelaNum: number | null;
    totalCartaoNum: number | null;
    descontoPixPctNum: number;
    hasDescontoPercentual: boolean;
    hasDescontoPixPercentual: boolean;
  }>(null);
  const [customBadges, setCustomBadges] = useState<
    { id: string; enabled: boolean; titulo: string; texto: string }[]
  >([]);

  const parseOptionalMoney = (value: string) => {
    const n = parsePriceToNumber(value);
    return Number.isNaN(n) ? null : n;
  };

  const parseOptionalPercent = (value: string) => {
    if (!value.trim()) return null;
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const precoBase = parseOptionalMoney(preco) ?? 0;
  const precoOriginalNum = parseOptionalMoney(precoOriginal);
  const hasDescontoPercentual = descontoPercentual.trim() !== "";
  const descontoPctNum = hasDescontoPercentual
    ? Math.min(Math.max(parseOptionalPercent(descontoPercentual) ?? 0, 0), 100)
    : null;
  const precoComDesconto = precoOriginalNum
    ? precoOriginalNum * (1 - (descontoPctNum ?? 0) / 100)
    : precoBase;
  const hasDescontoPixPercentual = descontoPixPercentual.trim() !== "";
  const descontoPixPctNum = Math.min(
    Math.max(parseOptionalPercent(descontoPixPercentual) ?? 0, 0),
    100,
  );
  const precoPixNum =
    parseOptionalMoney(precoPix) ??
    (hasDescontoPixPercentual
      ? precoComDesconto * (1 - descontoPixPctNum / 100)
      : null);
  const parcelasQtdNum = parcelasQuantidade.trim()
    ? Number(parcelasQuantidade) || 1
    : null;
  const totalCartaoNum = parseOptionalMoney(totalCartao) ?? null;
  const valorParcelaNum =
    parcelasQtdNum && totalCartaoNum ? totalCartaoNum / parcelasQtdNum : null;

  const pixMaiorQueOriginal =
    precoOriginalNum !== null &&
    precoPixNum !== null &&
    precoPixNum > precoOriginalNum;

  useEffect(() => {
    if (!autoPreview) return;
    const t = window.setTimeout(() => {
      setPreviewSnapshot({
        precoOriginalNum,
        precoPixNum,
        precoComDesconto,
        precoBase,
        parcelasQtdNum,
        valorParcelaNum,
        totalCartaoNum,
        descontoPixPctNum,
        hasDescontoPercentual,
        hasDescontoPixPercentual,
      });
    }, 220);
    return () => window.clearTimeout(t);
  }, [
    autoPreview,
    precoOriginalNum,
    precoPixNum,
    precoComDesconto,
    precoBase,
    parcelasQtdNum,
    valorParcelaNum,
    totalCartaoNum,
    descontoPixPctNum,
    hasDescontoPercentual,
    hasDescontoPixPercentual,
  ]);

  const previewData = previewSnapshot ?? {
    precoOriginalNum,
    precoPixNum,
    precoComDesconto,
    precoBase,
    parcelasQtdNum,
    valorParcelaNum,
    totalCartaoNum,
    descontoPixPctNum,
    hasDescontoPercentual,
    hasDescontoPixPercentual,
  };

  const variacoesSanitizadas = sanitizeVariacoesForSave(variacoes);
  const usaEstoquePorVariacoes = variacoes.length > 0;
  const estoqueTotalVariacoes = variacoesSanitizadas.reduce(
    (sumVariacoes, variacao) =>
      sumVariacoes +
      variacao.opcoes.reduce(
        (sumOpcoes, opcao) => sumOpcoes + (opcao.estoque ?? 0),
        0,
      ),
    0,
  );

  useEffect(() => {
    if (!usaEstoquePorVariacoes) return;
    setEstoque((prev) =>
      prev === String(estoqueTotalVariacoes)
        ? prev
        : String(estoqueTotalVariacoes),
    );
  }, [usaEstoquePorVariacoes, estoqueTotalVariacoes]);

  const validateRequiredFields = () => {
    const nextErrors: {
      descricao?: string;
      preco?: string;
      estoque?: string;
      variacoes?: string;
    } = {};

    if (!descricao.trim())
      nextErrors.descricao = "Nome do produto é obrigatório.";

    const parsedPrice = parsePriceToNumber(preco);

    if (!preco.trim()) {
      nextErrors.preco = "Preço é obrigatório.";
    } else if (Number.isNaN(parsedPrice)) {
      nextErrors.preco = "Informe um preço válido.";
    }

    if (usaEstoquePorVariacoes) {
      for (let vi = 0; vi < variacoes.length; vi++) {
        const variacao = variacoes[vi];
        if (!variacao.nome.trim()) {
          nextErrors.variacoes = `Informe o nome da variação #${vi + 1}.`;
          break;
        }

        if (!variacao.opcoes.length) {
          nextErrors.variacoes = `Adicione ao menos uma opção para ${variacao.nome}.`;
          break;
        }

        for (let oi = 0; oi < variacao.opcoes.length; oi++) {
          const opcao = variacao.opcoes[oi];
          if (!opcao.valor.trim()) {
            nextErrors.variacoes = `Informe o nome da opção #${oi + 1} em ${variacao.nome}.`;
            break;
          }

          const estoqueOpcao = Number(opcao.estoque);
          if (
            opcao.estoque === null ||
            opcao.estoque === undefined ||
            Number.isNaN(estoqueOpcao) ||
            estoqueOpcao < 0
          ) {
            nextErrors.variacoes = `Informe o estoque da opção "${opcao.valor}" em ${variacao.nome}.`;
            break;
          }
        }

        if (nextErrors.variacoes) break;
      }
    } else if (!estoque.trim()) {
      nextErrors.estoque = "Estoque é obrigatório.";
    } else if (Number.isNaN(Number(estoque))) {
      nextErrors.estoque = "Informe um estoque válido.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearVariacoesError = () => {
    if (!fieldErrors.variacoes) return;
    setFieldErrors((prev) => ({ ...prev, variacoes: undefined }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const removeNewFile = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (img: ImagemProduto) => {
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
    setRemovedIds((prev) => [...prev, img.id]);
  };

  useEffect(() => {
    return () => {
      if (departmentModalTimerRef.current) {
        window.clearTimeout(departmentModalTimerRef.current);
      }
    };
  }, []);

  const openDepartmentModal = () => {
    if (departmentModalTimerRef.current) {
      window.clearTimeout(departmentModalTimerRef.current);
    }
    setIsDepartmentModalClosing(false);
    setIsDepartmentModalOpen(true);
  };

  const closeDepartmentModal = () => {
    setIsDepartmentModalClosing(true);
    departmentModalTimerRef.current = window.setTimeout(() => {
      setIsDepartmentModalOpen(false);
      setIsDepartmentModalClosing(false);
    }, 200);
  };

  const selectedDepartment = departments.find((d) => d.id === departamentoId);
  const selectedSubdepartment = departmentSubdepartments.find(
    (s) => s.id === subdepartamentoId,
  );
  const filteredDepartments = departments.filter((d) =>
    d.descricao.toLowerCase().includes(departmentSearch.toLowerCase()),
  );
  const filteredSubdepartments = departmentSubdepartments;

  useEffect(() => {
    if (!departamentoId) {
      setDepartmentSubdepartments([]);
      setSubdepartamentoId("");
      return;
    }
    fetchAllSubdepartamentos(departamentoId)
      .then(setDepartmentSubdepartments)
      .catch(() => setDepartmentSubdepartments([]));
  }, [departamentoId]);

  useEffect(() => {
    if (!subdepartamentoId) return;
    const exists = filteredSubdepartments.some(
      (item) => item.id === subdepartamentoId,
    );
    if (!exists) {
      setSubdepartamentoId("");
    }
  }, [filteredSubdepartments, subdepartamentoId]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateRequiredFields()) return;
        const quantidademinimaFinal = usaEstoquePorVariacoes
          ? estoqueTotalVariacoes
          : parseInt(estoque) || 0;
        onSubmit(
          {
            descricao,
            infadicional,
            valorunitariocomercial: parsePriceToNumber(preco) || 0,
            quantidademinima: quantidademinimaFinal,
            destaque,
            ativo,
            exibircatalogo,
            departamento_id: departamentoId || undefined,
            subdepartamento_id: subdepartamentoId || undefined,
            marca_id: marcaId || undefined,
            exibir_frete_gratis: exibirFreteGratis,
            frete_gratis_valor_minimo: parseOptionalMoney(
              freteGratisValorMinimo,
            ),
            frete_gratis_texto: freteGratisTexto.trim() || null,
            exibir_compra_segura: exibirCompraSegura,
            compra_segura_texto: compraSeguraTexto.trim() || null,
            exibir_criptografia_ssl: exibirCriptografiaSsl,
            criptografia_ssl_texto: criptografiaSslTexto.trim() || null,
            exibir_devolucao_gratis: exibirDevolucaoGratis,
            devolucao_dias: Number(devolucaoDias) || null,
            devolucao_texto: devolucaoTexto.trim() || null,
            exibir_guia_tamanhos: exibirGuiaTamanhos,
            guia_tamanhos_link: guiaTamanhosLink.trim() || null,
            guia_tamanhos_texto: guiaTamanhosTexto.trim() || null,
            preco_original: parseOptionalMoney(precoOriginal),
            desconto_percentual: hasDescontoPercentual ? descontoPctNum : null,
            preco_pix: precoPix.trim() ? parseOptionalMoney(precoPix) : null,
            desconto_pix_percentual: hasDescontoPixPercentual
              ? descontoPixPctNum
              : null,
            parcelas_quantidade: parcelasQtdNum,
            total_cartao: parseOptionalMoney(totalCartao),
            texto_adicional_preco: textoAdicionalPreco.trim() || null,
            variacoes: variacoesSanitizadas,
          },
          newFiles,
          removedIds,
        );
      }}
      className="space-y-4"
    >
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("basico")}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "basico"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Dados Básicos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("variacoes")}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "variacoes"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Variações & Grades
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vitrine")}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "vitrine"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Vitrine & Preços
        </button>
      </div>

      {activeTab === "basico" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                if (fieldErrors.descricao) {
                  setFieldErrors((prev) => ({ ...prev, descricao: undefined }));
                }
              }}
              className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
                fieldErrors.descricao
                  ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              }`}
              placeholder="Nome do produto"
              autoFocus
            />
            {fieldErrors.descricao && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.descricao}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição
            </label>
            <textarea
              value={infadicional}
              onChange={(e) => setInfoadicional(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              placeholder="Detalhes, características…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preço (R$) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={preco}
                onChange={(e) => {
                  setPreco(formatPriceInput(e.target.value));
                  if (fieldErrors.preco) {
                    setFieldErrors((prev) => ({ ...prev, preco: undefined }));
                  }
                }}
                className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
                  fieldErrors.preco
                    ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                }`}
                placeholder="0,00"
                maxLength={14}
              />
              {fieldErrors.preco && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.preco}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Estoque total *
              </label>
              <input
                type="number"
                value={estoque}
                onChange={(e) => {
                  if (usaEstoquePorVariacoes) return;
                  setEstoque(e.target.value);
                  if (fieldErrors.estoque) {
                    setFieldErrors((prev) => ({ ...prev, estoque: undefined }));
                  }
                }}
                className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
                  fieldErrors.estoque
                    ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                    : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                }`}
                placeholder="0"
                min="0"
                readOnly={usaEstoquePorVariacoes}
                disabled={usaEstoquePorVariacoes}
              />
              {usaEstoquePorVariacoes && (
                <p className="mt-1 text-xs text-indigo-600">
                  Calculado automaticamente pela soma dos estoques das opções.
                </p>
              )}
              {fieldErrors.estoque && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.estoque}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Departamento
            </label>
            <button
              type="button"
              onClick={openDepartmentModal}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white text-left flex items-center justify-between"
            >
              <span
                className={
                  selectedDepartment ? "text-gray-900" : "text-gray-500"
                }
              >
                {selectedDepartment?.descricao ?? "Selecionar departamento"}
              </span>
              <Search className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subdepartamento
              </label>
              <select
                value={subdepartamentoId}
                onChange={(e) => setSubdepartamentoId(e.target.value)}
                disabled={!departamentoId}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">
                  {!departamentoId
                    ? "Selecione um departamento primeiro"
                    : "Selecione um subdepartamento"}
                </option>
                {filteredSubdepartments.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nome}
                  </option>
                ))}
              </select>
              {selectedSubdepartment && (
                <p className="mt-1 text-xs text-gray-500">
                  {selectedSubdepartment.nome}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Marca
              </label>
              <select
                value={marcaId}
                onChange={(e) => setMarcaId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Selecione uma marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Destaque", value: destaque, set: setDestaque },
              { label: "Ativo", value: ativo, set: setAtivo },
              {
                label: "No catálogo",
                value: exibircatalogo,
                set: setExibircatalogo,
              },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => set((v: boolean) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Imagens
              </label>
              <span className="text-xs text-gray-500">
                {existingImages.length + newPreviews.length} selecionada(s)
              </span>
            </div>

            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Imagens atuais
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt=""
                        onClick={() => setPreviewImageUrl(img.url)}
                        className={`w-full aspect-square object-cover rounded-xl border-2 cursor-zoom-in ${
                          img.isimagemdestaque
                            ? "border-indigo-500"
                            : "border-gray-200"
                        }`}
                      />
                      {img.isimagemdestaque && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-indigo-600/90 text-white text-[10px] font-semibold">
                          Destaque
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newPreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Novas imagens
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {newPreviews.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt=""
                        onClick={() => setPreviewImageUrl(url)}
                        className="w-full aspect-square object-cover rounded-xl border-2 border-dashed border-indigo-300 cursor-zoom-in"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingImages.length === 0 && newPreviews.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                Nenhuma imagem adicionada ainda.
              </div>
            )}

            <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm text-gray-600">
              <ImagePlus className="h-5 w-5 text-indigo-400" />
              Adicionar imagens
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-1.5">
              JPEG, PNG, WebP — máx. 5 MB por arquivo
            </p>
          </div>
        </>
      )}

      {activeTab === "variacoes" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
            <h3 className="text-xl font-bold text-gray-900">
              Variações e Grades do Produto
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Crie combinações como Cor, Tamanho, Voltagem e outras
              características para facilitar a escolha do cliente.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900">
                1) Atalhos de variação
              </h4>
              <span className="text-xs text-gray-400">Opcional</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {VARIACOES_SUGERIDAS.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => {
                    clearVariacoesError();
                    setVariacoes((prev) => [...prev, createVariacao(sugestao)]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {sugestao}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  clearVariacoesError();
                  setVariacoes((prev) => [...prev, createVariacao()]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Nova variação
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-gray-900">
                2) Estrutura da grade
              </h4>
              <span className="text-xs text-gray-400">
                {variacoes.length} variação(ões)
              </span>
            </div>

            <div className="max-h-[38vh] min-[420px]:max-h-[42vh] sm:max-h-[46vh] lg:max-h-[52vh] overflow-y-auto pr-1 -mr-1 space-y-3">
              {usaEstoquePorVariacoes && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                  <p className="text-xs text-indigo-700">
                    Com variações ativas, são obrigatórios:{" "}
                    <strong>Nome da variação</strong>, <strong>Opção</strong> e{" "}
                    <strong>Estoque</strong>. O preço é opcional e, quando
                    vazio, será usado o preço base do produto.
                  </p>
                </div>
              )}
              {variacoes.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                  Nenhuma variação cadastrada. Use os atalhos acima para criar
                  sua primeira grade.
                </div>
              )}

              {variacoes.map((variacao, variacaoIndex) => (
                <div
                  key={variacao.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <input
                      type="text"
                      value={variacao.nome}
                      onChange={(e) => {
                        clearVariacoesError();
                        setVariacoes((prev) =>
                          prev.map((item) =>
                            item.id === variacao.id
                              ? { ...item, nome: e.target.value }
                              : item,
                          ),
                        );
                      }}
                      placeholder={`Nome da variação #${variacaoIndex + 1} (ex: Cor)`}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex max-[420px]:flex-col max-[420px]:items-stretch items-center gap-3 sm:justify-end">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          Obrigatória
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={variacao.obrigatoria}
                          onClick={() => {
                            clearVariacoesError();
                            setVariacoes((prev) =>
                              prev.map((item) =>
                                item.id === variacao.id
                                  ? { ...item, obrigatoria: !item.obrigatoria }
                                  : item,
                              ),
                            );
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${variacao.obrigatoria ? "bg-emerald-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${variacao.obrigatoria ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          clearVariacoesError();
                          setVariacoes((prev) =>
                            prev.filter((item) => item.id !== variacao.id),
                          );
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-1">
                      <span className="sm:col-span-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        Opção *
                      </span>
                      <span className="sm:col-span-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        Preço (R$)
                      </span>
                      <span className="sm:col-span-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        Estoque *
                      </span>
                    </div>
                    {variacao.opcoes.map((opcao, opcaoIndex) => (
                      <div
                        key={opcao.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-xl border border-gray-200 p-2 bg-gray-50"
                      >
                        <label className="sm:hidden text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Opção *
                        </label>
                        <input
                          type="text"
                          value={opcao.valor}
                          onChange={(e) => {
                            clearVariacoesError();
                            setVariacoes((prev) =>
                              prev.map((item) =>
                                item.id === variacao.id
                                  ? {
                                      ...item,
                                      opcoes: item.opcoes.map((op) =>
                                        op.id === opcao.id
                                          ? { ...op, valor: e.target.value }
                                          : op,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          placeholder={`Opção ${opcaoIndex + 1} (ex: Azul)`}
                          className="sm:col-span-5 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        />
                        <label className="sm:hidden text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Preço (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={opcao.preco ?? ""}
                          onChange={(e) => {
                            clearVariacoesError();
                            const value = e.target.value;
                            setVariacoes((prev) =>
                              prev.map((item) =>
                                item.id === variacao.id
                                  ? {
                                      ...item,
                                      opcoes: item.opcoes.map((op) =>
                                        op.id === opcao.id
                                          ? {
                                              ...op,
                                              preco:
                                                value === ""
                                                  ? null
                                                  : Number.isFinite(
                                                        Number(value),
                                                      )
                                                    ? Math.max(0, Number(value))
                                                    : null,
                                            }
                                          : op,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          placeholder="Padrão do produto"
                          className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        />
                        <label className="sm:hidden text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                          Estoque *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={opcao.estoque ?? ""}
                          onChange={(e) => {
                            clearVariacoesError();
                            const value = e.target.value;
                            setVariacoes((prev) =>
                              prev.map((item) =>
                                item.id === variacao.id
                                  ? {
                                      ...item,
                                      opcoes: item.opcoes.map((op) =>
                                        op.id === opcao.id
                                          ? {
                                              ...op,
                                              estoque:
                                                value === ""
                                                  ? null
                                                  : Number.isFinite(
                                                        Number(value),
                                                      )
                                                    ? Math.max(
                                                        0,
                                                        Math.floor(
                                                          Number(value),
                                                        ),
                                                      )
                                                    : null,
                                            }
                                          : op,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          placeholder="0"
                          className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            clearVariacoesError();
                            setVariacoes((prev) =>
                              prev.map((item) =>
                                item.id === variacao.id
                                  ? {
                                      ...item,
                                      opcoes:
                                        item.opcoes.length > 1
                                          ? item.opcoes.filter(
                                              (op) => op.id !== opcao.id,
                                            )
                                          : item.opcoes,
                                    }
                                  : item,
                              ),
                            );
                          }}
                          className="sm:col-span-1 px-2.5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                          title="Remover opção"
                        >
                          <X className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      clearVariacoesError();
                      setVariacoes((prev) =>
                        prev.map((item) =>
                          item.id === variacao.id
                            ? {
                                ...item,
                                opcoes: [...item.opcoes, createVariacaoOpcao()],
                              }
                            : item,
                        ),
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-violet-700 border border-violet-200 hover:bg-violet-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar opção
                  </button>
                </div>
              ))}
              {fieldErrors.variacoes && (
                <p className="text-xs text-red-600 font-medium">
                  {fieldErrors.variacoes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "vitrine" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
            <h3 className="text-xl font-bold text-gray-900">
              Configurações da Vitrine para o Cliente
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Tudo que o cliente verá no card e no modal full-screen
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-gray-900">
                1) Badges da Vitrine
              </h4>
              <span className="text-xs text-gray-400">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mostrar Frete Grátis
                    </p>
                    <p className="text-xs text-gray-500">
                      Valor mínimo em reais
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={exibirFreteGratis}
                    onClick={() => setExibirFreteGratis((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exibirFreteGratis ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exibirFreteGratis ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={freteGratisValorMinimo}
                    onChange={(e) =>
                      setFreteGratisValorMinimo(
                        formatPriceInput(e.target.value),
                      )
                    }
                    placeholder="Acima de R$"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                  />
                  <input
                    type="text"
                    maxLength={80}
                    value={freteGratisTexto}
                    onChange={(e) => setFreteGratisTexto(e.target.value)}
                    placeholder="Texto personalizado"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mostrar Compra Segura
                    </p>
                    <p className="text-xs text-gray-500">
                      Mensagem de confiança
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={exibirCompraSegura}
                    onClick={() => setExibirCompraSegura((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exibirCompraSegura ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exibirCompraSegura ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={compraSeguraTexto}
                  onChange={(e) => setCompraSeguraTexto(e.target.value)}
                  placeholder="Compra Segura com Criptografia SSL"
                  className="px-3 py-2.5 border border-gray-300 rounded-xl w-full"
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mostrar Devolução Grátis
                    </p>
                    <p className="text-xs text-gray-500">Prazo em dias</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={exibirDevolucaoGratis}
                    onClick={() => setExibirDevolucaoGratis((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exibirDevolucaoGratis ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exibirDevolucaoGratis ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={devolucaoDias}
                    onChange={(e) => setDevolucaoDias(e.target.value)}
                    placeholder="Dias"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                  />
                  <input
                    type="text"
                    maxLength={80}
                    value={devolucaoTexto}
                    onChange={(e) => setDevolucaoTexto(e.target.value)}
                    placeholder="Texto de devolução"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mostrar Guia de Tamanhos
                    </p>
                    <p className="text-xs text-gray-500">
                      Link e texto exibido
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={exibirGuiaTamanhos}
                    onClick={() => setExibirGuiaTamanhos((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exibirGuiaTamanhos ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exibirGuiaTamanhos ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <input
                  type="url"
                  maxLength={220}
                  value={guiaTamanhosLink}
                  onChange={(e) => setGuiaTamanhosLink(e.target.value)}
                  placeholder="https://..."
                  className="px-3 py-2.5 border border-gray-300 rounded-xl w-full"
                />
                <input
                  type="text"
                  maxLength={50}
                  value={guiaTamanhosTexto}
                  onChange={(e) => setGuiaTamanhosTexto(e.target.value)}
                  placeholder='Texto (ex: "Guia de tamanhos")'
                  className="px-3 py-2.5 border border-gray-300 rounded-xl w-full"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setCustomBadges((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    enabled: true,
                    titulo: "Badge personalizado",
                    texto: "",
                  },
                ])
              }
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900"
            >
              <PlusCircle className="h-4 w-4" />+ Adicionar badge personalizado
            </button>
            {customBadges.length > 0 && (
              <div className="mt-3 space-y-2">
                {customBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-lg border border-gray-200 p-2 flex gap-2"
                  >
                    <input
                      type="text"
                      value={badge.titulo}
                      maxLength={40}
                      onChange={(e) =>
                        setCustomBadges((prev) =>
                          prev.map((b) =>
                            b.id === badge.id
                              ? { ...b, titulo: e.target.value }
                              : b,
                          ),
                        )
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
                    />
                    <input
                      type="text"
                      value={badge.texto}
                      maxLength={70}
                      onChange={(e) =>
                        setCustomBadges((prev) =>
                          prev.map((b) =>
                            b.id === badge.id
                              ? { ...b, texto: e.target.value }
                              : b,
                          ),
                        )
                      }
                      placeholder="Texto"
                      className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm p-4 sm:p-5">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              2) Calculadora de Preços Inteligente
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Preço de tabela (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={precoOriginal}
                      onChange={(e) =>
                        setPrecoOriginal(formatPriceInput(e.target.value))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Desconto da loja (%)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      maxLength={6}
                      value={descontoPercentual}
                      onChange={(e) =>
                        setDescontoPercentual(
                          e.target.value.replace(/[^0-9,]/g, ""),
                        )
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Preço no Pix (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={precoPix}
                      onChange={(e) =>
                        setPrecoPix(formatPriceInput(e.target.value))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      % desconto Pix
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      maxLength={6}
                      value={descontoPixPercentual}
                      onChange={(e) =>
                        setDescontoPixPercentual(
                          e.target.value.replace(/[^0-9,]/g, ""),
                        )
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Parcelamento
                    </label>
                    <select
                      value={parcelasQuantidade}
                      onChange={(e) => setParcelasQuantidade(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    >
                      <option value="">Sem parcelamento</option>
                      {[3, 6, 9, 10, 12].map((n) => (
                        <option key={n} value={n}>
                          {n}x
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Total no cartão (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={totalCartao}
                      onChange={(e) =>
                        setTotalCartao(formatPriceInput(e.target.value))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Valor da parcela (auto)
                    </label>
                    <input
                      readOnly
                      value={
                        valorParcelaNum
                          ? formatPriceFromNumber(valorParcelaNum)
                          : ""
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Texto adicional
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={textoAdicionalPreco}
                      onChange={(e) => setTextoAdicionalPreco(e.target.value)}
                      placeholder="Ex: 5% de desconto à vista"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
                {pixMaiorQueOriginal && (
                  <p className="text-xs text-red-600 font-medium">
                    O preço no Pix não pode ser maior que o preço de tabela.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CircleHelp className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-800">
                    Como vai aparecer no modal do cliente
                  </p>
                </div>
                <div className="space-y-1">
                  {previewData.precoOriginalNum ? (
                    <p className="text-sm text-gray-400 line-through">
                      R$ {formatPriceFromNumber(previewData.precoOriginalNum)}
                    </p>
                  ) : null}
                  <p className="text-3xl font-extrabold text-gray-900 leading-none">
                    R${" "}
                    {formatPriceFromNumber(
                      previewData.precoPixNum ||
                        previewData.precoComDesconto ||
                        previewData.precoBase,
                    )}
                    {(previewData.precoPixNum ||
                      previewData.hasDescontoPixPercentual) && (
                      <span className="text-sm text-green-600 ml-2">
                        no Pix
                      </span>
                    )}
                  </p>
                  {textoAdicionalPreco && (
                    <p className="text-xs text-green-700 font-semibold">
                      {textoAdicionalPreco}
                    </p>
                  )}
                  {previewData.parcelasQtdNum && previewData.valorParcelaNum ? (
                    <p className="text-sm text-gray-700">
                      ou {previewData.parcelasQtdNum}x de R${" "}
                      {formatPriceFromNumber(previewData.valorParcelaNum)} sem
                      juros
                    </p>
                  ) : null}
                  {previewData.totalCartaoNum ? (
                    <p className="text-xs text-gray-500">
                      Total no cartão: R${" "}
                      {formatPriceFromNumber(previewData.totalCartaoNum)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h4 className="text-base font-semibold text-gray-900">
                3) Visualização em Tempo Real
              </h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewSnapshot({
                      precoOriginalNum,
                      precoPixNum,
                      precoComDesconto,
                      precoBase,
                      parcelasQtdNum,
                      valorParcelaNum,
                      totalCartaoNum,
                      descontoPixPctNum,
                      hasDescontoPercentual,
                      hasDescontoPixPercentual,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar previews
                </button>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoPreview}
                    onChange={(e) => setAutoPreview(e.target.checked)}
                  />
                  Atualizar automaticamente
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Preview do Card do Catálogo
                </p>
                <div className="w-full max-w-[320px] bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                  <p className="font-semibold text-gray-900 line-clamp-2">
                    {descricao || "Nome do produto"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {infadicional || "Descrição do produto..."}
                  </p>
                  <div className="mt-3">
                    {previewData.precoOriginalNum ? (
                      <p className="text-xs text-gray-400 line-through">
                        R$ {formatPriceFromNumber(previewData.precoOriginalNum)}
                      </p>
                    ) : null}
                    <p className="text-xl font-extrabold text-violet-700">
                      R$ {formatPriceFromNumber(previewData.precoBase)}
                    </p>
                    {(previewData.precoPixNum ||
                      previewData.hasDescontoPixPercentual) && (
                      <p className="text-xs text-green-600 font-semibold">
                        R${" "}
                        {formatPriceFromNumber(
                          previewData.precoPixNum ||
                            previewData.precoComDesconto,
                        )}{" "}
                        no Pix
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Preview do Modal Full-Screen
                </p>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 min-h-[260px]">
                  <p className="text-lg font-bold text-gray-900 line-clamp-2">
                    {descricao || "Nome do produto"}
                  </p>
                  <div className="space-y-1">
                    {previewData.precoOriginalNum ? (
                      <p className="text-sm text-gray-400 line-through">
                        R$ {formatPriceFromNumber(previewData.precoOriginalNum)}
                      </p>
                    ) : null}
                    <p className="text-3xl font-extrabold text-gray-900">
                      R${" "}
                      {formatPriceFromNumber(
                        previewData.precoPixNum ||
                          previewData.precoComDesconto ||
                          previewData.precoBase,
                      )}
                      {(previewData.precoPixNum ||
                        previewData.hasDescontoPixPercentual) && (
                        <span className="text-sm text-green-600 ml-2">
                          no Pix
                        </span>
                      )}
                    </p>
                    {textoAdicionalPreco && (
                      <p className="text-xs text-green-700 font-semibold">
                        {textoAdicionalPreco}
                      </p>
                    )}
                    {previewData.parcelasQtdNum &&
                    previewData.valorParcelaNum ? (
                      <p className="text-sm text-gray-700">
                        ou {previewData.parcelasQtdNum}x de R${" "}
                        {formatPriceFromNumber(previewData.valorParcelaNum)} sem
                        juros
                      </p>
                    ) : null}
                    {previewData.totalCartaoNum ? (
                      <p className="text-xs text-gray-500">
                        Total no cartão: R${" "}
                        {formatPriceFromNumber(previewData.totalCartaoNum)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {exibirFreteGratis && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-100">
                        <Truck className="h-3.5 w-3.5" />
                        {freteGratisTexto || "Frete Grátis"}
                      </span>
                    )}
                    {exibirCompraSegura && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {compraSeguraTexto || "Compra Segura"}
                      </span>
                    )}
                    {exibirCriptografiaSsl && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Lock className="h-3.5 w-3.5" />
                        {criptografiaSslTexto || "Criptografia SSL"}
                      </span>
                    )}
                    {exibirDevolucaoGratis && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                        <RotateCcw className="h-3.5 w-3.5" />
                        {devolucaoTexto || "Devolução Grátis"}
                      </span>
                    )}
                    {exibirGuiaTamanhos && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                        <Ruler className="h-3.5 w-3.5" />
                        {guiaTamanhosTexto || "Guia de tamanhos"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 flex justify-end gap-3 border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Salvar
            </>
          )}
        </button>
      </div>

      {isDepartmentModalOpen && (
        <div
          className={`fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 transition-opacity duration-200 ${
            isDepartmentModalClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDepartmentModal();
          }}
        >
          <div
            className={`bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden transition-all duration-200 ${
              isDepartmentModalClosing
                ? "opacity-0 translate-y-2 scale-[0.98]"
                : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Selecionar departamento
              </h3>
              <button
                type="button"
                onClick={closeDepartmentModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                  placeholder="Buscar departamento..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  setDepartamentoId("");
                  closeDepartmentModal();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  departamentoId === ""
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                — Sem departamento —
              </button>

              {filteredDepartments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDepartamentoId(d.id);
                    closeDepartmentModal();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    departamentoId === d.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {d.descricao}
                </button>
              ))}

              {filteredDepartments.length === 0 && (
                <p className="px-3 py-3 text-sm text-gray-500">
                  Nenhum departamento encontrado.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewImageUrl(null);
          }}
        >
          <div className="relative max-w-3xl w-full">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Pré-visualização da imagem do produto"
              className="w-full max-h-[80vh] object-contain rounded-2xl bg-white"
            />
          </div>
        </div>
      )}
    </form>
  );
};

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [departments, setDepartments] = useState<Departamento[]>([]);
  const [brands, setBrands] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Produto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [actionMenuOpenUpId, setActionMenuOpenUpId] = useState<string | null>(
    null,
  );
  const LIMIT = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const load = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      let targetPage = page;
      let { produtos, totalPages: tp } = await fetchTodosProdutos(
        targetPage,
        LIMIT,
        search,
      );

      const normalizedTotalPages = Math.max(tp, 1);
      if (targetPage > normalizedTotalPages) {
        targetPage = normalizedTotalPages;
        const fallback = await fetchTodosProdutos(targetPage, LIMIT, search);
        produtos = fallback.produtos;
        tp = fallback.totalPages;
      }

      setProducts(produtos);
      setTotalPages(Math.max(tp, 1));
      setCurrentPage(targetPage);
    } catch (e: any) {
      setError("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAllDepartamentos(), fetchAllMarcas()])
      .then(([deps, marcs]) => {
        setDepartments(deps);
        setBrands(marcs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load(1, debouncedSearch);
  }, [debouncedSearch, load]);

  useEffect(() => {
    if (!openActionMenuId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) {
        setOpenActionMenuId(null);
        setActionMenuOpenUpId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionMenuId]);

  const handleSave = async (
    data: Partial<Produto>,
    newFiles: File[],
    removedImageIds: string[],
  ) => {
    setSaving(true);
    try {
      let produtoId: string;

      if (editing) {
        await updateProduto(editing.id, data);
        produtoId = editing.id;
        notifyAdmin({ message: "Produto atualizado com sucesso." });
      } else {
        const novo = await createProduto(data as any);
        produtoId = novo.id;
        notifyAdmin({ message: "Produto criado com sucesso." });
      }

      for (const file of newFiles) {
        const url = await uploadImagemProduto(file, produtoId);
        await addImagemProduto(produtoId, url, false);
      }

      for (const imgId of removedImageIds) {
        await deleteImagemProduto(imgId);
        const img = editing?.imagens?.find((i) => i.id === imgId);
        if (img?.url) await deleteImagemStorage(img.url).catch(() => {});
      }

      if (newFiles.length > 0 && !editing?.imagens?.length) {
        const { produtos } = await fetchTodosProdutos(1, 1, "");
      }

      setIsDialogOpen(false);
      setEditing(null);
      await load(currentPage, debouncedSearch);
    } catch (e: any) {
      notifyAdmin({
        message: `Erro ao salvar produto: ${e.message ?? "falha inesperada."}`,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setLoading(true);
    try {
      for (const img of deletingProduct.imagens ?? []) {
        await deleteImagemStorage(img.url).catch(() => {});
      }
      await deleteProduto(deletingProduct.id);
      setToast({ msg: "Produto excluído!", type: "success" });
      setDeletingProduct(null);
      await load(currentPage, debouncedSearch);
    } catch (e: any) {
      setToast({ msg: "Erro ao excluir produto.", type: "error" });
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  const handleToggleCatalog = async (p: Produto) => {
    try {
      await updateProduto(p.id, { exibircatalogo: !p.exibircatalogo });
      setToast({
        msg: p.exibircatalogo
          ? "Produto ocultado do catálogo."
          : "Produto visível no catálogo.",
        type: "success",
      });
      await load(currentPage, debouncedSearch);
    } catch {
      setToast({ msg: "Erro ao atualizar visibilidade.", type: "error" });
    }
  };

  const getMainImage = (p: Produto) => {
    const imgs = p.imagens ?? [];
    return (
      imgs.find((i) => i.isimagemdestaque)?.url ??
      imgs[0]?.url ??
      "https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png"
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/80 -mx-3 sm:-mx-5 lg:mx-0 px-3 sm:px-5 lg:px-0 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Gerenciar Produtos
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos…"
                className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
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
              onClick={() => {
                setEditing(null);
                setIsDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-gray-100">
              {products.map((p) => (
                <article key={p.id} className="p-3 sm:p-4 space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={getMainImage(p)}
                      srcSet={`${getMainImage(p)} 64w, ${getMainImage(p)} 128w, ${getMainImage(p)} 256w`}
                      sizes="(max-width: 640px) 64px, 96px"
                      loading="lazy"
                      alt={p.descricao}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {p.descricao}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 break-words">
                        {(p.marca as any)?.nome ?? "Sem marca"}
                      </p>
                      <p className="text-lg font-extrabold text-indigo-700 mt-1">
                        {p.valorunitariocomercial.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Estoque: {p.quantidademinima}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            p.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p);
                        setIsDialogOpen(true);
                      }}
                      className="h-11 px-4 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors"
                      aria-label={`Editar ${p.descricao}`}
                    >
                      Editar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Departamento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                      Subdepartamento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">
                      Marca
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Preço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                      Estoque
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => {
                    const shouldOpenUp = actionMenuOpenUpId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getMainImage(p)}
                              srcSet={`${getMainImage(p)} 64w, ${getMainImage(p)} 128w, ${getMainImage(p)} 256w`}
                              sizes="40px"
                              loading="lazy"
                              alt={p.descricao}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                {p.descricao}
                              </p>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {p.infadicional}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {(p.departamento as any)?.descricao ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                          {(p.subdepartamento as any)?.nome ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden xl:table-cell">
                          {(p.marca as any)?.nome ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {p.valorunitariocomercial.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                          {p.quantidademinima}
                        </td>
                        <td className="px-4 py-3 min-w-[150px]">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ${p.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {p.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleCatalog(p)}
                              className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${p.exibircatalogo ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                              title="Clique para alternar visibilidade no catálogo"
                            >
                              {p.exibircatalogo ? "No catálogo" : "Oculto"}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className="relative inline-block text-left"
                            data-action-menu
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                const buttonRect =
                                  event.currentTarget.getBoundingClientRect();
                                const estimatedMenuHeight = 96;
                                const openUp =
                                  window.innerHeight - buttonRect.bottom <
                                  estimatedMenuHeight;

                                setOpenActionMenuId((prev) => {
                                  if (prev === p.id) {
                                    setActionMenuOpenUpId(null);
                                    return null;
                                  }
                                  setActionMenuOpenUpId(openUp ? p.id : null);
                                  return p.id;
                                });
                              }}
                              className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Ações"
                            >
                              <Settings className="h-4 w-4" />
                            </button>

                            {openActionMenuId === p.id && (
                              <div
                                className={`absolute right-0 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden animate-fadeIn ${
                                  shouldOpenUp
                                    ? "bottom-full mb-2 origin-bottom-right"
                                    : "top-full mt-2 origin-top-right"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setActionMenuOpenUpId(null);
                                    setEditing(p);
                                    setIsDialogOpen(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setActionMenuOpenUpId(null);
                                    setDeletingProduct(p);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => load(currentPage - 1, debouncedSearch)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => load(currentPage + 1, debouncedSearch)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      )}

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar Produto" : "Novo Produto"}
        maxWidth="max-w-5xl"
        mobileFullscreen
      >
        <ProductForm
          initial={editing ?? undefined}
          departments={departments}
          brands={brands}
          loading={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={Boolean(deletingProduct)}
        title="Excluir produto"
        description={
          deletingProduct
            ? `Tem certeza que deseja excluir "${deletingProduct.descricao}"?`
            : ""
        }
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default ProductManager;
