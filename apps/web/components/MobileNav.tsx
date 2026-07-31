'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/',        icon: '🔍', label: 'Keşfet'       },
  { href: '/saved',   icon: '🤍', label: 'Favoriler'     },
  { href: '/trips',   icon: '⛵', label: 'Rezervasyonlar'},
  { href: '/profile', icon: '👤', label: 'Giriş Yap'     },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Mobil navigasyon">
      <div className="mobile-nav-inner">
        {ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-btn${pathname === item.href ? ' active' : ''}`}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span className="mob-icon">{item.icon}</span>
            <span className="mob-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
