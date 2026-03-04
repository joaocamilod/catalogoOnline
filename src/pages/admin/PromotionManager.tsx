import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Dialog from "../../components/Dialog";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import Toast from "../../components/Toast";
import { notifyAdmin } from "../../components/AdminGlobalNotifier";
import {
  createPromocaoProduto,
  deletePromocaoProduto,
  fetchPromocoesProduto,
  fetchTodosProdutos,
  updatePromocaoProduto,
} from "../../lib/supabase";
import type {
  Produto,
  PromocaoProduto,
  TipoDescontoPromocao,
} from "../../types";

interface PromotionFormProps {
  initial?: Partial<PromocaoProduto>;
  produtos: Produto[];
  loading: boolean;
  onSubmit: (
    data: Omit<PromocaoProduto, "id" | "created_at" | "updated_at">,
  ) => void;
  onCancel: () => void;
}

const TIPO_DESCONTO_LABEL: Record<TipoDescontoPromocao, string> = {
  percentual: "Percentual (%)",
  valor_fixo: "Valor fixo (R$)",
  preco_fixo: "Preço final fixo (R$)",
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);

const formatCurrencyInputBRL = (rawValue: string) => {
  const digits = rawValue.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  const cents = Number.parseInt(digits, 10);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

const parseCurrencyInputBRL = (formattedValue: string) => {
  if (!formattedValue.trim()) return NaN;
  const normalized = formattedValue.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(normalized);
};

const toLocalDatetimeInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoOrNull = (value: string) => {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const PromotionForm: React.FC<PromotionFormProps> = ({
  initial,
  produtos,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [produtoId, setProdutoId] = useState(initial?.produto_id ?? "");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [tipoDesconto, setTipoDesconto] = useState<TipoDescontoPromocao>(
    initial?.tipo_desconto ?? "percentual",
  );
  const [valorDesconto, setValorDesconto] = useState(
    initial?.valor_desconto !== undefined && initial?.valor_desconto !== null
      ? String(initial.valor_desconto)
      : "",
  );
  const [quantidadeMinima, setQuantidadeMinima] = useState(
    (initial?.quantidade_minima ?? 1).toString(),
  );
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [dataInicio, setDataInicio] = useState(
    toLocalDatetimeInputValue(initial?.data_inicio),
  );
  const [dataFim, setDataFim] = useState(
    toLocalDatetimeInputValue(initial?.data_fim),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const parsedCurrent =
      tipoDesconto === "percentual"
        ? Number.parseFloat(valorDesconto.replace(",", "."))
        : parseCurrencyInputBRL(valorDesconto);

    if (!Number.isFinite(parsedCurrent)) {
      if (tipoDesconto !== "percentual") {
        setValorDesconto("");
      }
      return;
    }

    if (tipoDesconto === "percentual") {
      setValorDesconto(String(parsedCurrent).replace(".", ","));
      return;
    }

    setValorDesconto(
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parsedCurrent),
    );
  }, [tipoDesconto]);

  const selectedProduto = useMemo(
    () => produtos.find((p) => p.id === produtoId) ?? null,
    [produtos, produtoId],
  );

  const previewBasePrice = Number(selectedProduto?.valorunitariocomercial ?? 0);
  const previewFinalPrice = useMemo(() => {
    if (!Number.isFinite(previewBasePrice) || previewBasePrice <= 0)
      return null;
    const value =
      tipoDesconto === "percentual"
        ? Number.parseFloat(valorDesconto.replace(",", "."))
        : parseCurrencyInputBRL(valorDesconto);
    if (!Number.isFinite(value) || value < 0) return null;
    if (tipoDesconto === "percentual") {
      return Math.max(0, previewBasePrice * (1 - Math.min(100, value) / 100));
    }
    if (tipoDesconto === "valor_fixo") {
      return Math.max(0, previewBasePrice - value);
    }
    return Math.max(0, value);
  }, [previewBasePrice, tipoDesconto, valorDesconto]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};

        const parsedValor =
          tipoDesconto === "percentual"
            ? Number.parseFloat(valorDesconto.replace(",", "."))
            : parseCurrencyInputBRL(valorDesconto);
        const parsedQtdMinima = Number.parseInt(quantidadeMinima, 10);
        const isoInicio = toIsoOrNull(dataInicio);
        const isoFim = toIsoOrNull(dataFim);

        if (!produtoId) nextErrors.produto_id = "Selecione um produto.";
        if (!nome.trim()) nextErrors.nome = "Nome da promoção é obrigatório.";
        if (!valorDesconto.trim()) {
          nextErrors.valor_desconto = "Valor é obrigatório.";
        }
        if (!Number.isFinite(parsedValor) || parsedValor < 0) {
          nextErrors.valor_desconto = "Informe um valor de desconto válido.";
        }
        if (tipoDesconto === "percentual" && parsedValor > 100) {
          nextErrors.valor_desconto =
            "Desconto percentual deve estar entre 0 e 100.";
        }
        if (!Number.isFinite(parsedQtdMinima) || parsedQtdMinima < 1) {
          nextErrors.quantidade_minima =
            "Quantidade mínima deve ser maior que zero.";
        }
        if (dataInicio && !isoInicio) {
          nextErrors.data_inicio = "Data de início inválida.";
        }
        if (dataFim && !isoFim) {
          nextErrors.data_fim = "Data de fim inválida.";
        }
        if (isoInicio && isoFim && new Date(isoFim) < new Date(isoInicio)) {
          nextErrors.data_fim =
            "Data fim deve ser maior ou igual à data início.";
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          return;
        }

        setFieldErrors({});
        onSubmit({
          produto_id: produtoId,
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo_desconto: tipoDesconto,
          valor_desconto: parsedValor,
          quantidade_minima: parsedQtdMinima,
          ativo,
          data_inicio: isoInicio,
          data_fim: isoFim,
        });
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Produto *
        </label>
        <select
          value={produtoId}
          onChange={(e) => {
            setProdutoId(e.target.value);
            if (fieldErrors.produto_id) {
              setFieldErrors((prev) => ({ ...prev, produto_id: "" }));
            }
          }}
          className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
            fieldErrors.produto_id
              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          }`}
        >
          <option value="">Selecione...</option>
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.descricao}
            </option>
          ))}
        </select>
        {fieldErrors.produto_id && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.produto_id}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nome da promoção *
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (fieldErrors.nome)
              setFieldErrors((prev) => ({ ...prev, nome: "" }));
          }}
          placeholder="Ex.: Leve 3 e pague menos"
          className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
            fieldErrors.nome
              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          }`}
        />
        {fieldErrors.nome && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.nome}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Descrição
        </label>
        <textarea
          rows={2}
          value={descricao ?? ""}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Texto opcional para destacar regra da promoção"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl transition-all focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de desconto *
          </label>
          <select
            value={tipoDesconto}
            onChange={(e) =>
              setTipoDesconto(e.target.value as TipoDescontoPromocao)
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="percentual">{TIPO_DESCONTO_LABEL.percentual}</option>
            <option value="valor_fixo">{TIPO_DESCONTO_LABEL.valor_fixo}</option>
            <option value="preco_fixo">{TIPO_DESCONTO_LABEL.preco_fixo}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Valor *
          </label>
          <input
            type="text"
            inputMode={tipoDesconto === "percentual" ? "decimal" : "numeric"}
            required
            value={valorDesconto}
            onChange={(e) => {
              if (tipoDesconto === "percentual") {
                const nextValue = e.target.value.replace(/[^\d.,]/g, "");
                setValorDesconto(nextValue);
              } else {
                setValorDesconto(formatCurrencyInputBRL(e.target.value));
              }
              if (fieldErrors.valor_desconto) {
                setFieldErrors((prev) => ({ ...prev, valor_desconto: "" }));
              }
            }}
            placeholder={tipoDesconto === "percentual" ? "0 a 100" : "0,00"}
            className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
              fieldErrors.valor_desconto
                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            }`}
          />
          {fieldErrors.valor_desconto && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.valor_desconto}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Quantidade mínima *
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={quantidadeMinima}
            onChange={(e) => {
              setQuantidadeMinima(e.target.value);
              if (fieldErrors.quantidade_minima) {
                setFieldErrors((prev) => ({ ...prev, quantidade_minima: "" }));
              }
            }}
            className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
              fieldErrors.quantidade_minima
                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            }`}
          />
          {fieldErrors.quantidade_minima && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.quantidade_minima}
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 pt-8">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Promoção ativa
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Data início
          </label>
          <input
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              if (fieldErrors.data_inicio) {
                setFieldErrors((prev) => ({ ...prev, data_inicio: "" }));
              }
            }}
            className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
              fieldErrors.data_inicio
                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            }`}
          />
          {fieldErrors.data_inicio && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.data_inicio}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Data fim
          </label>
          <input
            type="datetime-local"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              if (fieldErrors.data_fim) {
                setFieldErrors((prev) => ({ ...prev, data_fim: "" }));
              }
            }}
            className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
              fieldErrors.data_fim
                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            }`}
          />
          {fieldErrors.data_fim && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.data_fim}</p>
          )}
        </div>
      </div>

      {selectedProduto && previewFinalPrice !== null && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5">
          <p className="text-xs text-indigo-800">
            Preço base: <strong>{formatBRL(previewBasePrice)}</strong> | com
            promoção: <strong>{formatBRL(previewFinalPrice)}</strong>
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            A regra será aplicada a partir de {quantidadeMinima || "1"}{" "}
            unidade(s).
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
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
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
};

const PromotionManager: React.FC = () => {
  const [promocoes, setPromocoes] = useState<
    Array<PromocaoProduto & { produto?: Produto | null }>
  >([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromocaoProduto | null>(null);
  const [deleting, setDeleting] = useState<PromocaoProduto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadProdutos = useCallback(async () => {
    const { produtos: data } = await fetchTodosProdutos(1, 1000, "");
    setProdutos(data);
  }, []);

  const loadPromocoes = useCallback(async () => {
    const data = await fetchPromocoesProduto();
    setPromocoes(data as Array<PromocaoProduto & { produto?: Produto | null }>);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadProdutos(), loadPromocoes()]);
    } catch {
      setToast({ msg: "Erro ao carregar promoções.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [loadProdutos, loadPromocoes]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openActionMenuId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) {
        setOpenActionMenuId(null);
        setActionMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionMenuId]);

  const filteredPromocoes = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return promocoes;
    return promocoes.filter((promo) => {
      const productName = (promo as any).produto?.descricao ?? "";
      return (
        promo.nome.toLowerCase().includes(q) ||
        (promo.descricao || "").toLowerCase().includes(q) ||
        productName.toLowerCase().includes(q)
      );
    });
  }, [promocoes, debouncedSearch]);

  const handleSave = async (
    data: Omit<PromocaoProduto, "id" | "created_at" | "updated_at">,
  ) => {
    setSaving(true);
    try {
      if (editing) {
        await updatePromocaoProduto(editing.id, data);
        notifyAdmin({ message: "Promoção atualizada com sucesso." });
      } else {
        await createPromocaoProduto(data);
        notifyAdmin({ message: "Promoção criada com sucesso." });
      }
      setIsDialogOpen(false);
      setEditing(null);
      await loadPromocoes();
    } catch {
      notifyAdmin({ message: "Erro ao salvar promoção.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deletePromocaoProduto(deleting.id);
      setToast({ msg: "Promoção excluída com sucesso.", type: "success" });
      setDeleting(null);
      await loadPromocoes();
    } catch {
      setToast({ msg: "Erro ao excluir promoção.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BadgePercent className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Gerenciar Promoções
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar promoções..."
              className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredPromocoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Tag className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              Nenhuma promoção encontrada.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setIsDialogOpen(true);
              }}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Criar a primeira promoção →
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Promoção
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Regra
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPromocoes.map((item) => {
                const produtoNome =
                  (item as any).produto?.descricao || "Produto";
                const valorLabel =
                  item.tipo_desconto === "percentual"
                    ? `${item.valor_desconto}%`
                    : formatBRL(item.valor_desconto);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.nome}
                      </p>
                      {item.descricao && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {item.descricao}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {produtoNome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p>{TIPO_DESCONTO_LABEL[item.tipo_desconto]}</p>
                      <p className="text-xs text-gray-500">
                        {valorLabel} | min. {item.quantidade_minima} un.
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${
                          item.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className="relative inline-block text-left"
                        data-action-menu
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            const buttonRect =
                              event.currentTarget.getBoundingClientRect();
                            const menuWidth = 144;
                            const horizontalPadding = 8;
                            const left = Math.min(
                              window.innerWidth - menuWidth - horizontalPadding,
                              Math.max(
                                horizontalPadding,
                                buttonRect.right - menuWidth,
                              ),
                            );
                            const top = buttonRect.bottom + 8;

                            setOpenActionMenuId((prev) => {
                              if (prev === item.id) {
                                setActionMenuPosition(null);
                                return null;
                              }
                              setActionMenuPosition({ top, left });
                              return item.id;
                            });
                          }}
                          className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ações"
                        >
                          <Settings className="h-4 w-4" />
                        </button>

                        {openActionMenuId === item.id && (
                          <div
                            className="fixed w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn origin-top-right"
                            style={
                              actionMenuPosition
                                ? {
                                    top: actionMenuPosition.top,
                                    left: actionMenuPosition.left,
                                  }
                                : undefined
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setActionMenuPosition(null);
                                setEditing(item);
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
                                setActionMenuPosition(null);
                                setDeleting(item);
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
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar Promoção" : "Nova Promoção"}
        mobileFullscreen
        closeOnOverlayClick={false}
      >
        <PromotionForm
          initial={editing ?? undefined}
          produtos={produtos}
          loading={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={Boolean(deleting)}
        title="Excluir promoção"
        description={
          deleting
            ? `Tem certeza que deseja excluir a promoção "${deleting.nome}"?`
            : ""
        }
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default PromotionManager;
