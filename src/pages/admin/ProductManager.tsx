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
} from "lucide-react";
import {
  fetchTodosProdutos,
  fetchAllDepartamentos,
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
import type { Produto, Departamento, ImagemProduto } from "../../types";

interface ProductFormProps {
  initial?: Partial<Produto>;
  departments: Departamento[];
  loading: boolean;
  onSubmit: (
    d: Partial<Produto>,
    newImages: File[],
    removedImageIds: string[],
  ) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initial,
  departments,
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
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isDepartmentModalClosing, setIsDepartmentModalClosing] =
    useState(false);
  const departmentModalTimerRef = useRef<number | null>(null);
  const [existingImages, setExistingImages] = useState<ImagemProduto[]>(
    initial?.imagens ?? [],
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    descricao?: string;
    preco?: string;
    estoque?: string;
  }>({});

  const validateRequiredFields = () => {
    const nextErrors: { descricao?: string; preco?: string; estoque?: string } =
      {};

    if (!descricao.trim())
      nextErrors.descricao = "Nome do produto é obrigatório.";

    const parsedPrice = parsePriceToNumber(preco);

    if (!preco.trim()) {
      nextErrors.preco = "Preço é obrigatório.";
    } else if (Number.isNaN(parsedPrice)) {
      nextErrors.preco = "Informe um preço válido.";
    }

    if (!estoque.trim()) {
      nextErrors.estoque = "Estoque é obrigatório.";
    } else if (Number.isNaN(Number(estoque))) {
      nextErrors.estoque = "Informe um estoque válido.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
  const filteredDepartments = departments.filter((d) =>
    d.descricao.toLowerCase().includes(departmentSearch.toLowerCase()),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateRequiredFields()) return;
        onSubmit(
          {
            descricao,
            infadicional,
            valorunitariocomercial: parsePriceToNumber(preco) || 0,
            quantidademinima: parseInt(estoque) || 0,
            destaque,
            ativo,
            exibircatalogo,
            departamento_id: departamentoId || undefined,
          },
          newFiles,
          removedIds,
        );
      }}
      className="space-y-4"
    >
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
          <p className="mt-1 text-xs text-red-600">{fieldErrors.descricao}</p>
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

      <div className="grid grid-cols-2 gap-4">
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
            Estoque *
          </label>
          <input
            type="number"
            value={estoque}
            onChange={(e) => {
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
          />
          {fieldErrors.estoque && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.estoque}</p>
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
            className={selectedDepartment ? "text-gray-900" : "text-gray-500"}
          >
            {selectedDepartment?.descricao ?? "Selecionar departamento"}
          </span>
          <Search className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
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

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

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
    fetchAllDepartamentos()
      .then(setDepartments)
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
        setToast({ msg: "Produto atualizado!", type: "success" });
      } else {
        const novo = await createProduto(data as any);
        produtoId = novo.id;
        setToast({ msg: "Produto criado!", type: "success" });
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
      setToast({
        msg: `Erro: ${e.message ?? "Falha ao salvar"}`,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Produto) => {
    if (!window.confirm(`Excluir "${p.descricao}"?`)) return;
    setLoading(true);
    try {
      for (const img of p.imagens ?? []) {
        await deleteImagemStorage(img.url).catch(() => {});
      }
      await deleteProduto(p.id);
      setToast({ msg: "Produto excluído!", type: "success" });
      await load(currentPage, debouncedSearch);
    } catch (e: any) {
      setToast({ msg: "Erro ao excluir produto.", type: "error" });
    } finally {
      setLoading(false);
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

      {/* Header */}
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Departamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {p.valorunitariocomercial.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
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
                                  handleDelete(p);
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
        maxWidth="max-w-2xl"
      >
        <ProductForm
          initial={editing ?? undefined}
          departments={departments}
          loading={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditing(null);
          }}
        />
      </Dialog>
    </div>
  );
};

export default ProductManager;
