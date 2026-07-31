'use client'

import { useEffect, useState } from 'react'

interface TocItem { id: string; text: string; num: number }

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = items.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
    const onScroll = () => {
      const y = window.scrollY + 120
      let current: string | null = null
      for (const el of els) {
        if (el.offsetTop <= y) current = el.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="article-sidebar-card">
      <div className="article-sidebar-head">İçindekiler</div>
      <nav className="toc-list" aria-label="İçindekiler">
        {items.map(item => (
          <button
            key={item.id}
            className={`toc-item${active === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
            aria-current={active === item.id ? 'true' : undefined}
          >
            <span className="toc-num">{item.num}.</span>
            <span>{item.text}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
