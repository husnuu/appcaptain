'use client'

import { useState } from 'react'

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'hot', label: 'Popüler' },
  { id: 'pinned', label: 'Sabitlenen' },
  { id: 'new', label: 'En yeni' },
  { id: 'unanswered', label: 'Yanıtsız' },
]

export default function ForumFilters() {
  const [active, setActive] = useState('all')

  return (
    <div className="forum-thread-filters" role="tablist" aria-label="Konu filtresi">
      {FILTERS.map(f => (
        <button
          key={f.id}
          className={`forum-filter-btn${active === f.id ? ' forum-filter-btn--active' : ''}`}
          role="tab"
          aria-selected={active === f.id}
          onClick={() => setActive(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
