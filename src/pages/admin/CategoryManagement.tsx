import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { Category } from '@/api/types'
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from '@/utils/categoryIcons'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

interface CategoryFormData {
  name: string
  description: string
  icon: string
  sortOrder: number
}

const emptyForm: CategoryFormData = { name: '', description: '', icon: '', sortOrder: 0 }

export default function CategoryManagement() {
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((r) => r.data),
  })

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      adminApi.createCategory({
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
        sortOrder: data.sortOrder,
      }),
    onSuccess: () => {
      invalidateCategories()
      setShowAddForm(false)
      setFormData(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      adminApi.updateCategory(id, {
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
        sortOrder: data.sortOrder,
      }),
    onSuccess: () => {
      invalidateCategories()
      setEditingId(null)
      setFormData(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      invalidateCategories()
      setDeleteConfirmId(null)
    },
  })

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setFormData({
      name: cat.name,
      description: cat.description ?? '',
      icon: cat.icon ?? '',
      sortOrder: cat.sortOrder,
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData(emptyForm)
  }

  const startAdd = () => {
    setShowAddForm(true)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    createMutation.mutate(formData)
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.name.trim()) return
    updateMutation.mutate({ id: editingId, data: formData })
  }

  const handleField = (field: keyof CategoryFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formFields = (
    onSubmit: (e: React.FormEvent) => void,
    isPending: boolean,
    submitLabel: string,
    onCancel: () => void,
  ) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_80px_auto] gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleField('name', e.target.value)}
          placeholder="Category name"
          required
          className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => handleField('description', e.target.value)}
          placeholder="Brief description"
          className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">Icon</label>
        <select
          value={formData.icon}
          onChange={(e) => handleField('icon', e.target.value)}
          className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
        >
          <option value="">Select an icon...</option>
          {CATEGORY_ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">Order</label>
        <input
          type="number"
          value={formData.sortOrder}
          onChange={(e) => handleField('sortOrder', parseInt(e.target.value, 10) || 0)}
          className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending || !formData.name.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-500 hover:bg-surface-50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  )

  return (
    <motion.div
      className="max-w-5xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-1">Category Management</h1>
          <p className="text-surface-500">Create, edit, and organize business categories.</p>
        </div>
        {!showAddForm && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}
      </motion.div>

      {/* Add form */}
      {showAddForm && (
        <motion.div
          variants={fadeIn}
          className="rounded-xl border border-primary-200 bg-primary-50/40 shadow-card p-5 mb-6"
        >
          <h3 className="text-sm font-semibold text-surface-700 mb-3">New Category</h3>
          {createMutation.isError && (
            <p className="text-sm text-red-600 mb-3">Failed to create category. Please try again.</p>
          )}
          {formFields(handleSubmitAdd, createMutation.isPending, 'Create', () => setShowAddForm(false))}
        </motion.div>
      )}

      {/* Table */}
      <motion.div variants={fadeIn}>
        {isLoading ? (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card divide-y divide-surface-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 flex gap-4">
                <div className="h-4 w-32 rounded bg-surface-100 animate-pulse" />
                <div className="h-4 w-24 rounded bg-surface-100 animate-pulse" />
                <div className="h-4 w-16 rounded bg-surface-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card p-6 sm:p-12 text-center">
            <FolderOpen className="h-12 w-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No categories yet</p>
            <p className="text-sm text-surface-400 mt-1">
              Create your first category to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px_80px_80px_80px_120px] gap-4 px-5 py-3 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              <span>Name</span>
              <span>Slug</span>
              <span>Icon</span>
              <span>Order</span>
              <span>Listings</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-surface-100">
              {categories.map((cat) => (
                <div key={cat.id}>
                  {editingId === cat.id ? (
                    <div className="p-4 bg-primary-50/30">
                      {updateMutation.isError && (
                        <p className="text-sm text-red-600 mb-3">Failed to update. Please try again.</p>
                      )}
                      {formFields(handleSubmitEdit, updateMutation.isPending, 'Save', cancelEdit)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_80px_80px_120px] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-surface-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-surface-400 truncate">{cat.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-surface-400 font-mono">{cat.slug}</span>
                      <span className="text-sm text-surface-500 flex items-center gap-1.5">
                        {(() => { const Ic = getCategoryIcon(cat.icon); return <Ic className="h-4 w-4" /> })()}
                        {cat.icon ?? '--'}
                      </span>
                      <span className="text-sm text-surface-500 tabular-nums">{cat.sortOrder}</span>
                      <span className="text-sm text-surface-500 tabular-nums">
                        {cat.businessCount ?? 0}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {deleteConfirmId === cat.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate(cat.id)}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="inline-flex items-center rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs text-surface-500 hover:bg-surface-50 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(cat.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {deleteMutation.isError && (
          <p className="text-sm text-red-600 mt-3">
            Failed to delete category. It may still have businesses assigned to it.
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
