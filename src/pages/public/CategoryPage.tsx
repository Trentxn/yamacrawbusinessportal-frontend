import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
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

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPage = Number(searchParams.get('page') || '1')
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
    if (!('page' in updates)) {
      next.delete('page')
    }
    setSearchParams(next, { replace: true })
  }

  const listingTypeParam: ListingType | undefined =
    activeListingType === 'all' ? undefined : activeListingType

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['categories', slug],
    queryFn: () => categoriesApi.getBySlug(slug!).then((r) => r.data),
    enabled: !!slug,
  })

  const { data, isLoading: businessesLoading } = useQuery({
    queryKey: ['businesses', 'category', slug, activeListingType, currentPage],
    queryFn: () =>
      businessesApi
        .list({
          category: slug,
          listingType: listingTypeParam,
          page: currentPage,
          pageSize: PAGE_SIZE,
        })
        .then((r) => r.data),
    enabled: !!slug,
  })

  const isLoading = categoryLoading || businessesLoading
  const businesses = data?.items ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <Link
                to="/directory"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
              </Link>
            </motion.div>

            {categoryLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-9 w-48 rounded bg-surface-200" />
                <div className="h-5 w-72 rounded bg-surface-200" />
              </div>
            ) : (
              <>
                <motion.h1
                  variants={fadeUp}
                  className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl"
                >
                  {category?.name ?? slug}
                </motion.h1>
                {category?.description && (
                  <motion.p variants={fadeUp} className="mt-2 max-w-2xl text-surface-500">
                    {category.description}
                  </motion.p>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Listing type toggle */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
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
        {!isLoading && businesses.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {businesses.map((biz) => (
              <motion.div key={biz.id} variants={fadeUp}>
                <Link
                  to={`/business/${biz.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover"
                >
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
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
                    {biz.shortDescription && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-surface-500">
                        {biz.shortDescription}
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
        {!isLoading && businesses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }}
            className="flex flex-col items-center justify-center rounded-xl border border-surface-200 bg-surface-50 py-16"
          >
            <FolderOpen className="mb-3 h-10 w-10 text-surface-300" />
            <p className="text-lg font-semibold text-surface-700">
              No businesses in this category yet
            </p>
            <p className="mt-1 text-sm text-surface-400">
              Check back later or browse other categories.
            </p>
            <Link
              to="/directory"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse all businesses
            </Link>
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
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
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
