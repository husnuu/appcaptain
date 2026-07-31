import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, UsersRound } from 'lucide-react'
import CategoryIcon from '@/components/forum/CategoryIcon'
import ForumFilters from '@/components/forum/ForumFilters'
import LeaderboardRank from '@/components/forum/LeaderboardRank'
import ThreadRow from '@/components/forum/ThreadRow'
import { getForumCategories, getForumThreads } from '@/lib/forumData'

export const metadata: Metadata = {
  title: 'Forum — SeaHub Deniz Topluluğu',
  description: 'Rotalar, kiralama tavsiyeleri, kaptan önerileri ve daha fazlası. SeaHub denizci topluluğuna katılın.',
}

// ── Category color → CSS class map ──────────────────────────
const CAT_COLOR: Record<string, string> = {
  blue: 'blue', coral: 'coral', green: 'green',
  purple: 'purple', orange: 'orange', teal: 'teal',
}

// ── Page ─────────────────────────────────────────────────────
export default async function ForumPage() {
  const categories = getForumCategories()
  const threads    = getForumThreads()

  const onlineUsers = [
    { name: 'Özgür Y.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80' },
    { name: 'Ayşe K.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
    { name: 'Kpt. Mehmet', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
    { name: 'Selin D.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80' },
    { name: 'Burak A.', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=80&q=80' },
  ]

  const topContributors = [
    { name: 'Kaptan Mehmet', sub: 'Doğrulanmış Kaptan', posts: 412, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
    { name: 'Burak Aydın', sub: 'Koy Avcısı', posts: 287, avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=80&q=80' },
    { name: 'Özgür Yıldız', sub: 'Deniz Kurdu', posts: 247, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80' },
    { name: 'Ayşe Kaya', sub: 'Aktif Üye', posts: 89, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
    { name: 'Selin Demir', sub: 'Yeni Üye', posts: 34, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80' },
  ]

  const popularTags = [
    { tag: 'Bodrum', count: 312 }, { tag: 'Marmaris', count: 248 },
    { tag: 'Göcek', count: 189 },  { tag: 'Kiralama', count: 451 },
    { tag: 'Yelkenli', count: 220 },{ tag: 'Gizli Koy', count: 167 },
    { tag: 'Kaptan', count: 134 },  { tag: 'Dalış', count: 98 },
    { tag: 'Gulet', count: 87 },    { tag: 'Hava Durumu', count: 76 },
    { tag: 'Rota', count: 203 },    { tag: 'Fiyat', count: 159 },
  ]

  const forumRules = [
    'Saygılı ve yapıcı bir dil kullanın.',
    'Kişisel bilgileri (tel, adres) paylaşmaktan kaçının.',
    'Ticari reklamları ilgili kategoriye ekleyin.',
    'Yanıtlamadan önce benzer konuları arayın.',
    'Fotoğraf ve video paylaşımlarında telif haklarına dikkat edin.',
  ]

  return (
    <div className="forum-page">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="forum-hero" aria-label="Forum girişi">
        <div className="forum-hero-inner">
          <div className="forum-hero-top">
            <div>
              <p className="forum-eyebrow">SeaHub topluluğu</p>
              <h1 className="forum-title">Denizci forumu</h1>
              <p className="forum-hero-sub">12.000+ üye — rotalar, kiralama tavsiyeleri ve kaptan önerileri</p>
            </div>
            <button type="button" className="forum-hero-btn">
              <Plus size={18} strokeWidth={2.25} aria-hidden />
              Yeni konu
            </button>
          </div>

          <div className="forum-search-row" role="search">
            <div className="forum-search-field">
              <Search className="forum-search-ico" size={18} strokeWidth={2} aria-hidden />
              <input
                className="forum-search-input"
                type="search"
                placeholder="Rota, koy, tekne veya kaptan ara…"
                aria-label="Forum içinde ara"
              />
            </div>
            <button type="button" className="forum-search-btn" aria-label="Ara">
              Ara
            </button>
          </div>

          <div className="forum-stats" role="list" aria-label="Forum istatistikleri">
            {[
              { val: '12.400+', label: 'Üye' },
              { val: '1.741', label: 'Konu' },
              { val: '15.512', label: 'Gönderi' },
              { val: '48', label: 'Çevrimiçi' },
            ].map(s => (
              <div key={s.label} className="forum-stat" role="listitem">
                <span className="forum-stat-val">{s.val}</span>
                <span className="forum-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="forum-body">

        {/* LEFT — categories + threads */}
        <div>

          {/* Categories */}
          <div className="forum-cats-section">
            <h2 className="forum-section-title">Kategoriler</h2>
            <div className="forum-cats-grid">
              {categories.map(cat => (
                <Link key={cat.id} href={`/forum/category/${cat.id}`} className="forum-cat-card">
                  <div className={`forum-cat-icon ${CAT_COLOR[cat.colorClass] ?? 'blue'}`}>
                    <CategoryIcon categoryId={cat.id} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="forum-cat-title">{cat.title}</div>
                    <div className="forum-cat-desc">{cat.description}</div>
                    <div className="forum-cat-meta">
                      <span className="forum-cat-count"><strong>{cat.threadCount}</strong> konu</span>
                      <span className="forum-cat-count"><strong>{cat.postCount.toLocaleString('tr-TR')}</strong> gönderi</span>
                    </div>
                    <div className="forum-cat-last">
                      <span>Son:</span>
                      <span className="forum-cat-last-title">{cat.lastThread.title}</span>
                      <span>— {cat.lastThread.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Latest threads */}
          <div className="forum-threads-section">
            <div className="forum-threads-head">
              <h2 className="forum-section-title">Son konular</h2>
              <Link href="/forum/all" className="forum-link-all">
                Tümünü gör
              </Link>
            </div>

            {/* Client-side filter tabs */}
            <ForumFilters />

            <div className="forum-threads-list" role="list" aria-label="Forum konuları">
              {threads.map(thread => (
                <ThreadRow key={thread.id} thread={thread} />
              ))}
            </div>

            {/* Load more */}
            <div className="forum-load-wrap">
              <button type="button" className="forum-load-more">
                Daha fazla yükle
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT — sidebar */}
        <aside className="forum-sidebar" aria-label="Forum yan paneli">

          <div className="forum-sidebar-card">
            <div className="forum-sidebar-head">
              <h4 className="forum-sidebar-title forum-sidebar-title--live">
                Çevrimiçi <span className="forum-live-count">{onlineUsers.length + 43}</span>
              </h4>
            </div>
            <div className="forum-sidebar-body">
              <div className="forum-online-list">
                {onlineUsers.map(u => (
                  <div key={u.name} className="forum-online-user">
                    <div className="forum-online-avatar-wrap">
                      <div className="forum-online-avatar">
                        <Image src={u.avatar} alt={u.name} fill sizes="28px" style={{ objectFit: 'cover' }} />
                      </div>
                      <span className="forum-online-dot" aria-hidden="true" />
                    </div>
                    <span className="forum-online-name">{u.name}</span>
                  </div>
                ))}
                <span className="forum-online-more">+43 daha</span>
              </div>
            </div>
          </div>

          <div className="forum-sidebar-card">
            <div className="forum-sidebar-head">
              <h4 className="forum-sidebar-title">En aktif üyeler</h4>
            </div>
            <div className="forum-sidebar-body">
              <div className="forum-contrib-list">
                {topContributors.map((u, i) => (
                  <div key={u.name} className="forum-contrib-row">
                    <div className="forum-contrib-rank-cell" aria-hidden>
                      <LeaderboardRank index={i} />
                    </div>
                    <div className="forum-contrib-avatar">
                      <Image src={u.avatar} alt={u.name} fill sizes="36px" style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <span className="forum-contrib-name">{u.name}</span>
                      <span className="forum-contrib-sub">{u.sub}</span>
                    </div>
                    <span className="forum-contrib-posts">{u.posts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="forum-sidebar-card">
            <div className="forum-sidebar-head">
              <h4 className="forum-sidebar-title">Popüler etiketler</h4>
            </div>
            <div className="forum-sidebar-body">
              <div className="forum-tags-cloud">
                {popularTags.map(({ tag, count }) => (
                  <Link key={tag} href={`/forum/tag/${tag.toLowerCase()}`} className="forum-tag-cloud-item">
                    #{tag} <span>({count})</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="forum-sidebar-card">
            <div className="forum-sidebar-head">
              <h4 className="forum-sidebar-title">Topluluk kuralları</h4>
            </div>
            <div className="forum-sidebar-body">
              <div className="forum-rules-list">
                {forumRules.map((rule, i) => (
                  <div key={i} className="forum-rule-item">
                    <span className="forum-rule-num">{i + 1}</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="forum-cta-card">
            <div className="forum-cta-icon" aria-hidden="true">
              <UsersRound size={28} strokeWidth={1.6} />
            </div>
            <h4 className="forum-cta-title">Topluluğa katıl</h4>
            <p className="forum-cta-text">
              Konu aç, yanıt ver, rotanı paylaş; binlerce denizciyle bağlantı kur.
            </p>
            <button type="button" className="forum-cta-btn">
              Ücretsiz üye ol
            </button>
            <p className="forum-cta-foot">
              Zaten üye misiniz?{' '}
              <Link href="/login" className="forum-cta-link">
                Giriş yapın
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
