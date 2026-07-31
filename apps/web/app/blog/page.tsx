import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import BlogCategoryTabs from '@/components/blog/BlogCategoryTabs'
import { getBlogPosts, getBlogCategories } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Deniz Rehberi — SeaHub Blog',
  description: 'Rota tavsiyeleri, kiralama rehberleri, deneyim hikayeleri ve teknik ipuçları. SeaHub\'ın deniz rehberi.',
}

export default async function BlogPage() {
  const posts      = getBlogPosts()
  const categories = getBlogCategories()

  const featured = posts.find(p => p.featured) ?? posts[0]
  if (!featured) return null
  const rest      = posts.filter(p => p.id !== featured.id)

  const popularPosts = [...posts].sort(() => 0.5 - Math.random()).slice(0, 4)

  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--hairline-gray)',
        padding: '32px 24px 0',
        background: 'white',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--rausch)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
                🌊 SeaHub Blog
              </p>
              <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink-black)', letterSpacing: '-0.6px', marginBottom: 6 }}>
                Deniz Rehberi
              </h1>
              <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--ash-gray)', paddingBottom: 24 }}>
                Rotalar, kiralama tavsiyeleri, deneyim hikayeleri ve daha fazlası
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href="/forum" style={{ padding: '10px 20px', border: '1px solid var(--hairline-gray)', borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 600, color: 'var(--ink-black)', transition: 'all 0.15s' }}>
                💬 Forum
              </Link>
              <button style={{ padding: '10px 20px', background: 'var(--rausch)', border: 'none', borderRadius: 'var(--r-pill)', fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                ✉️ Bülten
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURED POST ───────────────────────────────────── */}
      <div className="blog-hero">
        <Link href={featured.href} className="blog-hero-featured">
          <Image
            src={featured.image}
            alt={featured.title}
            fill priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="blog-hero-overlay" aria-hidden="true" />
          <div className="blog-hero-content">
            <span className="blog-hero-tag">{featured.tag}</span>
            <p className="blog-hero-excerpt">{featured.excerpt}</p>
            <h2 className="blog-hero-title">{featured.title}</h2>
            <div className="blog-hero-meta">
              <div className="blog-hero-avatar">
                <Image src={featured.author.avatar} alt={featured.author.name} fill sizes="32px" style={{ objectFit: 'cover' }} />
              </div>
              <span>{featured.author.name}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{featured.date}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{featured.readTime}</span>
              <span style={{ background: 'var(--rausch)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Öne Çıkan</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <span className="blog-hero-read">Yazıyı Oku →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── MAIN BODY ───────────────────────────────────────── */}
      <div className="blog-list-body">

        {/* LEFT — grid */}
        <div>
          <BlogCategoryTabs categories={categories} />

          <div className="blog-posts-grid">
            {rest.map(post => (
              <Link key={post.id} href={post.href} className="blog-post-card">
                <div className="blog-post-card-img">
                  <Image src={post.image} alt={post.title} fill sizes="(max-width:800px) 100vw, 50vw" />
                </div>
                <span className="blog-post-card-tag">{post.tag}</span>
                <h3 className="blog-post-card-title">{post.title}</h3>
                <p className="blog-post-card-excerpt">{post.excerpt}</p>
                <div className="blog-post-card-meta">
                  <div className="blog-post-card-avatar">
                    <Image src={post.author.avatar} alt={post.author.name} fill sizes="28px" style={{ objectFit: 'cover' }} />
                  </div>
                  <span>{post.author.name}</span>
                  <span style={{ color: 'var(--stone-gray)' }}>·</span>
                  <span>{post.date}</span>
                  <span style={{ color: 'var(--stone-gray)' }}>·</span>
                  <span>⏱ {post.readTime}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{ padding: '12px 36px', border: '1px solid var(--hairline-gray)', borderRadius: 'var(--r-pill)', background: 'white', fontSize: 14, fontWeight: 600, color: 'var(--ink-black)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              Daha fazla yükle
            </button>
          </div>
        </div>

        {/* RIGHT — sidebar */}
        <aside className="blog-sidebar" aria-label="Blog yan panel">

          {/* Popular */}
          <div className="blog-sidebar-card">
            <div className="blog-sidebar-head">🔥 Popüler Yazılar</div>
            <div className="blog-sidebar-body" style={{ padding: '8px 20px' }}>
              {popularPosts.map(p => (
                <Link key={p.id} href={p.href} className="blog-sidebar-post">
                  <div className="blog-sidebar-post-img">
                    <Image src={p.image} alt={p.title} fill sizes="64px" style={{ objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div className="blog-sidebar-post-title">{p.title}</div>
                    <div className="blog-sidebar-post-date">{p.date} · {p.readTime}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="blog-sidebar-card">
            <div className="blog-sidebar-head">📂 Kategoriler</div>
            <div className="blog-sidebar-body" style={{ padding: '8px 20px' }}>
              {categories.filter(c => c.id !== 'all').map(cat => (
                <div key={cat.id} className="blog-sidebar-cat">
                  <span>{cat.label}</span>
                  <span className="blog-sidebar-cat-count">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter mini */}
          <div style={{
            background:
              'linear-gradient(135deg, var(--cashback-brand-deep) 0%, var(--cashback-brand) 55%, #2448e0 100%)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 6 }}>
              Haftalık Deniz Bülteni
            </h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14, lineHeight: 1.5 }}>
              Her Pazartesi yeni rotalar, tavsiyeler ve fırsatlar e-postanıza gelsin.
            </p>
            <input
              type="email"
              placeholder="E-posta adresiniz"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
                fontSize: 14, fontFamily: 'var(--font)', marginBottom: 8, outline: 'none',
              }}
              aria-label="E-posta"
            />
            <button style={{
              width: '100%', padding: '10px 0', background: 'var(--rausch)', border: 'none',
              borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              Abone Ol
            </button>
          </div>

          {/* Tags cloud */}
          <div className="blog-sidebar-card">
            <div className="blog-sidebar-head">🏷️ Etiketler</div>
            <div className="blog-sidebar-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Bodrum','Yelkenli','Rota','Kiralama','Gulet','Dalış','Kaptan','Hava','Koy','Marmaris','Göcek','Yoga'].map(tag => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase()}`} className="article-tag-item" style={{ fontSize: 12, padding: '4px 10px' }}>
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </aside>
      </div>
    </>
  )
}
