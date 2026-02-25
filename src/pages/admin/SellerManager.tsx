import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Settings,
  X,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import {
  fetchVendedores,
  createVendedor,
  updateVendedor,
  deleteVendedor,
} from "../../lib/supabase";
import Toast from "../../components/Toast";
import Dialog from "../../components/Dialog";
import type { Vendedor } from "../../types";

interface SellerFormProps {
  initial?: Partial<Vendedor>;
  loading: boolean;
  onSubmit: (s: {
    nome: string;
    telefone_whatsapp: string;
    email: string;
    ativo: boolean;
  }) => void;
  onCancel: () => void;
}

const SellerForm: React.FC<SellerFormProps> = ({
  initial,
  loading,
  onSubmit,
  onCancel,
}) => {
  const formatPhoneInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState(
    formatPhoneInput(initial?.telefone_whatsapp ?? ""),
  );
  const [email, setEmail] = useState(initial?.email ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    telefone_whatsapp?: string;
  }>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const nextErrors: { nome?: string; telefone_whatsapp?: string } = {};

        if (!nome.trim()) {
          nextErrors.nome = "Nome do vendedor é obrigatório.";
        }

        if (!telefoneWhatsapp.trim()) {
          nextErrors.telefone_whatsapp = "Telefone/WhatsApp é obrigatório.";
        } else if (telefoneWhatsapp.replace(/\D/g, "").length < 10) {
          nextErrors.telefone_whatsapp = "Informe um telefone/WhatsApp válido.";
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          return;
        }

        setFieldErrors({});
        onSubmit({
          nome,
          telefone_whatsapp: telefoneWhatsapp,
          email,
          ativo,
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nome do vendedor *
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (fieldErrors.nome) {
              setFieldErrors((prev) => ({ ...prev, nome: undefined }));
            }
          }}
          className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
            fieldErrors.nome
              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          }`}
          placeholder="Nome completo"
          autoFocus
        />
        {fieldErrors.nome && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.nome}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          WhatsApp / Telefone
        </label>
        <input
          type="text"
          value={telefoneWhatsapp}
          onChange={(e) => {
            setTelefoneWhatsapp(formatPhoneInput(e.target.value));
            if (fieldErrors.telefone_whatsapp) {
              setFieldErrors((prev) => ({
                ...prev,
                telefone_whatsapp: undefined,
              }));
            }
          }}
          inputMode="numeric"
          maxLength={16}
          className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
            fieldErrors.telefone_whatsapp
              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          }`}
          placeholder="(11) 99999-9999"
        />
        {fieldErrors.telefone_whatsapp && (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.telefone_whatsapp}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="vendedor@email.com"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAtivo((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            ativo ? "bg-indigo-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
              ativo ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">
          {ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

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

const SellerManager: React.FC = () => {
  const [sellers, setSellers] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendedor | null>(null);

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
      let { vendedores, totalPages: tp } = await fetchVendedores(
        targetPage,
        LIMIT,
        search,
      );

      const normalizedTotalPages = Math.max(tp, 1);
      if (targetPage > normalizedTotalPages) {
        targetPage = normalizedTotalPages;
        const fallback = await fetchVendedores(targetPage, LIMIT, search);
        vendedores = fallback.vendedores;
        tp = fallback.totalPages;
      }

      setSellers(vendedores);
      setTotalPages(Math.max(tp, 1));
      setCurrentPage(targetPage);
    } catch {
      setError("Erro ao carregar vendedores.");
    } finally {
      setLoading(false);
    }
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

  const handleSave = async (data: {
    nome: string;
    telefone_whatsapp: string;
    email: string;
    ativo: boolean;
  }) => {
    setSaving(true);
    try {
      if (editing) {
        await updateVendedor(
          editing.id,
          data.nome,
          data.telefone_whatsapp,
          data.email,
          data.ativo,
        );
        setToast({ msg: "Vendedor atualizado!", type: "success" });
      } else {
        await createVendedor(
          data.nome,
          data.telefone_whatsapp,
          data.email,
          data.ativo,
        );
        setToast({ msg: "Vendedor criado!", type: "success" });
      }
      setIsDialogOpen(false);
      setEditing(null);
      await load(currentPage, debouncedSearch);
    } catch {
      setToast({ msg: "Erro ao salvar vendedor.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seller: Vendedor) => {
    if (
      !window.confirm(`Excluir "${seller.nome}"? A ação nao pode ser desfeita.`)
    )
      return;

    setLoading(true);
    try {
      await deleteVendedor(seller.id);
      setToast({ msg: "Vendedor excluido!", type: "success" });
      await load(currentPage, debouncedSearch);
    } catch {
      setToast({ msg: "Erro ao excluir vendedor.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setIsDialogOpen(true);
  };

  const openEdit = (seller: Vendedor) => {
    setEditing(seller);
    setIsDialogOpen(true);
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
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Gerenciar Vendedores
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar vendedores..."
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
            onClick={openCreate}
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
        {loading && sellers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum vendedor encontrado.</p>
            <button
              onClick={openCreate}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Cadastrar o primeiro vendedor →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    WhatsApp / Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sellers.map((seller) => {
                  const shouldOpenUp = actionMenuOpenUpId === seller.id;
                  return (
                    <tr
                      key={seller.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {seller.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {seller.telefone_whatsapp || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {seller.email || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            seller.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {seller.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
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
                                if (prev === seller.id) {
                                  setActionMenuOpenUpId(null);
                                  return null;
                                }
                                setActionMenuOpenUpId(
                                  openUp ? seller.id : null,
                                );
                                return seller.id;
                              });
                            }}
                            className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ações"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          {openActionMenuId === seller.id && (
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
                                  openEdit(seller);
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
                                  handleDelete(seller);
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
        title={editing ? "Editar Vendedor" : "Novo Vendedor"}
      >
        <SellerForm
          initial={editing ?? undefined}
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

export default SellerManager;
