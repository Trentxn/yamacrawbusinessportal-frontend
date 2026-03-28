import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Star, ChevronLeft, ChevronRight, Briefcase, Wrench } from 'lucide-react'
import { searchApi } from '@/api/search'
import { categoriesApi } from '@/api/categories'
import type { BusinessListItem } from '@/api/businesses'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

function ResultCard({ biz }: { biz: BusinessListItem }) {
  return (
    <motion.div variants={fadeUp}>
      <Link
        to={`/business/${biz.slug}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover"
      >
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
          {biz.logoUrl ? (
            <img src={biz.logoUrl} alt={biz.name} className="h-full w-full object-cover" />
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
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {biz.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700">
                <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                Featured
              </span>
            )}
            {biz.category && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                {biz.category}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-surface-900 group-hover:text-primary-600">
            {biz.name}
          </h3>
          {biz.shortDescription && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-surface-500">
              {biz.shortDescription}
            </p>
          )}
          <div className="mt-auto pt-3">
            <span className="text-sm font-semibold text-primary-600 transition-colors group-hover:text-primary-700">
              View Details &rarr;
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-surface-200 bg-white">
      <div className="h-36 bg-surface-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-16 rounded bg-surface-200" />
        <div className="h-5 w-32 rounded bg-surface-200" />
        <div className="h-3 w-full rounded bg-surface-200" />
      </div>
    </div>
  )
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category') || ''
  const listingTypeParam = searchParams.get('listing_type') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [localQuery, setLocalQuery] = useState(queryParam)

  useEffect(() => {
    setLocalQuery(queryParam)
  }, [queryParam])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['search', queryParam, categoryParam, listingTypeParam, pageParam],
    queryFn: () =>
      searchApi
        .search({
          q: queryParam,
          category: categoryParam || undefined,
          listing_type: listingTypeParam || undefined,
          page: pageParam,
          page_size: 12,
        })
        .then((r) => r.data),
    enabled: !!queryParam,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!localQuery.trim()) return
    setSearchParams((prev) => {
      prev.set('q', localQuery.trim())
      prev.delete('page')
      return prev
    })
  }

  function setFilter(key: string, value: string) {
    setSearchParams((prev) => {
      if (value) {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      prev.delete('page')
      return prev
    })
  }

  function goToPage(page: number) {
    setSearchParams((prev) => {
      prev.set('page', String(page))
      return prev
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="bg-white">
      {/* Search header */}
      <section className="border-b border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.form
            onSubmit={handleSearch}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search businesses, services, contractors..."
                className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-11 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Search
            </button>
          </motion.form>

          {/* Filters */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-4 flex flex-wrap gap-3"
          >
            <select
              value={categoryParam}
              onChange={(e) => setFilter('category', e.target.value)}
              className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg border border-surface-300 bg-white text-sm">
              {[
                { value: '', label: 'All', icon: null },
                { value: 'business', label: 'Businesses', icon: Briefcase },
                { value: 'contractor', label: 'Contractors', icon: Wrench },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter('listing_type', opt.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    listingTypeParam === opt.value
                      ? 'bg-primary-600 font-semibold text-white'
                      : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {opt.icon && <opt.icon className="h-3.5 w-3.5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {queryParam && !isLoading && data && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-sm text-surface-500"
          >
            <span className="font-semibold text-surface-800">{data.total}</span>{' '}
            {data.total === 1 ? 'result' : 'results'} for{' '}
            <span className="font-semibold text-surface-800">'{queryParam}'</span>
          </motion.p>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results grid */}
        {!isLoading && data && data.items.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.items.map((biz: BusinessListItem) => (
              <ResultCard key={biz.id} biz={biz} />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && queryParam && data && data.items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 text-center"
          >
            <Search className="mx-auto h-12 w-12 text-surface-300" />
            <h3 className="mt-4 text-lg font-semibold text-surface-800">
              No results found for '{queryParam}'
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-surface-500">
              Try different keywords or browse by category.
            </p>
            <Link
              to="/directory"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Browse Directory
            </Link>
          </motion.div>
        )}

        {/* No query state */}
        {!queryParam && (
          <div className="py-16 text-center">
            <Search className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-500">Enter a search term to find businesses.</p>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 flex items-center justify-center gap-2"
          >
            <button
              onClick={() => goToPage(pageParam - 1)}
              disabled={pageParam <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300 text-surface-600 transition-colors hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: data.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (data.totalPages <= 7) return true
                if (p === 1 || p === data.totalPages) return true
                return Math.abs(p - pageParam) <= 1
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
                  <span key={`e-${i}`} className="px-1 text-surface-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      item === pageParam
                        ? 'bg-primary-600 text-white'
                        : 'border border-surface-300 text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            <button
              onClick={() => goToPage(pageParam + 1)}
              disabled={pageParam >= data.totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-300 text-surface-600 transition-colors hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </section>
    </div>
  )
}
