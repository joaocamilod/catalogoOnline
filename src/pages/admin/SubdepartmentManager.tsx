import React, { useCallback, useEffect, useState } from "react";
import {
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import Dialog from "../../components/Dialog";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import { notifyAdmin } from "../../components/AdminGlobalNotifier";
import Toast from "../../components/Toast";
import {
  createSubdepartamento,
  deleteSubdepartamento,
  fetchAllDepartamentos,
  fetchSubdepartamentos,
  updateSubdepartamento,
} from "../../lib/supabase";
import type { Departamento, Subdepartamento } from "../../types";

interface FormProps {
  departments: Departamento[];
  initial?: Partial<Subdepartamento>;
  loading: boolean;
  onSubmit: (data: { nome: string; departamento_ids: string[] }) => void;
  onCancel: () => void;
}

const SubdepartmentForm: React.FC<FormProps> = ({
  departments,
  initial,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [departamentoIds, setDepartamentoIds] = useState<string[]>(
    initial?.departamento_ids ?? [],
  );
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    departamento_ids?: string;
  }>({});

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const nextErrors: { nome?: string; departamento_ids?: string } = {};

        if (!nome.trim()) {
          nextErrors.nome = "Nome é obrigatório.";
        }
        if (departamentoIds.length === 0) {
          nextErrors.departamento_ids = "Selecione ao menos um departamento.";
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          return;
        }

        setFieldErrors({});
        onSubmit({ nome, departamento_ids: departamentoIds });
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nome *
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
          placeholder="Nome do subdepartamento"
          autoFocus
        />
        {fieldErrors.nome && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.nome}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Departamentos *
        </label>
        <div
          className={`max-h-44 overflow-y-auto border rounded-xl p-2 space-y-1.5 ${
            fieldErrors.departamento_ids ? "border-red-500" : "border-gray-300"
          }`}
        >
          {departments.map((dep) => (
            <label
              key={dep.id}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={departamentoIds.includes(dep.id)}
                onChange={() => {
                  setDepartamentoIds((prev) =>
                    prev.includes(dep.id)
                      ? prev.filter((id) => id !== dep.id)
                      : [...prev, dep.id],
                  );
                  if (fieldErrors.departamento_ids) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      departamento_ids: undefined,
                    }));
                  }
                }}
              />
              <span className="text-sm text-gray-700">{dep.descricao}</span>
            </label>
          ))}
        </div>
        {fieldErrors.departamento_ids && (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.departamento_ids}
          </p>
        )}
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

const SubdepartmentManager: React.FC = () => {
  const [subdepartments, setSubdepartments] = useState<Subdepartamento[]>([]);
  const [departments, setDepartments] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subdepartamento | null>(null);
  const [deletingSubdepartment, setDeletingSubdepartment] =
    useState<Subdepartamento | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [actionMenuOpenUpId, setActionMenuOpenUpId] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const formatDepartments = useCallback(
    (item: Subdepartamento) => {
      if (item.departamentos && item.departamentos.length > 0) {
        return item.departamentos.map((dep) => dep.descricao).join(", ");
      }
      const fallback = (item.departamento_ids ?? [])
        .map((depId) => departments.find((d) => d.id === depId)?.descricao)
        .filter(Boolean);
      return fallback.length > 0 ? fallback.join(", ") : "—";
    },
    [departments],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ subdepartamentos }, deps] = await Promise.all([
        fetchSubdepartamentos(1, 300, debouncedSearch),
        fetchAllDepartamentos(),
      ]);
      setSubdepartments(subdepartamentos);
      setDepartments(deps);
    } catch {
      setToast({ msg: "Erro ao carregar subdepartamentos.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

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
    departamento_ids: string[];
  }) => {
    setSaving(true);
    try {
      if (editing) {
        await updateSubdepartamento(
          editing.id,
          data.nome,
          data.departamento_ids,
        );
        notifyAdmin({ message: "Subdepartamento atualizado com sucesso." });
      } else {
        await createSubdepartamento(data.nome, data.departamento_ids);
        notifyAdmin({ message: "Subdepartamento criado com sucesso." });
      }
      setIsDialogOpen(false);
      setEditing(null);
      await load();
    } catch {
      notifyAdmin({
        message: "Erro ao salvar subdepartamento.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSubdepartment) return;
    setIsDeleting(true);
    setLoading(true);
    try {
      await deleteSubdepartamento(deletingSubdepartment.id);
      setToast({ msg: "Subdepartamento excluído!", type: "success" });
      setDeletingSubdepartment(null);
      await load();
    } catch {
      setToast({ msg: "Erro ao excluir subdepartamento.", type: "error" });
    } finally {
      setLoading(false);
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
            <GitBranch className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Gerenciar Subdepartamentos
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar subdepartamentos..."
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
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : subdepartments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">
            Nenhum subdepartamento encontrado.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Departamentos
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subdepartments.map((item) => {
                const shouldOpenUp = actionMenuOpenUpId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {item.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDepartments(item)}
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
                            const estimatedMenuHeight = 96;
                            const openUp =
                              window.innerHeight - buttonRect.bottom <
                              estimatedMenuHeight;

                            setOpenActionMenuId((prev) => {
                              if (prev === item.id) {
                                setActionMenuOpenUpId(null);
                                return null;
                              }
                              setActionMenuOpenUpId(openUp ? item.id : null);
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
                                setActionMenuOpenUpId(null);
                                setDeletingSubdepartment(item);
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
        title={editing ? "Editar Subdepartamento" : "Novo Subdepartamento"}
      >
        <SubdepartmentForm
          departments={departments}
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
        isOpen={Boolean(deletingSubdepartment)}
        title="Excluir subdepartamento"
        description={
          deletingSubdepartment
            ? `Tem certeza que deseja excluir "${deletingSubdepartment.nome}"?`
            : ""
        }
        onClose={() => setDeletingSubdepartment(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default SubdepartmentManager;
