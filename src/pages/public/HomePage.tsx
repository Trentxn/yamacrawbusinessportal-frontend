import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  HardHat,
  Quote,
} from 'lucide-react'
import { categoriesApi } from '@/api/categories'
import { businessesApi } from '@/api/businesses'
import client from '@/api/client'
import type { Category } from '@/api/types'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { useAuth } from '@/contexts/AuthContext'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const categoryFadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const categoryStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

// --- Carousel ---

function Carousel({ children }: { children: React.ReactNode[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const total = children.length

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollRef.current
      if (!el) return
      const cardWidth = el.offsetWidth / 3 // desktop shows 3
      // On mobile, scrollsnap handles 1 card width
      const isMobile = window.innerWidth < 640
      const step = isMobile ? el.offsetWidth : cardWidth
      el.scrollTo({ left: index * step, behavior: 'smooth' })
    },
    [],
  )

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const isMobile = window.innerWidth < 640
    const step = isMobile ? el.offsetWidth : el.offsetWidth / 3
    const idx = Math.round(el.scrollLeft / step)
    setCurrent(idx)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (isPaused || total === 0) return
    const maxIdx = Math.max(0, total - (window.innerWidth < 640 ? 1 : 3))
    const interval = setInterval(() => {
      setCurrent((prev) => {
        const next = prev >= maxIdx ? 0 : prev + 1
        scrollTo(next)
        return next
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [isPaused, total, scrollTo])

  const maxIdx = Math.max(0, total - (typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 3))
  const dotCount = maxIdx + 1

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="w-full shrink-0 snap-start sm:w-[calc((100%-3rem)/3)]"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {total > 3 && (
        <>
          <button
            onClick={() => {
              const next = Math.max(0, current - 1)
              setCurrent(next)
              scrollTo(next)
            }}
            disabled={current === 0}
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover disabled:opacity-30 lg:flex"
          >
            <ChevronLeft className="h-5 w-5 text-surface-600" />
          </button>
          <button
            onClick={() => {
              const next = Math.min(maxIdx, current + 1)
              setCurrent(next)
              scrollTo(next)
            }}
            disabled={current >= maxIdx}
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover disabled:opacity-30 lg:flex"
          >
            <ChevronRight className="h-5 w-5 text-surface-600" />
          </button>
        </>
      )}

      {/* Dots */}
      {dotCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i)
                scrollTo(i)
              }}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? 'w-6 bg-primary-600'
                  : 'w-2 bg-surface-300 hover:bg-surface-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HeroBackground() {
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      // Delay rendering particles until after the first paint to avoid stutter
      requestAnimationFrame(() => {
        setReady(true)
        // Fade in after particles have had a frame to initialize
        requestAnimationFrame(() => setVisible(true))
      })
    })
  }, [])

  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: 'transparent' },
      fpsLimit: 60,
      particles: {
        number: {
          value: 60,
          density: { enable: true, width: 1200, height: 800 },
        },
        color: {
          value: ['#D4A843', '#E8C86A', '#60A5FA', '#93C5FD', '#ffffff'],
        },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.4, max: 0.9 },
          animation: {
            enable: true,
            speed: 0.8,
            startValue: 'random' as const,
            sync: false,
          },
        },
        size: {
          value: { min: 1.5, max: 4 },
          animation: {
            enable: true,
            speed: 2,
            startValue: 'random' as const,
            sync: false,
          },
        },
        links: {
          enable: true,
          distance: 160,
          color: { value: '#D4A843' },
          opacity: 0.35,
          width: 1.2,
          triangles: {
            enable: false,
          },
        },
        move: {
          enable: true,
          speed: { min: 0.4, max: 1.2 },
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: { default: 'bounce' as const },
          attract: { enable: true, rotate: { x: 800, y: 1200 } },
        },
      },
      interactivity: {
        detectsOn: 'window' as const,
        events: {
          onHover: {
            enable: true,
            mode: 'grab' as const,
          },
          onClick: {
            enable: false,
            mode: 'push' as const,
          },
        },
        modes: {
          grab: {
            distance: 200,
            links: { opacity: 0.6, color: '#60A5FA' },
          },
          push: { quantity: 3 },
        },
      },
      detectRetina: true,
    }),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0A1628] via-primary-800 to-[#0D1F3C]">
      {/* Subtle radial glow behind particles */}
      <div
        className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(96,165,250,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(212,168,67,0.25) 0%, transparent 50%)',
        }}
      />

      {/* Particle network */}
      <div className="pointer-events-auto absolute inset-0">
        {ready && (
          <Particles
            id="hero-particles"
            options={particlesOptions}
            className={`absolute inset-0 transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'transparent' }}
          />
        )}
      </div>

      {/* Top-edge fade for smoothness */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0A1628] to-transparent" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,22,40,0.6)_100%)]" />
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()

  const listYourBusinessDest = isAuthenticated && (user?.role === 'business_owner' || user?.role === 'contractor')
    ? '/dashboard/listings/new'
    : '/register'

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  })

  const { data: featuredData } = useQuery({
    queryKey: ['businesses', 'featured'],
    queryFn: () =>
      businessesApi
        .list({ featured: true, listingType: 'business', pageSize: 6 })
        .then((r) => r.data),
  })

  const { data: featuredContractors } = useQuery({
    queryKey: ['businesses', 'featured-contractors'],
    queryFn: () =>
      businessesApi
        .list({ featured: true, listingType: 'contractor', pageSize: 6 })
        .then((r) => r.data),
  })

  const { data: testimonials } = useQuery({
    queryKey: ['portal-feedback', 'featured'],
    queryFn: () =>
      client.get<{ id: string; rating: number; comment: string; userName: string | null; createdAt: string }[]>('/portal-feedback/featured').then((r) => r.data),
  })

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A1628]">
        <HeroBackground />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.h1
                variants={fadeUp}
                className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
                style={{ willChange: 'opacity' }}
              >
                Discover Yamacraw's
                <br />
                <span className="isolate inline-block">
                  <span
                    className="bg-gradient-to-r from-white via-accent-200 to-accent-400 bg-clip-text text-transparent"
                    style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Local Businesses
                  </span>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-primary-200/90"
              >
                Connecting residents with the businesses, contractors, and
                service providers that make our community thrive. Find what
                you need, support local.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  to="/directory"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary-800 shadow-elevated transition-all hover:bg-surface-50 hover:shadow-card-hover"
                >
                  Browse Directory
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to={listYourBusinessDest}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
                >
                  List Your Business
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path
              d="M0 60V20C240 0 480 0 720 20C960 40 1200 40 1440 20V60H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            Find businesses, contractors, and services across the Yamacraw
            community.
          </p>
        </div>

        {categories ? (
          <motion.div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={categoryStagger}
          >
            {categories.map((cat: Category) => {
              const Icon = getCategoryIcon(cat.icon)
              return (
                <motion.div key={cat.id} variants={categoryFadeUp}>
                  <Link
                    to={`/directory/${cat.slug}`}
                    className="group flex flex-col items-center gap-3 rounded-xl border border-surface-200 bg-white p-5 shadow-card transition-all hover:border-primary-200 hover:shadow-card-hover h-full"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-100 text-accent-600 transition-colors group-hover:bg-accent-400 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <span className="block text-sm font-semibold text-surface-800">
                        {cat.name}
                      </span>
                      {cat.businessCount !== undefined && (
                        <span className="mt-0.5 block text-xs text-surface-400">
                          {cat.businessCount}{' '}
                          {cat.businessCount === 1 ? 'listing' : 'listings'}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse flex-col items-center gap-3 rounded-xl border border-surface-200 bg-white p-5"
              >
                <div className="h-12 w-12 rounded-lg bg-surface-200" />
                <div className="h-4 w-16 rounded bg-surface-200" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Businesses */}
      <section className="bg-surface-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
          >
            <motion.div
              variants={fadeUp}
              className="mb-12 flex items-end justify-between"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
                  Featured Businesses
                </h2>
                <p className="mt-3 text-surface-500">
                  Highlighted establishments serving the Yamacraw community.
                </p>
              </div>
              <Link
                to="/directory"
                className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {featuredData?.items && featuredData.items.length > 0 && (
              <motion.div variants={fadeUp}>
                <Carousel>
                  {featuredData.items.map((biz) => (
                    <Link
                      key={biz.id}
                      to={`/business/${biz.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover"
                    >
                      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                        {biz.logoUrl ? (
                          <img
                            src={biz.logoUrl}
                            alt={biz.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-primary-300">
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
                        <div className="mb-2 flex items-center gap-2">
                          {biz.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                              <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                              Featured
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
                  ))}
                </Carousel>
              </motion.div>
            )}

            {!featuredData && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-xl border border-surface-200 bg-white"
                  >
                    <div className="h-40 bg-surface-200" />
                    <div className="space-y-3 p-5">
                      <div className="h-4 w-20 rounded bg-surface-200" />
                      <div className="h-5 w-40 rounded bg-surface-200" />
                      <div className="h-3 w-full rounded bg-surface-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/directory"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
              >
                View all businesses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Contractors */}
      {featuredContractors === undefined || featuredContractors.items.length > 0 ? (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              variants={stagger}
            >
              <motion.div
                variants={fadeUp}
                className="mb-12 flex items-end justify-between"
              >
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
                    Featured Contractors
                  </h2>
                  <p className="mt-3 text-surface-500">
                    Skilled professionals and government contractors serving the Yamacraw community.
                  </p>
                </div>
                <Link
                  to="/directory?type=contractor"
                  className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>

              {featuredContractors?.items && featuredContractors.items.length > 0 && (
                <motion.div variants={fadeUp}>
                  <Carousel>
                    {featuredContractors.items.map((biz) => (
                      <Link
                        key={biz.id}
                        to={`/business/${biz.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card transition-all hover:shadow-card-hover"
                      >
                        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                          {biz.logoUrl ? (
                            <img
                              src={biz.logoUrl}
                              alt={biz.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl font-bold text-teal-300">
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
                          <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                              <HardHat className="h-3 w-3" />
                              Contractor
                            </span>
                            {biz.isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                                <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                                Featured
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
                    ))}
                  </Carousel>
                </motion.div>
              )}

              {!featuredContractors && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse overflow-hidden rounded-xl border border-surface-200 bg-white"
                    >
                      <div className="h-40 bg-surface-200" />
                      <div className="space-y-3 p-5">
                        <div className="h-4 w-20 rounded bg-surface-200" />
                        <div className="h-5 w-40 rounded bg-surface-200" />
                        <div className="h-3 w-full rounded bg-surface-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 text-center sm:hidden">
                <Link
                  to="/directory?type=contractor"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
                >
                  View all contractors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* About Snippet */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            Strengthening Our Community
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-surface-500">
            The Yamacraw Business Portal gives local businesses and contractors
            the visibility they deserve, making it easier for residents to find
            and reach out to trusted service providers in their neighbourhood.
            Not sure who to call for a particular service? This portal keeps
            everyone connected.
          </p>
          <p className="mt-4 text-sm text-surface-400">
            Sponsored by the Office of Minister Zane Enrico Lightbourne
          </p>
          <div className="mt-8">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              Learn more about the initiative
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Community Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="bg-surface-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
                  What Our Community Says
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-surface-500">
                  Hear from residents and business owners using the portal.
                </p>
              </motion.div>

              <motion.div
                variants={stagger}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {testimonials.slice(0, 6).map((t) => (
                  <motion.div
                    key={t.id}
                    variants={fadeUp}
                    className="relative flex flex-col rounded-xl border border-surface-200 bg-white p-6 shadow-card"
                  >
                    <Quote className="absolute right-4 top-4 h-8 w-8 text-primary-100" />
                    <div className="mb-3 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= t.rating
                              ? 'fill-accent-500 text-accent-500'
                              : 'text-surface-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-surface-600">
                      "{t.comment}"
                    </p>
                    <div className="mt-4 flex items-center gap-2 border-t border-surface-100 pt-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                        {t.userName ? t.userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
                      </div>
                      <span className="text-sm font-medium text-surface-700">
                        {t.userName || 'Anonymous'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-800" />
        <div
          className="pointer-events-none absolute -top-1/2 left-1/4 h-[150%] w-[60%] rounded-full opacity-[0.08] blur-[80px]"
          style={{
            background: 'radial-gradient(ellipse, #D4A843 0%, transparent 70%)',
            animation: 'heroBlob2 18s ease-in-out infinite',
          }}
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={fadeUp}
          className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to grow your business?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-200">
            Join the Yamacraw Business Portal today. Whether you're a business
            or a contractor, create your listing, reach new customers, and
            become part of a thriving local directory.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-400 px-7 py-3.5 text-sm font-bold text-primary-900 shadow-elevated transition-all hover:bg-accent-300"
            >
              Register Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/directory"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
            >
              Browse Directory
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
