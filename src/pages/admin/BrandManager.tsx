import React, { useCallback, useEffect, useState } from "react";
import {
  BadgePercent,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Dialog from "../../components/Dialog";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import Toast from "../../components/Toast";
import {
  createMarca,
  deleteMarca,
  fetchMarcas,
  updateMarca,
} from "../../lib/supabase";
import type { Marca } from "../../types";

interface FormProps {
  initial?: Partial<Marca>;
  loading: boolean;
  onSubmit: (data: { nome: string }) => void;
  onCancel: () => void;
}

const BrandForm: React.FC<FormProps> = ({
  initial,
  loading,
  onSubmit,
  onCancel,
}) => {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) {
          setError("Informe o nome da marca.");
          return;
        }
        setError("");
        onSubmit({ nome });
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
            if (error) setError("");
          }}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Nome da marca"
          autoFocus
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
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

const BrandManager: React.FC = () => {
  const [brands, setBrands] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Marca | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { marcas } = await fetchMarcas(1, 300, debouncedSearch);
      setBrands(marcas);
    } catch {
      setToast({ msg: "Erro ao carregar marcas.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: { nome: string }) => {
    setSaving(true);
    try {
      if (editing) {
        await updateMarca(editing.id, data.nome);
        setToast({ msg: "Marca atualizada!", type: "success" });
      } else {
        await createMarca(data.nome);
        setToast({ msg: "Marca criada!", type: "success" });
      }
      setIsDialogOpen(false);
      setEditing(null);
      await load();
    } catch {
      setToast({ msg: "Erro ao salvar marca.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    setIsDeleting(true);
    setLoading(true);
    try {
      await deleteMarca(deletingBrand.id);
      setToast({ msg: "Marca excluída!", type: "success" });
      setDeletingBrand(null);
      await load();
    } catch {
      setToast({ msg: "Erro ao excluir marca.", type: "error" });
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
            <BadgePercent className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Gerenciar Marcas</h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar marcas..."
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
        ) : brands.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">
            Nenhuma marca encontrada.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Marca
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {item.nome}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(item);
                          setIsDialogOpen(true);
                        }}
                        className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBrand(item)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
        title={editing ? "Editar Marca" : "Nova Marca"}
      >
        <BrandForm
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
        isOpen={Boolean(deletingBrand)}
        title="Excluir marca"
        description={
          deletingBrand
            ? `Tem certeza que deseja excluir "${deletingBrand.nome}"?`
            : ""
        }
        onClose={() => setDeletingBrand(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default BrandManager;
