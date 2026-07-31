import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/types/content'
import { PLACEHOLDER_BLOG_COVER } from '@/lib/constants/images'

export default function BlogSection({ posts }: { posts: BlogPost[] }) {
  const list = (posts ?? []).slice(0, 4)
  return (
    <section className="blog-section" aria-labelledby="blog-heading">
      <div className="section-inner">
        <header className="blog-section-head">
          <h2 id="blog-heading" className="blog-section-title">
            Blogumuzdan popüler yayınlar
          </h2>
        </header>

        <div className="blog-row">
          {list.map(post => (
            <Link key={post.id} href={post.href} className="blog-row-card">
              <div className="blog-row-img">
                <Image
                  src={post.image?.trim() || PLACEHOLDER_BLOG_COVER}
                  alt={post.title}
                  fill
                  sizes="(max-width: 560px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="blog-row-body">
                <h3 className="blog-row-title">{post.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="blog-section-foot">
          <Link href="/blog" className="blog-section-more">
            Daha fazla makale
          </Link>
        </div>
      </div>
    </section>
  )
}
