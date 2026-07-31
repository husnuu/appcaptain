import type { LucideIcon } from 'lucide-react'
import {
  Anchor,
  Map,
  Sparkles,
  ShipWheel,
  Wrench,
  MessageCircle,
} from 'lucide-react'

const BY_CATEGORY_ID: Record<string, LucideIcon> = {
  kiralama: Anchor,
  rotalar: Map,
  deneyimler: Sparkles,
  kaptan: ShipWheel,
  bakim: Wrench,
  genel: MessageCircle,
}

export default function CategoryIcon({
  categoryId,
  className,
}: {
  categoryId: string
  className?: string
}) {
  const Icon = BY_CATEGORY_ID[categoryId] ?? Anchor
  return <Icon className={className} size={22} strokeWidth={1.75} aria-hidden />
}
