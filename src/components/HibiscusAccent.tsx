interface HibiscusAccentProps {
  className?: string
  /** 0 – 360 degrees */
  rotate?: number
  /** Tailwind opacity utility, e.g. `opacity-[0.06]`. */
  opacity?: string
  /** Tailwind color utility for `currentColor`, e.g. `text-primary-900`. */
  color?: string
}

/**
 * Subtle navy hibiscus silhouette used as a decorative watermark behind
 * sections. Designed to be positioned with `absolute` + `pointer-events-none`
 * by its parent; content below controls size (w-/h-), position, and rotation.
 */
export default function HibiscusAccent({
  className = '',
  rotate = 0,
  opacity = 'opacity-[0.06]',
  color = 'text-primary-900',
}: HibiscusAccentProps) {
  return (
    <svg
      viewBox="-105 -105 210 210"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      className={`pointer-events-none select-none ${color} ${opacity} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* 5 petals radiating from origin */}
      <g>
        <path d="M 0 0 C -28 -18, -44 -50, 0 -82 C 44 -50, 28 -18, 0 0 Z" />
        <path
          d="M 0 0 C -28 -18, -44 -50, 0 -82 C 44 -50, 28 -18, 0 0 Z"
          transform="rotate(72)"
        />
        <path
          d="M 0 0 C -28 -18, -44 -50, 0 -82 C 44 -50, 28 -18, 0 0 Z"
          transform="rotate(144)"
        />
        <path
          d="M 0 0 C -28 -18, -44 -50, 0 -82 C 44 -50, 28 -18, 0 0 Z"
          transform="rotate(216)"
        />
        <path
          d="M 0 0 C -28 -18, -44 -50, 0 -82 C 44 -50, 28 -18, 0 0 Z"
          transform="rotate(288)"
        />
      </g>

      {/* Stamen curving out from center with a cluster of anthers */}
      <path
        d="M 0 0 Q 8 18, 18 38 Q 26 52, 36 60"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="14" cy="34" r="2.4" />
      <circle cx="22" cy="46" r="2.4" />
      <circle cx="30" cy="54" r="2.4" />
      <circle cx="38" cy="61" r="2.6" />
    </svg>
  )
}
