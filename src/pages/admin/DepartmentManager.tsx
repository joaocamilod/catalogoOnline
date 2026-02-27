import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Settings,
  X,
  LayoutDashboard,
  Loader2,
  Search,
} from "lucide-react";
import {
  fetchDepartamentos,
  createDepartamento,
  updateDepartamento,
  deleteDepartamento,
} from "../../lib/supabase";
import Toast from "../../components/Toast";
import Dialog from "../../components/Dialog";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import { notifyAdmin } from "../../components/AdminGlobalNotifier";
import type { Departamento } from "../../types";
interface DepartmentFormProps {
  initial?: Partial<Departamento>;
  loading: boolean;
  onSubmit: (d: { descricao: string; ativo: boolean }) => void;
  onCancel: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  initial,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [descricaoError, setDescricaoError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!descricao.trim()) {
          setDescricaoError("Descrição é obrigatória.");
          return;
        }
        setDescricaoError("");
        onSubmit({ descricao, ativo });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Descrição *
        </label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => {
            setDescricao(e.target.value);
            if (descricaoError) setDescricaoError("");
          }}
          className={`w-full px-3 py-2.5 border rounded-xl transition-all ${
            descricaoError
              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          }`}
          placeholder="Nome do departamento"
          autoFocus
        />
        {descricaoError && (
          <p className="mt-1 text-xs text-red-600">{descricaoError}</p>
        )}
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
          {loading ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
};

const DepartmentManager: React.FC = () => {
  const [departments, setDepartments] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [deletingDepartment, setDeletingDepartment] =
    useState<Departamento | null>(null);
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
      let { departamentos, totalPages: tp } = await fetchDepartamentos(
        targetPage,
        LIMIT,
        search,
      );

      const normalizedTotalPages = Math.max(tp, 1);
      if (targetPage > normalizedTotalPages) {
        targetPage = normalizedTotalPages;
        const fallback = await fetchDepartamentos(targetPage, LIMIT, search);
        departamentos = fallback.departamentos;
        tp = fallback.totalPages;
      }

      setDepartments(departamentos);
      setTotalPages(Math.max(tp, 1));
      setCurrentPage(targetPage);
    } catch (e: any) {
      setError("Erro ao carregar departamentos.");
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

  const handleSave = async (data: { descricao: string; ativo: boolean }) => {
    setSaving(true);
    try {
      if (editing) {
        await updateDepartamento(editing.id, data.descricao, data.ativo);
        notifyAdmin({ message: "Departamento atualizado com sucesso." });
      } else {
        await createDepartamento(data.descricao, data.ativo);
        notifyAdmin({ message: "Departamento criado com sucesso." });
      }
      setIsDialogOpen(false);
      setEditing(null);
      await load(currentPage, debouncedSearch);
    } catch (e: any) {
      notifyAdmin({ message: "Erro ao salvar departamento.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;
    setIsDeleting(true);
    setLoading(true);
    try {
      await deleteDepartamento(deletingDepartment.id);
      setToast({ msg: "Departamento excluído!", type: "success" });
      setDeletingDepartment(null);
      await load(currentPage, debouncedSearch);
    } catch (e: any) {
      setToast({
        msg: "Erro ao excluir. Verifique se há produtos vinculados.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setIsDialogOpen(true);
  };

  const openEdit = (dep: Departamento) => {
    setEditing(dep);
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
            <LayoutDashboard className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Gerenciar Departamentos
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar departamentos…"
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
        {loading && departments.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LayoutDashboard className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              Nenhum departamento encontrado.
            </p>
            <button
              onClick={openCreate}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Criar o primeiro departamento →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {departments.map((dep) => {
                  const shouldOpenUp = actionMenuOpenUpId === dep.id;
                  return (
                    <tr
                      key={dep.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {dep.descricao}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            dep.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {dep.ativo ? "Ativo" : "Inativo"}
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
                                if (prev === dep.id) {
                                  setActionMenuOpenUpId(null);
                                  return null;
                                }
                                setActionMenuOpenUpId(openUp ? dep.id : null);
                                return dep.id;
                              });
                            }}
                            className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ações"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          {openActionMenuId === dep.id && (
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
                                  openEdit(dep);
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
                                  setDeletingDepartment(dep);
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
        title={editing ? "Editar Departamento" : "Novo Departamento"}
      >
        <DepartmentForm
          initial={editing ?? undefined}
          loading={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditing(null);
          }}
        />
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={Boolean(deletingDepartment)}
        title="Excluir departamento"
        description={
          deletingDepartment
            ? `Tem certeza que deseja excluir "${deletingDepartment.descricao}"?`
            : ""
        }
        onClose={() => setDeletingDepartment(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default DepartmentManager;
