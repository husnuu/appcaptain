'use client'

import { useState } from 'react'

export default function ArticleShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="article-sidebar-card">
      <div className="article-sidebar-head">Paylaş</div>
      <div className="article-share">
        <button className="share-btn twitter" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`)}>
          𝕏 Twitter
        </button>
        <button className="share-btn facebook" onClick={() => window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)}>
          Facebook
        </button>
        <button className="share-btn copy" onClick={copy}>
          {copied ? '✓ Kopyalandı!' : '🔗 Linki Kopyala'}
        </button>
      </div>
    </div>
  )
}
