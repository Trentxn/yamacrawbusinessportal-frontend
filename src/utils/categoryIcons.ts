import {
  Building2,
  Utensils,
  ShoppingBag,
  Wrench,
  Heart,
  Landmark,
  Briefcase,
  Truck,
  GraduationCap,
  Palette,
  Car,
  Home,
  Sparkles,
  Hammer,
  SprayCan,
  Zap,
  Trees,
  Monitor,
  Stethoscope,
  Camera,
  PawPrint,
  Music,
  DollarSign,
  ShoppingCart,
  BookOpen,
  Phone,
  Scissors,
  Dumbbell,
  Plane,
  Baby,
  Church,
  Scale,
  type LucideIcon,
} from 'lucide-react'

/**
 * Map of icon name strings (stored in DB) to Lucide icon components.
 * When adding a new category in the admin panel, pick a key from this map.
 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  building2: Building2,
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  wrench: Wrench,
  heart: Heart,
  landmark: Landmark,
  briefcase: Briefcase,
  truck: Truck,
  'graduation-cap': GraduationCap,
  palette: Palette,
  car: Car,
  home: Home,
  sparkles: Sparkles,
  hammer: Hammer,
  'spray-can': SprayCan,
  zap: Zap,
  trees: Trees,
  monitor: Monitor,
  stethoscope: Stethoscope,
  camera: Camera,
  'paw-print': PawPrint,
  music: Music,
  'dollar-sign': DollarSign,
  'shopping-cart': ShoppingCart,
  'book-open': BookOpen,
  phone: Phone,
  scissors: Scissors,
  dumbbell: Dumbbell,
  plane: Plane,
  baby: Baby,
  church: Church,
  scale: Scale,
}

/** All available icon options for the category admin dropdown */
export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP).map((key) => ({
  value: key,
  label: key
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' '),
}))

/** Get a Lucide icon component for a category icon name, with Building2 as fallback */
export function getCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (icon && CATEGORY_ICON_MAP[icon]) return CATEGORY_ICON_MAP[icon]
  return Building2
}
