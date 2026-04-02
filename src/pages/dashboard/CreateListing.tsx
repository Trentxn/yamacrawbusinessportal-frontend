import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { businessesApi } from '@/api/businesses'
import { categoriesApi } from '@/api/categories'
import { uploadsApi } from '@/api/uploads'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// --- Schema ---

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

const photoSchema = z.object({
  url: z.string(),
  caption: z.string().max(200).optional(),
})

const dayHoursSchema = z.object({
  isOpen: z.boolean(),
  open: z.string(),
  close: z.string(),
})

const listingSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Max 100 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  shortDescription: z.string().min(1, 'Short description is required').max(300, 'Max 300 characters'),
  description: z.string().min(1, 'Full description is required').max(5000, 'Max 5000 characters'),
  tags: z.array(z.string()).max(10, 'Max 10 tags'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  addressLine1: z.string().optional().or(z.literal('')),
  addressLine2: z.string().optional().or(z.literal('')),
  island: z.string(),
  settlement: z.string().optional().or(z.literal('')),
  operatingHours: z.record(z.string(), dayHoursSchema),
  facebook: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  tiktok: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  logoUrl: z.string().nullable().optional(),
  photos: z.array(photoSchema).max(10, 'Max 10 photos'),
})

type ListingFormData = z.infer<typeof listingSchema>

function buildDefaultHours(): Record<string, { isOpen: boolean; open: string; close: string }> {
  const hours: Record<string, { isOpen: boolean; open: string; close: string }> = {}
  for (const day of DAYS) {
    hours[day] = { isOpen: false, open: '09:00', close: '17:00' }
  }
  return hours
}

// --- Shared input classes ---
const inputClass =
  'rounded-lg border border-surface-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none w-full'
const labelClass = 'mb-1 block text-sm font-medium text-surface-700'
const errorClass = 'mt-1 text-sm text-red-600'
const sectionTitle = 'text-lg font-semibold text-surface-900 mb-4'

// --- Component ---

export default function CreateListing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isContractor = user?.role === 'contractor'
  const [tagInput, setTagInput] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.list()
      return res.data
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      shortDescription: '',
      description: '',
      tags: [],
      phone: '',
      email: user?.email || '',
      website: '',
      addressLine1: '',
      addressLine2: '',
      island: 'New Providence',
      settlement: 'Yamacraw',
      operatingHours: buildDefaultHours(),
      facebook: '',
      instagram: '',
      tiktok: '',
      whatsapp: '',
      logoUrl: null,
      photos: [],
    },
  })

  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray({
    control,
    name: 'photos',
  })

  const shortDesc = watch('shortDescription')
  const fullDesc = watch('description')
  const tags = watch('tags')
  const logoUrl = watch('logoUrl')
  const photos = watch('photos')

  // --- Tag handling ---
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = tagInput.trim()
      if (!value) return
      if (tags.length >= 10) return
      if (tags.includes(value)) return
      setValue('tags', [...tags, value])
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    setValue('tags', tags.filter((_, i) => i !== index))
  }

  // --- Logo upload ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Logo must be under 5MB.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'Logo must be JPEG, PNG, or WebP.')
      return
    }
    setLogoUploading(true)
    try {
      const res = await uploadsApi.uploadImage(file, 'logo')
      setValue('logoUrl', res.data.url)
    } catch {
      showToast('error', 'Failed to upload logo.')
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  // --- Photo upload ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const currentCount = getValues('photos').length
    const remaining = 10 - currentCount
    if (remaining <= 0) {
      showToast('error', 'Maximum 10 photos allowed.')
      return
    }
    const toUpload = Array.from(files).slice(0, remaining)
    setPhotoUploading(true)
    try {
      for (const file of toUpload) {
        if (file.size > 5 * 1024 * 1024) continue
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue
        const res = await uploadsApi.uploadImage(file, 'photo')
        appendPhoto({ url: res.data.url, caption: '' })
      }
    } catch {
      showToast('error', 'Failed to upload one or more photos.')
    } finally {
      setPhotoUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  // --- Build API payload ---
  const buildPayload = (data: ListingFormData) => {
    const operatingHours: Record<string, { open: string; close: string } | null> = {}
    for (const day of DAYS) {
      const h = data.operatingHours[day]
      operatingHours[day] = h.isOpen ? { open: h.open, close: h.close } : null
    }

    const socialLinks: Record<string, string> = {}
    if (data.facebook) socialLinks.facebook = data.facebook
    if (data.instagram) socialLinks.instagram = data.instagram
    if (data.tiktok) socialLinks.tiktok = data.tiktok
    if (data.whatsapp) socialLinks.whatsapp = data.whatsapp

    return {
      name: data.name,
      categoryId: data.categoryId,
      shortDescription: data.shortDescription,
      description: data.description,
      tags: data.tags,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      island: data.island,
      settlement: data.settlement || null,
      operatingHours: Object.keys(socialLinks).length > 0 || Object.values(operatingHours).some(Boolean)
        ? operatingHours
        : null,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      logoUrl: data.logoUrl || null,
    }
  }

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async ({ data, submitForReview }: { data: ListingFormData; submitForReview: boolean }) => {
      const payload = buildPayload(data)
      const res = await businessesApi.create(payload)
      const business = res.data

      // Upload photos as separate calls
      for (const photo of data.photos) {
        await businessesApi.addPhoto(business.id, {
          url: photo.url,
          caption: photo.caption || null,
        })
      }

      if (submitForReview) {
        await businessesApi.submitForReview(business.id)
      }

      return business
    },
    onSuccess: () => {
      navigate('/dashboard/listings')
    },
    onError: () => {
      showToast('error', 'Failed to create listing. Please try again.')
    },
  })

  const onSaveDraft = handleSubmit((data) => {
    createMutation.mutate({ data, submitForReview: false })
  })

  const onSaveAndSubmit = handleSubmit((data) => {
    createMutation.mutate({ data, submitForReview: true })
  })

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-elevated ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link
          to="/dashboard/listings"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
        <h1 className="text-2xl font-bold text-surface-900">{isContractor ? 'Add New Service' : 'Create New Listing'}</h1>
        <p className="mt-1 text-sm text-surface-500">
          Add your business to the Yamacraw directory.
        </p>
      </div>

      <div className="space-y-8">
        {/* Basic Info */}
        <section>
          <h2 className={sectionTitle}>Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Business Name *</label>
              <input id="name" type="text" className={inputClass} placeholder="e.g. Island Auto Repair" {...register('name')} />
              {errors.name && <p className={errorClass}>{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="categoryId" className={labelClass}>Category *</label>
              <select id="categoryId" className={inputClass} {...register('categoryId')} disabled={categoriesLoading}>
                <option value="">Select a category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className={errorClass}>{errors.categoryId.message}</p>}
            </div>

            <div>
              <label htmlFor="shortDescription" className={labelClass}>Short Description *</label>
              <input
                id="shortDescription"
                type="text"
                className={inputClass}
                placeholder="A brief tagline for your business"
                {...register('shortDescription')}
              />
              <div className="mt-1 flex justify-between">
                {errors.shortDescription ? (
                  <p className={errorClass}>{errors.shortDescription.message}</p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${(shortDesc?.length || 0) > 300 ? 'text-red-500' : 'text-surface-400'}`}>
                  {shortDesc?.length || 0}/300
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>Full Description *</label>
              <textarea
                id="description"
                rows={5}
                className={inputClass}
                placeholder="Describe what your business does, services offered, etc."
                {...register('description')}
              />
              <div className="mt-1 flex justify-between">
                {errors.description ? (
                  <p className={errorClass}>{errors.description.message}</p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${(fullDesc?.length || 0) > 5000 ? 'text-red-500' : 'text-surface-400'}`}>
                  {fullDesc?.length || 0}/5000
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tags */}
        <section>
          <h2 className={sectionTitle}>Tags</h2>
          <div>
            <label htmlFor="tagInput" className={labelClass}>
              Add tags (press Enter to add, max 10)
            </label>
            <input
              id="tagInput"
              type="text"
              className={inputClass}
              placeholder="e.g. plumbing"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              disabled={tags.length >= 10}
            />
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(i)} className="hover:text-primary-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Info */}
        <section>
          <h2 className={sectionTitle}>Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" type="tel" className={inputClass} placeholder="(242) 555-1234" {...register('phone')} />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" type="email" className={inputClass} placeholder="info@business.com" {...register('email')} />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="website" className={labelClass}>Website</label>
              <input id="website" type="url" className={inputClass} placeholder="https://www.example.com" {...register('website')} />
              {errors.website && <p className={errorClass}>{errors.website.message}</p>}
            </div>
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className={sectionTitle}>Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="addressLine1" className={labelClass}>Address Line 1</label>
              <input id="addressLine1" type="text" className={inputClass} placeholder="Street address" {...register('addressLine1')} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine2" className={labelClass}>Address Line 2</label>
              <input id="addressLine2" type="text" className={inputClass} placeholder="Suite, unit, etc." {...register('addressLine2')} />
            </div>
            <div>
              <label htmlFor="island" className={labelClass}>Island</label>
              <input id="island" type="text" className={inputClass} {...register('island')} />
            </div>
            <div>
              <label htmlFor="settlement" className={labelClass}>Settlement</label>
              <input id="settlement" type="text" className={inputClass} {...register('settlement')} />
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section>
          <h2 className={sectionTitle}>Operating Hours</h2>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <OperatingHoursRow key={day} day={day} control={control} register={register} watch={watch} />
            ))}
          </div>
        </section>

        {/* Social Links */}
        <section>
          <h2 className={sectionTitle}>Social Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="facebook" className={labelClass}>Facebook</label>
              <input id="facebook" type="text" className={inputClass} placeholder="https://facebook.com/..." {...register('facebook')} />
            </div>
            <div>
              <label htmlFor="instagram" className={labelClass}>Instagram</label>
              <input id="instagram" type="text" className={inputClass} placeholder="https://instagram.com/..." {...register('instagram')} />
            </div>
            <div>
              <label htmlFor="tiktok" className={labelClass}>TikTok</label>
              <input id="tiktok" type="text" className={inputClass} placeholder="https://tiktok.com/@..." {...register('tiktok')} />
            </div>
            <div>
              <label htmlFor="whatsapp" className={labelClass}>WhatsApp</label>
              <input id="whatsapp" type="text" className={inputClass} placeholder="+1 242 555 1234" {...register('whatsapp')} />
            </div>
          </div>
        </section>

        {/* Logo Upload */}
        <section>
          <h2 className={sectionTitle}>Logo</h2>
          <div>
            {logoUrl ? (
              <div className="relative inline-block">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-28 w-28 rounded-xl object-cover border border-surface-200"
                />
                <button
                  type="button"
                  onClick={() => setValue('logoUrl', null)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="flex h-28 w-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-300 text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                {logoUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Upload</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="mt-2 text-xs text-surface-400">JPEG, PNG, or WebP. Max 5MB.</p>
          </div>
        </section>

        {/* Photo Gallery */}
        <section>
          <h2 className={sectionTitle}>Photo Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photoFields.map((field, index) => (
              <div key={field.id} className="relative group">
                <img
                  src={photos[index]?.url}
                  alt={`Photo ${index + 1}`}
                  className="h-36 w-full rounded-lg object-cover border border-surface-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  className="mt-2 w-full rounded-md border border-surface-300 px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                  {...register(`photos.${index}.caption`)}
                />
              </div>
            ))}

            {photos.length < 10 && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="flex h-36 flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-300 text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                {photoUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add Photos</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <p className="mt-2 text-xs text-surface-400">
            Up to 10 photos. JPEG, PNG, or WebP. Max 5MB each.
          </p>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-6 border-t border-surface-200">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 border border-surface-300 text-surface-700 hover:bg-surface-50 font-medium py-2.5 px-5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={onSaveAndSubmit}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Submit for Review
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Sub-component: Operating Hours Row ---

function OperatingHoursRow({
  day,
  control: _control,
  register,
  watch,
}: {
  day: string
  control: any
  register: any
  watch: any
}) {
  const isOpen = watch(`operatingHours.${day}.isOpen`)

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white border border-surface-200 px-4 py-3">
      <label className="flex items-center gap-2 min-w-[120px]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
          {...register(`operatingHours.${day}.isOpen`)}
        />
        <span className="text-sm font-medium text-surface-700">{day}</span>
      </label>

      {isOpen ? (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="time"
            className="rounded-md border border-surface-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
            {...register(`operatingHours.${day}.open`)}
          />
          <span className="text-surface-400">to</span>
          <input
            type="time"
            className="rounded-md border border-surface-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
            {...register(`operatingHours.${day}.close`)}
          />
        </div>
      ) : (
        <span className="text-sm text-surface-400">Closed</span>
      )}
    </div>
  )
}
