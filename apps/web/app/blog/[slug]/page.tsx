import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleProgress from '@/components/blog/ArticleProgress'
import TableOfContents from '@/components/blog/TableOfContents'
import ArticleShare    from '@/components/blog/ArticleShare'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/data'
import type { BlogPostFull, BlogSection } from '@/types/content'

// Generate static params for known slugs
export async function generateStaticParams() {
  const posts = getBlogPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return { title: 'Yazı bulunamadı — SeaHub Blog' }
  return {
    title: `${post.title} — SeaHub Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.image] },
  }
}

// ── Content renderer ─────────────────────────────────────────
function renderSection(section: BlogSection, idx: number) {
  switch (section.type) {
    case 'heading': {
      const Tag  = `h${section.level}` as 'h2' | 'h3'
      const slug = section.text.toLowerCase().replace(/[^a-z0-9ğüşıöçğüşıöç ]/gi, '').replace(/\s+/g, '-')
      return <Tag key={idx} id={slug}>{section.text}</Tag>
    }
    case 'paragraph':
      return <div key={idx} dangerouslySetInnerHTML={{ __html: section.html }} />
    case 'quote':
      return (
        <blockquote key={idx} className="prose-quote">
          <p>{section.text}</p>
          {section.attribution && <cite>— {section.attribution}</cite>}
        </blockquote>
      )
    case 'callout':
      return (
        <div key={idx} className="prose-callout">
          <span className="prose-callout-icon">{section.icon}</span>
          <div>
            <div className="prose-callout-title">{section.title}</div>
            <div className="prose-callout-body">{section.body}</div>
          </div>
        </div>
      )
    case 'image':
      return (
        <figure key={idx} className="prose-img-wrap">
          <div style={{ position: 'relative', aspectRatio: '16/9' }}>
            <Image src={section.src} alt={section.alt} fill sizes="(max-width:1280px) 100vw, 740px" style={{ objectFit: 'cover', borderRadius: 14 }} />
          </div>
          {section.caption && <figcaption>{section.caption}</figcaption>}
        </figure>
      )
    case 'list':
      return (
        <ul key={idx}>
          {section.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
    case 'divider':
      return <hr key={idx} className="prose-divider" />
    default:
      return null
  }
}

// ── Extract TOC headings ──────────────────────────────────────
function extractToc(content: BlogSection[]) {
  let num = 0
  const result: { id: string; text: string; num: number }[] = []
  for (const s of content) {
    if (s.type === 'heading' && s.level === 2) {
      num++
      const id = s.text.toLowerCase().replace(/[^a-z0-9ğüşıöçğüşıöç ]/gi, '').replace(/\s+/g, '-')
      result.push({ id, text: s.text.replace(/^\d+\.\s*/, ''), num })
    }
  }
  return result
}

// ── Page ─────────────────────────────────────────────────────
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post: BlogPostFull | null = getBlogPostBySlug(slug)
  if (!post) notFound()

  const allPosts   = getBlogPosts()
  const relatedPosts = post.relatedSlugs
    .map(s => allPosts.find(p => p.slug === s))
    .filter(Boolean) as typeof allPosts

  const toc = extractToc(post.content)

  return (
    <>
      <ArticleProgress />

      {/* ── BREADCRUMB ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px 0' }}>
        <nav style={{ fontSize: 13, fontWeight: 500, color: 'var(--ash-gray)' }} aria-label="Sayfa konumu">
          <Link href="/" style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>SeaHub</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <Link href="/blog" style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>Blog</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: 'var(--ink-black)' }}>{post.tag}</span>
        </nav>
      </div>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '16px auto 0', padding: '0 24px' }}>
        <div className="article-hero" style={{ borderRadius: 24 }}>
          <Image src={post.image} alt={post.title} fill priority sizes="(max-width:1280px) 100vw, 1280px" />
          <div className="article-hero-overlay" aria-hidden="true" />
          <div className="article-hero-content">
            <span className="article-hero-tag">{post.tag}</span>
            <h1 className="article-hero-title">{post.title}</h1>
            <div className="article-hero-meta">
              <div className="article-hero-avatar">
                <Image src={post.author.avatar} alt={post.author.name} fill sizes="40px" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{post.author.name}</span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{post.author.title}</span>
              </div>
              <span style={{ opacity: 0.4, fontSize: 18 }}>·</span>
              <span>📅 {post.date}</span>
              <span style={{ opacity: 0.4, fontSize: 18 }}>·</span>
              <span>⏱ {post.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ARTICLE BODY ────────────────────────────────────── */}
      <div className="article-body">

        {/* Article content */}
        <article className="article-content">

          {/* Excerpt lead */}
          <p style={{
            fontSize: 20, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.6,
            borderLeft: '4px solid var(--rausch)', paddingLeft: 20, marginBottom: 40,
          }}>
            {post.excerpt}
          </p>

          {/* Main prose */}
          <div className="prose">
            {post.content.map((section, idx) => renderSection(section, idx))}
          </div>

          {/* Tags */}
          <div className="article-tags">
            {post.tags.map(tag => (
              <Link key={tag} href={`/blog/tag/${tag.toLowerCase()}`} className="article-tag-item">
                #{tag}
              </Link>
            ))}
          </div>

          {/* Author card */}
          <div className="author-card">
            <div className="author-card-avatar">
              <Image src={post.author.avatar} alt={post.author.name} fill sizes="72px" style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <div className="author-card-name">{post.author.name}</div>
              <div className="author-card-title">{post.author.title} · SeaHub</div>
              <p className="author-card-bio">
                Deniz tutkunusu, seyyah ve editör. Ege ile Akdeniz&apos;in koylarında 10 yılı aşkın
                süredir yelken açıyor, dalıyor ve bu deneyimleri sizlerle paylaşıyor.
                Bodrum&apos;dan İskenderun&apos;a kadar Türkiye sahillerini karış karış gezdi.
              </p>
            </div>
          </div>

          {/* Comments section (static demo) */}
          <section style={{ marginTop: 48 }} aria-labelledby="comments-heading">
            <h2 id="comments-heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px' }}>
              Yorumlar (6)
            </h2>

            {/* Comment input */}
            <div style={{ background: 'var(--soft-cloud)', borderRadius: 16, padding: 20, marginBottom: 32 }}>
              <textarea
                placeholder="Düşüncelerinizi paylaşın..."
                rows={3}
                style={{
                  width: '100%', border: '1px solid var(--hairline-gray)', borderRadius: 10,
                  padding: '12px 14px', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500,
                  resize: 'vertical', outline: 'none', marginBottom: 10, color: 'var(--ink-black)',
                }}
                aria-label="Yorum yaz"
              />
              <button style={{
                padding: '10px 24px', background: 'var(--ink-black)', border: 'none',
                borderRadius: 'var(--r-pill)', color: 'white', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                Yorum Yap
              </button>
            </div>

            {/* Static comments */}
            {[
              {
                name: 'Burak A.', date: '2 saat önce', likes: 12,
                avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=80&q=80',
                text: 'Özellikle bagaj konusu çok önemliydi, ilk kiralamamızda bunu yaşadık. Büyük bavullarla teknenin içinde kımıldayamadık 😅',
              },
              {
                name: 'Selin D.', date: '5 saat önce', likes: 8,
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
                text: 'Su tasarrufu konusunda çok katılıyorum. Marinaya her bağlandığımızda doldurduk ve sorun yaşamadık.',
              },
              {
                name: 'Kaptan Mehmet', date: '1 gün önce', likes: 31, isAuthor: true,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
                text: 'Harika bir rehber olmuş. Kaptan seçimi konusuna özellikle dikkat çektiğiniz için teşekkürler. Misafirlerin bizimle önceden iletişime geçmesi gerçekten çok önemli.',
              },
            ].map((comment, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '20px 0', borderBottom: '1px solid var(--hairline-gray)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <Image src={comment.avatar} alt={comment.name} fill sizes="44px" style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-black)' }}>{comment.name}</span>
                    {comment.isAuthor && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#e3f2fd', color: '#1565c0', padding: '2px 7px', borderRadius: 6 }}>
                        ⚓ Kaptan
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--ash-gray)', marginLeft: 'auto' }}>{comment.date}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1.55, marginBottom: 10 }}>
                    {comment.text}
                  </p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--ash-gray)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                      👍 {comment.likes}
                    </button>
                    <button style={{ fontSize: 13, fontWeight: 600, color: 'var(--ash-gray)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                      Yanıtla
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </article>

        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside className="article-sidebar" aria-label="Makale yan paneli">

          {/* TOC */}
          {toc.length > 0 && <TableOfContents items={toc} />}

          {/* Share */}
          <ArticleShare title={post.title} />

          {/* Author mini card */}
          <div className="article-sidebar-card">
            <div className="article-sidebar-head">Yazar</div>
            <div style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <Image src={post.author.avatar} alt={post.author.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-black)' }}>{post.author.name}</div>
                <div style={{ fontSize: 13, color: 'var(--rausch)', fontWeight: 600 }}>{post.author.title}</div>
              </div>
            </div>
          </div>

          {/* Info stats */}
          <div style={{ background: 'var(--soft-cloud)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
              {[
                { val: '5 dk', label: 'Okuma Süresi' },
                { val: '2.4k', label: 'Okunma' },
                { val: '187', label: 'Beğeni' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-black)' }}>{s.val}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ash-gray)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: 'linear-gradient(135deg, var(--rausch) 0%, var(--deep-rausch) 100%)', borderRadius: 14, padding: 20, textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⛵</div>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Hazır mısınız?</h4>
            <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 14, lineHeight: 1.5 }}>
              Teknenizi hemen arayın ve rezerve edin.
            </p>
            <Link href="/" style={{ display: 'block', padding: '10px 0', background: 'white', borderRadius: 10, color: 'var(--rausch)', fontWeight: 700, fontSize: 14 }}>
              Tekne Bul →
            </Link>
          </div>

        </aside>
      </div>

      {/* ── RELATED POSTS ───────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="related-section" aria-labelledby="related-heading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 id="related-heading" style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-black)', letterSpacing: '-0.4px' }}>
              İlgili Yazılar
            </h2>
            <Link href="/blog" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-black)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              Tüm yazılar
            </Link>
          </div>
          <div className="related-grid">
            {relatedPosts.map(rp => (
              <Link key={rp.id} href={rp.href} className="blog-post-card">
                <div className="blog-post-card-img">
                  <Image src={rp.image} alt={rp.title} fill sizes="(max-width:1280px) 33vw, 400px" />
                </div>
                <span className="blog-post-card-tag">{rp.tag}</span>
                <h3 className="blog-post-card-title">{rp.title}</h3>
                <div className="blog-post-card-meta">
                  <div className="blog-post-card-avatar">
                    <Image src={rp.author.avatar} alt={rp.author.name} fill sizes="28px" style={{ objectFit: 'cover' }} />
                  </div>
                  <span>{rp.author.name}</span>
                  <span style={{ color: 'var(--stone-gray)' }}>·</span>
                  <span>{rp.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
