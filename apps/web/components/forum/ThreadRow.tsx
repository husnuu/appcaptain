'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ForumThread } from '@/types/content'

const CAT_COLOR: Record<string, string> = {
  blue: 'blue', coral: 'coral', green: 'green',
  purple: 'purple', orange: 'orange', teal: 'teal',
}

function AuthorBadge({ badge }: { badge: string | null }) {
  if (!badge) return null
  if (badge === 'Doğrulanmış Kaptan') return <span className="forum-author-badge captain">Kaptan</span>
  if (badge === 'Deniz Kurdu') return <span className="forum-author-badge expert">Uzman</span>
  if (badge === 'Koy Avcısı') return <span className="forum-author-badge hunter">Koy rehberi</span>
  return null
}

export default function ThreadRow({ thread }: { thread: ForumThread }) {
  const badgeClass = CAT_COLOR[thread.categoryColor] ?? 'blue'

  return (
    <Link
      href={`/forum/thread/${thread.id}`}
      className={`forum-thread-row${thread.isPinned ? ' pinned' : ''}`}
    >
      {/* Author avatar */}
      <div className="forum-thread-avatar">
        <Image
          src={thread.author.avatar}
          alt={thread.author.name}
          fill sizes="44px"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Main content */}
      <div className="forum-thread-main">
        <div className="forum-thread-header">
          <span className={`forum-thread-cat-badge ${badgeClass}`}>{thread.categoryLabel}</span>
          {thread.isPinned && <span className="forum-pin-badge">Sabit</span>}
          {thread.isHot && <span className="forum-hot-badge">Popüler</span>}
        </div>
        <h3 className="forum-thread-title">{thread.title}</h3>
        <p className="forum-thread-excerpt">{thread.excerpt}</p>
        <div className="forum-thread-tags">
          {thread.tags.map(tag => (
            <span key={tag} className="forum-tag">#{tag}</span>
          ))}
        </div>
        <div className="forum-thread-foot">
          <span className="forum-thread-foot-item">
            <span className="forum-thread-author-name">{thread.author.name}</span>
            <AuthorBadge badge={thread.author.badge} />
          </span>
          <span className="forum-thread-foot-item">{thread.author.location}</span>
          <span className="forum-thread-foot-item forum-thread-foot-item--muted">{thread.createdAt}</span>
        </div>
      </div>

      {/* Stats columns */}
      <div className="forum-thread-stats">
        <div className="forum-stats-col">
          <span className="forum-stats-col-val">{thread.replyCount}</span>
          <span className="forum-stats-col-label">Yanıt</span>
        </div>
        <div className="forum-stats-col">
          <span className="forum-stats-col-val">
            {thread.viewCount >= 1000
              ? `${(thread.viewCount / 1000).toFixed(1)}k`
              : thread.viewCount}
          </span>
          <span className="forum-stats-col-label">Görüntülenme</span>
        </div>
        <div className="forum-stats-col">
          <span className="forum-stats-col-val">{thread.likeCount}</span>
          <span className="forum-stats-col-label">Beğeni</span>
        </div>
      </div>

      {/* Last reply — stopPropagation so clicking here doesn't count as navigating */}
      <div
        className="forum-last-reply"
        onClick={e => e.preventDefault()}
      >
        <div className="forum-last-reply-avatar">
          <Image
            src={thread.lastReply.avatar}
            alt={thread.lastReply.author}
            fill sizes="28px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="forum-last-reply-inner">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)' }}>
            {thread.lastReply.author}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ash-gray)' }}>
            {thread.lastReply.date}
          </span>
        </div>
      </div>
    </Link>
  )
}
