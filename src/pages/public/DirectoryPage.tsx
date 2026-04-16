import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  Star,
  Building2,
  HardHat,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react'
import { businessesApi } from '@/api/businesses'
import { categoriesApi } from '@/api/categories'
import type { ListingType } from '@/api/types'

const PAGE_SIZE = 12

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

type ListingFilter = 'all' | 'business' | 'contractor'

function BusinessCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-surface-200 bg-white">
      <div className="h-36 bg-surface-100" />
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-surface-200" />
          <div className="h-5 w-20 rounded-full bg-surface-200" />
        </div>
        <div className="h-5 w-3/4 rounded bg-surface-200" />
        <div className="h-4 w-full rounded bg-surface-200" />
        <div className="h-4 w-2/3 rounded bg-surface-200" />
      </div>
    </div>
  )
}

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')

  const currentPage = Number(searchParams.get('page') || '1')
  const activeCategory = searchParams.get('category') || ''
  const activeListingType = (searchParams.get('type') || 'all') as ListingFilter

  function setFilter(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    // Reset page when filters change
    if (!('page' in updates)) {
      next.delete('page')
    }
    setSearchParams(next, { replace: true })
  }

  const listingTypeParam: ListingType | undefined =
    activeListingType === 'all' ? undefined : activeListingType

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', 'directory', activeCategory, activeListingType, currentPage],
    queryFn: () =>
      businessesApi
        .list({
          category: activeCategory || undefined,
          listingType: listingTypeParam,
          page: currentPage,
          pageSize: PAGE_SIZE,
        })
        .then((r) => r.data),
  })

  const businesses = data?.items ?? []
  const totalPages = data?.totalPages ?? 0

  // Local search filter
  const filtered = searchTerm
    ? businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : businesses

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.h1
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl"
            >
              Business Directory
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-2 text-surface-500">
              Browse all registered businesses and contractors in the Yamacraw community.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeUp} className="mt-6 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8 space-y-4"
        >
          {/* Listing type toggle */}
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <span className="mr-1 text-sm font-medium text-surface-600">Type:</span>
            {(['all', 'business', 'contractor'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter({ type })}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeListingType === type
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {type === 'business' && <Building2 className="h-3.5 w-3.5" />}
                {type === 'contractor' && <HardHat className="h-3.5 w-3.5" />}
                {type === 'all' ? 'All' : type === 'business' ? 'Businesses' : 'Contractors'}
              </button>
            ))}
          </motion.div>

          {/* Category pills */}
          {categories && categories.length > 0 && (
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-medium text-surface-600">Category:</span>
              <button
                onClick={() => setFilter({ category: '' })}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  !activeCategory
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter({ category: cat.slug })}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === cat.slug
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && filtered.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((biz) => (
              <motion.div key={biz.id} variants={fadeUp}>
                <Link
                  to={`/business/${biz.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover"
                >
                  <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                    {biz.logoUrl ? (
                      <img
                        src={biz.logoUrl}
                        alt={biz.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-300">
                        {biz.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                    {biz.isDemo && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow ring-1 ring-amber-600/30 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Demo
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {biz.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                          <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                          Featured
                        </span>
                      )}
                      {biz.listingType === 'contractor' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <HardHat className="h-3 w-3" />
                          Contractor
                        </span>
                      )}
                      {biz.category && (
                        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600">
                          {biz.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-600">
                      {biz.name}
                    </h3>
                    {biz.averageRating != null && biz.reviewCount > 0 && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= Math.round(biz.averageRating!)
                                  ? 'fill-accent-500 text-accent-500'
                                  : 'text-surface-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-surface-500">
                          {biz.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-surface-400">
                          ({biz.reviewCount})
                        </span>
                      </div>
                    )}
                    {biz.shortDescription && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-surface-500">
                        {biz.shortDescription}
                      </p>
                    )}
                    {biz.isDemo && (
                      <p className="mt-3 border-l-2 border-amber-300 bg-amber-50/60 pl-2 py-1 text-[11px] italic leading-snug text-amber-700">
                        Sample listing for demonstration purposes only — not a real business.
                      </p>
                    )}
                    <div className="mt-auto pt-4">
                      <span className="text-sm font-semibold text-primary-600 transition-colors group-hover:text-primary-700">
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }}
            className="flex flex-col items-center justify-center rounded-xl border border-surface-200 bg-surface-50 py-16"
          >
            <FolderOpen className="mb-3 h-10 w-10 text-surface-300" />
            <p className="text-lg font-semibold text-surface-700">No businesses found</p>
            <p className="mt-1 text-sm text-surface-400">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Try changing your filters or check back later.'}
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3, ease: 'easeOut' as const } }}
            className="mt-10 flex items-center justify-center gap-2"
          >
            <button
              disabled={currentPage <= 1}
              onClick={() => setFilter({ page: String(currentPage - 1) })}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and pages near current
                return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
              })
              .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) {
                  acc.push('ellipsis')
                }
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === 'ellipsis' ? (
                  <span key={`e-${i}`} className="px-2 text-surface-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setFilter({ page: String(item) })}
                    className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      currentPage === item
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setFilter({ page: String(currentPage + 1) })}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
