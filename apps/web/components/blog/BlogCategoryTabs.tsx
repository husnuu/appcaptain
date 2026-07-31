'use client'

import { useState } from 'react'
import type { BlogCategory } from '@/types/content'

export default function BlogCategoryTabs({ categories }: { categories: BlogCategory[] }) {
  const [active, setActive] = useState('all')

  return (
    <div className="blog-cat-tabs" role="tablist" aria-label="Blog kategorileri">
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`blog-cat-tab${active === cat.id ? ' active' : ''}`}
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => setActive(cat.id)}
        >
          {cat.label}
          <span style={{ marginLeft: 5, fontSize: 12, fontWeight: 500, opacity: 0.65 }}>
            ({cat.count})
          </span>
        </button>
      ))}
    </div>
  )
}
