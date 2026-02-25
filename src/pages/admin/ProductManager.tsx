import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, X, Package, Loader2, Search,
  ImagePlus, Star, StarOff, Upload, CheckCircle
} from 'lucide-react'
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
} from '../../lib/supabase'
import Toast from '../../components/Toast'
import Dialog from '../../components/Dialog'
import type { Produto, Departamento, ImagemProduto } from '../../types'

// ─── Product Form ──────────────────────────────────────────────────────────────
interface ProductFormProps {
  initial?: Partial<Produto>
  departments: Departamento[]
  loading: boolean
  onSubmit: (d: Partial<Produto>, newImages: File[], removedImageIds: string[]) => void
  onCancel: () => void
}

const ProductForm: React.FC<ProductFormProps> = ({
  initial, departments, loading, onSubmit, onCancel,
}) => {
  const [descricao, setDescricao] = useState(initial?.descricao ?? '')
  const [infadicional, setInfoadicional] = useState(initial?.infadicional ?? '')
  const [preco, setPreco] = useState(initial?.valorunitariocomercial?.toString() ?? '')
  const [estoque, setEstoque] = useState(initial?.quantidademinima?.toString() ?? '')
  const [destaque, setDestaque] = useState(initial?.destaque ?? false)
  const [ativo, setAtivo] = useState(initial?.ativo ?? true)
  const [exibircatalogo, setExibircatalogo] = useState(initial?.exibircatalogo ?? true)
  const [departamentoId, setDepartamentoId] = useState(initial?.departamento_id ?? '')
  const [existingImages, setExistingImages] = useState<ImagemProduto[]>(initial?.imagens ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setNewFiles((prev) => [...prev, ...files])
    const previews = files.map((f) => URL.createObjectURL(f))
    setNewPreviews((prev) => [...prev, ...previews])
  }

  const removeNewFile = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeExistingImage = (img: ImagemProduto) => {
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id))
    setRemovedIds((prev) => [...prev, img.id])
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(
          {
            descricao,
            infadicional,
            valorunitariocomercial: parseFloat(preco) || 0,
            quantidademinima: parseInt(estoque) || 0,
            destaque,
            ativo,
            exibircatalogo,
            departamento_id: departamentoId || undefined,
          },
          newFiles,
          removedIds,
        )
      }}
      className="space-y-4"
    >
      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Produto *</label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Nome do produto"
          required
          autoFocus
        />
      </div>

      {/* Informação adicional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <textarea
          value={infadicional}
          onChange={(e) => setInfoadicional(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          placeholder="Detalhes, características…"
          rows={3}
        />
      </div>

      {/* Preço e Estoque */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$) *</label>
          <input
            type="number"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="0,00"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Estoque</label>
          <input
            type="number"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      {/* Departamento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Departamento</label>
        <select
          value={departamentoId}
          onChange={(e) => setDepartamentoId(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
        >
          <option value="">— Sem departamento —</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.descricao}
            </option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Destaque', value: destaque, set: setDestaque },
          { label: 'Ativo', value: ativo, set: setAtivo },
          { label: 'No catálogo', value: exibircatalogo, set: setExibircatalogo },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => set((v: boolean) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Upload de imagens */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Imagens</label>

        {/* Imagens existentes */}
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt=""
                  className={`w-20 h-20 object-cover rounded-xl border-2 ${
                    img.isimagemdestaque ? 'border-indigo-500' : 'border-gray-200'
                  }`}
                />
                {img.isimagemdestaque && (
                  <Star className="absolute top-1 left-1 h-3 w-3 text-yellow-400 fill-yellow-400" />
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
        )}

        {/* Novas imagens */}
        {newPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {newPreviews.map((url, i) => (
              <div key={i} className="relative group">
                <img
                  src={url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl border-2 border-dashed border-indigo-300"
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
        )}

        {/* Botão de upload */}
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

      {/* Botões */}
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
    </form>
  )
}

// ─── Manager ───────────────────────────────────────────────────────────────────
const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Produto[]>([])
  const [departments, setDepartments] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const LIMIT = 10

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  const load = useCallback(async (page: number, search: string) => {
    setLoading(true)
    setError(null)
    try {
      const { produtos, totalPages: tp } = await fetchTodosProdutos(page, LIMIT, search)
      setProducts(produtos)
      setTotalPages(tp)
      setCurrentPage(page)
    } catch (e: any) {
      setError('Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllDepartamentos().then(setDepartments).catch(() => {})
  }, [])

  useEffect(() => {
    load(1, debouncedSearch)
  }, [debouncedSearch, load])

  const handleSave = async (
    data: Partial<Produto>,
    newFiles: File[],
    removedImageIds: string[],
  ) => {
    setSaving(true)
    try {
      let produtoId: string

      if (editing) {
        await updateProduto(editing.id, data)
        produtoId = editing.id
        setToast({ msg: 'Produto atualizado!', type: 'success' })
      } else {
        const novo = await createProduto(data as any)
        produtoId = novo.id
        setToast({ msg: 'Produto criado!', type: 'success' })
      }

      // Upload novas imagens
      for (const file of newFiles) {
        const url = await uploadImagemProduto(file, produtoId)
        await addImagemProduto(produtoId, url, false)
      }

      // Remover imagens marcadas para exclusão
      for (const imgId of removedImageIds) {
        await deleteImagemProduto(imgId)
        // Tentar deletar do storage se possível
        const img = editing?.imagens?.find((i) => i.id === imgId)
        if (img?.url) await deleteImagemStorage(img.url).catch(() => {})
      }

      // Define destaque automático se for nova imagem e não tiver destaque
      if (newFiles.length > 0 && !editing?.imagens?.length) {
        // Busca o produto atualizado para pegar o id da nova imagem
        const { produtos } = await fetchTodosProdutos(1, 1, '')
        // A lógica de destaque é gerenciada via painel
      }

      setIsDialogOpen(false)
      setEditing(null)
      await load(currentPage, debouncedSearch)
    } catch (e: any) {
      setToast({ msg: `Erro: ${e.message ?? 'Falha ao salvar'}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Produto) => {
    if (!window.confirm(`Excluir "${p.descricao}"?`)) return
    setLoading(true)
    try {
      // Deleta imagens do storage
      for (const img of p.imagens ?? []) {
        await deleteImagemStorage(img.url).catch(() => {})
      }
      await deleteProduto(p.id)
      setToast({ msg: 'Produto excluído!', type: 'success' })
      await load(currentPage, debouncedSearch)
    } catch (e: any) {
      setToast({ msg: 'Erro ao excluir produto.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCatalog = async (p: Produto) => {
    try {
      await updateProduto(p.id, { exibircatalogo: !p.exibircatalogo })
      setToast({
        msg: p.exibircatalogo ? 'Produto ocultado do catálogo.' : 'Produto visível no catálogo.',
        type: 'success',
      })
      await load(currentPage, debouncedSearch)
    } catch {
      setToast({ msg: 'Erro ao atualizar visibilidade.', type: 'error' })
    }
  }

  const getMainImage = (p: Produto) => {
    const imgs = p.imagens ?? []
    return (
      imgs.find((i) => i.isimagemdestaque)?.url ??
      imgs[0]?.url ??
      'https://cdn.pixabay.com/photo/2019/04/16/10/35/box-4131401_1280.png'
    )
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Package className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Gerenciar Produtos</h1>
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
                onClick={() => setSearchTerm('')}
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
            onClick={() => { setEditing(null); setIsDialogOpen(true) }}
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

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Departamento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Preço</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    {/* Produto */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getMainImage(p)}
                          alt={p.descricao}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{p.descricao}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{p.infadicional}</p>
                        </div>
                      </div>
                    </td>
                    {/* Departamento */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(p.departamento as any)?.descricao ?? '—'}
                    </td>
                    {/* Preço */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {p.valorunitariocomercial.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    {/* Estoque */}
                    <td className="px-4 py-3 text-sm text-gray-600">{p.quantidademinima}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleCatalog(p)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${p.exibircatalogo ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          title="Clique para alternar visibilidade no catálogo"
                        >
                          {p.exibircatalogo ? 'No catálogo' : 'Oculto'}
                        </button>
                      </div>
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => { setEditing(p); setIsDialogOpen(true) }}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
          </div>
        )}
      </div>

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => load(currentPage - 1, debouncedSearch)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-medium bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
          <button
            onClick={() => load(currentPage + 1, debouncedSearch)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium bg-white text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {/* Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditing(null) }}
        title={editing ? 'Editar Produto' : 'Novo Produto'}
        maxWidth="max-w-2xl"
      >
        <ProductForm
          initial={editing ?? undefined}
          departments={departments}
          loading={saving}
          onSubmit={handleSave}
          onCancel={() => { setIsDialogOpen(false); setEditing(null) }}
        />
      </Dialog>
    </div>
  )
}

export default ProductManager
