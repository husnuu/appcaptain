'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarIcon, CaptainIcon, CompassIcon, SailboatIcon, UmbrellaIcon } from './MobileNavIcons'

const ITEMS = [
  { href: '/', Icon: CompassIcon, label: 'Keşfet' },
  { href: '/tekne-kiralama', Icon: SailboatIcon, label: 'Tekneler' },
  { href: '/deneyimler', Icon: UmbrellaIcon, label: 'Deneyimler' },
  { href: '/rezervasyonlarim', Icon: CalendarIcon, label: 'Rezervasyon' },
  { href: '/hesabim', Icon: CaptainIcon, label: 'Hesabım' },
]

export default function MobileNav() {
  const pathname = usePathname()
  // Ana sayfada alt menü yok; hero'daki sekmeler ana yönlendirmeyi üstleniyor.
  if (pathname === '/') return null
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href) || (href === '/tekne-kiralama' && pathname.startsWith('/listing'))

  return (
    <nav className="sh-mnav" aria-label="Mobil navigasyon">
      {ITEMS.map(({ href, Icon, label }) => {
        const active = isActive(href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : undefined}>
            <span className="sh-mnav-ico">
              <Icon size={30} />
            </span>
            <span className="sh-mnav-label">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
