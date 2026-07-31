import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchExperience, fetchExperiences } from '@/lib/api'
import { experienceToCard } from '@/lib/mappers'
import BookingPanel from '@/components/experience/BookingPanel'
import ExperienceCard from '@/components/marketplace/ExperienceCard'

// Dynamic rendering — experiences come from the live API, not a static list.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const dto = await fetchExperience(slug)
  if (!dto) return { title: 'Deneyim bulunamadı' }
  const exp = experienceToCard(dto)
  return {
    title: `${exp.title} — SeaHub`,
    description: `${exp.category} deneyimi. ${exp.duration} süren bu unutulmaz tur için hemen rezervasyon yapın.`,
  }
}

// ─── Rich detail data (demo: Çeşme barbekü turu) ─────────────────────────────
const DETAIL_DATA: Record<string, {
  providerName: string
  providerAvatar: string
  extraImages: string[]
  shortDesc: string
  highlights: string[]
  fullDesc: string
  included: string[]
  notIncluded: string[]
  itinerary: { label: string; duration: string; icon: string }[]
  meetingPoint: string
  whatToBring: string[]
  beforeActivity: string[]
  generalInfo: { icon: string; title: string; desc: string }[]
  originalPrice: number
}> = {
  'cesme-tekne-turu': {
    providerName: 'Çeşme Poseidon',
    providerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    extraImages: [
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
      'https://images.unsplash.com/photo-1530939027401-cca9e7ef4f58?w=800&q=80',
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
      'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80',
    ],
    shortDesc: 'Bu tekne turunda Çeşme yakınlarındaki 4 ada ve koyu keşfedin. Son derece berrak sularda snorkelle dalın, barbekü öğle yemeğinin tadını çıkarın, kişisel şezlongunuzda dinlenin ve otelden alım ve bırakmayı dahil etmeyi tercih edin.',
    highlights: [
      'Görüş mesafesi 20 metreyi aşan sularda snorkelle dalarken su altını görün',
      'Rahatlatıcı bir tekne turuyla Ege Denizi\'ndeki 4 ada ve koya yelken açın',
      'Çeşme\'nin doğa harikası koylarında snorkelle dalın, yüzün ve kürek sörfü yapın',
      'Makama ve mevsim salataları eşliğinde tavuk veya balıktan oluşan barbekü öğle yemeğinin tadını çıkarın',
      'Güneş şirinlerini içinize çekin ve ayrılmış şezlonglarda keyifli bir günün tadını çıkarın',
    ],
    fullDesc: 'Bu tekne turunda Çeşme çevresindeki muhteşem adaları ve koyları keşfedin. Kristal berraklığındaki sularda yüzün, teknede barbekü öğle yemeğinin tadını çıkarın ve kişi başı ayrılmış bir şezlongun keyfini çıkarın.\n\nSabah erken saatlerde Çeşme limanından hareket eden teknemiz, Ege\'nin en güzel koylarını ve adalarını ziyaret edecek. Her durakta hem yüzme hem de şnorkel imkânı sunulmakta; deniz yaşamını yakından gözlemleyebileceksiniz. Gün ortasında ise güverteye kurulan barbekü ile taze deniz ürünleri ve mevsimlik sebzelerden oluşan öğle yemeğinin keyfini çıkaracaksınız.',
    included: [
      'Tekne gezisi',
      'Gidiş-dönüş otel transferi (seçenek seçilirse)',
      'Barbekü öğle yemeği',
      'Mürettebat',
      'Di',
      'Şezlong',
      'Can yelekleri ve halkalar',
    ],
    notIncluded: [
      'İçecekler (satın alınabilir)',
      'Atıştırmalıklar',
    ],
    itinerary: [
      { label: 'Başlangıç/araçla alıma konumu', duration: 'Seçilen seçeneğe bağlı', icon: 'start' },
      { label: 'Tekne gezisi', duration: '1 saat', icon: 'boat' },
      { label: 'Snorkelle yüzme', duration: '1 saat', icon: 'snorkel' },
      { label: 'Ege Bölgesi — Öğle yemeği', duration: '45 dakika', icon: 'food' },
      { label: 'Serbest zaman, Yürüyüş, Yüzme', duration: '75 dakika', icon: 'swim' },
      { label: 'Yüzme, Snorkelle yüzme', duration: '1 saat', icon: 'snorkel' },
      { label: 'Sahil durağı', duration: '', icon: 'end' },
    ],
    meetingPoint: 'Çeşme Kalesi\'ni arkanızda gördüğünüzde sağa dönün ve deniz kenarına inin. 200 metre yürüyeceksiniz ve teknemiz postanenin karşısında kalıyor. (PTT, Postane\'nin adıdır)',
    whatToBring: ['Güneş gözlüğü', 'Mayo', 'Havlu', 'Güneş kremi'],
    beforeActivity: [
      'Aktivite sağlayıcı şezlongunuzu sizin için reserve edecektir; yer kaplamak için erken gelmenize gerek yoktur.',
      'Sadece erkek rezervasyonları kabul edilmez.',
    ],
    generalInfo: [
      { icon: 'cancel', title: 'Ücretsiz iptal', desc: '24 saat öncesine kadar iptal et ve paranın tamamını geri al' },
      { icon: 'pay-later', title: 'Şimdi ayırt ve sonra öde', desc: 'Seyahat planlarını esnek tut — yerini ayırt ve bugün hiçbir şey ödeme' },
      { icon: 'clock', title: 'Süre: 8 saat', desc: 'Başlangıç saatlerini görmek için yer durumunu kontrol edin' },
      { icon: 'guide', title: 'Karşılama personeli', desc: 'İngilizce, Türkçe' },
      { icon: 'accessible', title: 'Tekerlekli sandalyeyle erişilebilir', desc: '' },
      { icon: 'pickup', title: 'Alınma seçeneği mevcut', desc: 'Alım seçenekleri için uygunluk durumunu kontrol edin' },
    ],
    originalPrice: 3285,
  },
}

function getDetailData(slug: string) {
  if (DETAIL_DATA[slug]) return DETAIL_DATA[slug]
  // Fallback generic data for any other slug
  return {
    providerName: 'SeaHub Rehberi',
    providerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    extraImages: [
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
      'https://images.unsplash.com/photo-1530939027401-cca9e7ef4f58?w=800&q=80',
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
      'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80',
    ],
    shortDesc: 'Türkiye\'nin eşsiz kıyılarında, yerel rehberler eşliğinde unutulmaz bir deniz deneyimi yaşayın.',
    highlights: [
      'Uzman rehberler eşliğinde güvenli ve keyifli bir deneyim',
      'Kristal berrak Türkiye koylarını keşfedin',
      'Tüm ekipmanlar dahil, sadece kendinizi getirin',
      'Küçük gruplarla kişiselleştirilmiş ilgi',
      'Fotoğraf ve video çekimi için muhteşem lokasyonlar',
    ],
    fullDesc: 'Türkiye\'nin en güzel kıyı noktalarında düzenlenen bu deneyim, hem macera hem de huzur arayanlar için idealdir. Yerel rehberlerimiz, bölgenin en iyi yerlerini size gösterecek ve unutulmaz anlar yaratmanıza yardımcı olacaktır.',
    included: ['Profesyonel rehber', 'Gerekli ekipmanlar', 'Sigorta', 'Su ve hafif ikram'],
    notIncluded: ['Ulaşım (isteğe bağlı transfer mevcuttur)', 'Fotoğraf paketi'],
    itinerary: [
      { label: 'Buluşma noktası', duration: '', icon: 'start' },
      { label: 'Ana aktivite', duration: '3-4 saat', icon: 'boat' },
      { label: 'Mola ve ikram', duration: '30 dakika', icon: 'food' },
      { label: 'Serbest keşif', duration: '1 saat', icon: 'swim' },
      { label: 'Bitiş noktası', duration: '', icon: 'end' },
    ],
    meetingPoint: 'Rezervasyon onaylandıktan sonra kesin buluşma noktası bilgisi gönderilecektir.',
    whatToBring: ['Güneş gözlüğü', 'Rahat kıyafet', 'Güneş kremi', 'Su'],
    beforeActivity: ['Rezervasyonunuzu en az 24 saat öncesinde yapmanız önerilir.'],
    generalInfo: [
      { icon: 'cancel', title: 'Ücretsiz iptal', desc: '24 saat öncesine kadar iptal et' },
      { icon: 'pay-later', title: 'Şimdi ayırt ve sonra öde', desc: 'Bugün hiçbir şey ödeme' },
      { icon: 'clock', title: 'Süre değişkendir', desc: 'Detaylar için iletişime geçin' },
      { icon: 'guide', title: 'Türkçe & İngilizce rehber', desc: '' },
    ],
    originalPrice: 0,
  }
}

function GeneralInfoIcon({ type }: { type: string }) {
  const stroke = 'currentColor'
  const props = { width: 22, height: 22, fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (type === 'cancel')     return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
  if (type === 'pay-later')  return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  if (type === 'clock')      return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  if (type === 'guide')      return <svg {...props} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  if (type === 'accessible') return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M12 8l-1 8h4l2 6"/><path d="M8 10l-2 10"/></svg>
  if (type === 'pickup')     return <svg {...props} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
}

function ItineraryIcon({ type }: { type: string }) {
  if (type === 'start' || type === 'end') return (
    <div className="exp-itin-dot exp-itin-dot--end" aria-hidden="true" />
  )
  return <div className="exp-itin-dot" aria-hidden="true" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dto = await fetchExperience(slug)
  if (!dto) notFound()
  const exp = experienceToCard(dto)

  const detail = getDetailData(slug)
  const { items: pool } = await fetchExperiences({ limit: 20 })
  const related = pool
    .filter(e => e.id !== exp.id && e.category === dto.category)
    .map(experienceToCard)
    .slice(0, 4)

  const allImages = exp.images[0] ? [exp.images[0], ...detail.extraImages] : detail.extraImages

  return (
    <div className="listing-detail exp-detail-page expd-page">

      {/* ── Breadcrumb ── */}
      <div className="expd-breadcrumb">
        <div className="expd-breadcrumb-inner">
          <Link href="/deneyimler">Deneyimler</Link>
          <span className="expd-bc-sep" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </span>
          <Link href="/deneyimler">{exp.category}</Link>
          <span className="expd-bc-sep" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </span>
          <span className="expd-bc-current">{exp.title}</span>
        </div>
      </div>

      <div className="expd-inner">

        {/* ── Left column ── */}
        <div className="expd-left">

          <p className="expd-eyebrow">Deneyim</p>
          {/* Title */}
          <h1 className="expd-title">{exp.title}</h1>

          <div className="expd-quick-row" aria-label="Özet bilgiler">
            <span className="expd-quick-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              {exp.category}
            </span>
            <span className="expd-quick-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {exp.duration}
            </span>
          </div>

          {/* Meta row */}
          <div className="expd-meta-row">
            <div className="expd-stars">
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="15" height="15" viewBox="0 0 24 24"
                  fill={s <= Math.round(exp.rating) ? '#f5a623' : '#ddd'}
                  aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
              <span className="expd-rating-num">{exp.rating.toFixed(1)}</span>
              <span className="expd-review-count">{exp.reviewCount.toLocaleString('tr-TR')} yorum</span>
            </div>
            <span className="expd-meta-sep" aria-hidden="true">·</span>
            <span className="expd-provider expd-provider--with-avatar">
              <Image
                src={detail.providerAvatar}
                alt=""
                width={40}
                height={40}
                className="expd-provider-avatar"
              />
              <span className="expd-provider-text">
                Sağlayıcı <strong>{detail.providerName}</strong>
              </span>
            </span>
            <div className="expd-actions">
              <button className="expd-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                İstek listeme ekle
              </button>
              <button className="expd-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Paylaş
              </button>
            </div>
          </div>

          {/* Photo grid */}
          <div className="expd-photo-grid">
            <div className="expd-photo-main">
              {allImages[0] ? (
                <Image src={allImages[0]} alt={exp.title} fill className="expd-photo-img" sizes="(max-width: 768px) 100vw, 55vw" priority />
              ) : (
                <div className="expd-photo-img" aria-hidden />
              )}
              <div className="expd-photo-badges">
                <span className="expd-photo-badge">{exp.category}</span>
                {exp.badge ? (
                  <span className="expd-photo-badge expd-photo-badge--brand">{exp.badge}</span>
                ) : null}
                {exp.isBestSeller ? (
                  <span className="expd-photo-badge expd-photo-badge--hot">Çok Satan</span>
                ) : null}
              </div>
            </div>
            <div className="expd-photo-thumbs">
              {allImages.slice(1, 5).map((src, i) => (
                <div key={i} className="expd-photo-thumb">
                  <Image src={src} alt={`${exp.title} ${i + 2}`} fill className="expd-photo-img" sizes="25vw" />
                  {i === 3 && (
                    <button className="expd-photo-more">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Tümünü görüntüle
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Short description */}
          <p className="expd-short-desc">{detail.shortDesc}</p>

          {/* ── Genel bilgiler ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">Genel bilgiler</h2>
            <div className="expd-general-grid">
              {detail.generalInfo.map((item, i) => (
                <div key={i} className="expd-general-item">
                  <div className="expd-general-ico"><GeneralInfoIcon type={item.icon} /></div>
                  <div>
                    <div className="expd-general-label">{item.title}</div>
                    {item.desc && <div className="expd-general-desc">{item.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Güzergah ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">Güzergah</h2>
            <div className="expd-itin-wrap">
              <div className="expd-itin-list">
                {detail.itinerary.map((stop, i) => (
                  <div key={i} className="expd-itin-row">
                    <div className="expd-itin-left">
                      <ItineraryIcon type={stop.icon} />
                      {i < detail.itinerary.length - 1 && <div className="expd-itin-line" aria-hidden="true" />}
                    </div>
                    <div className="expd-itin-content">
                      <span className="expd-itin-label">{stop.label}</span>
                      {stop.duration && <span className="expd-itin-dur">{stop.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Map placeholder */}
              <div className="expd-itin-map">
                <div className="expd-map-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ash-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                  <span>Harita yükleniyor…</span>
                  <div className="expd-map-pin">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--rausch)" stroke="none" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                </div>
                <div className="expd-map-legend">
                  <span className="expd-map-leg-item expd-map-leg-item--start">
                    <span className="expd-map-leg-dot expd-map-leg-dot--rausch" aria-hidden="true"/>
                    Ana durak
                  </span>
                  <span className="expd-map-leg-item">
                    <span className="expd-map-leg-dot" aria-hidden="true"/>
                    Diğer durak
                  </span>
                </div>
              </div>
            </div>
            <button className="expd-itin-expand">Güzergahın tamamını görüntüle</button>
          </section>

          {/* ── İlgi çekici noktalar ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">İlgi çekici noktalar</h2>
            <ul className="expd-bullets">
              {detail.highlights.map((h, i) => (
                <li key={i} className="expd-bullet">
                  <span className="expd-bullet-dot" aria-hidden="true">•</span>
                  {h}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Tam açıklama ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">Tam açıklama</h2>
            {detail.fullDesc.split('\n\n').map((para, i) => (
              <p key={i} className="expd-para">{para}</p>
            ))}
            <button className="expd-expand-btn">Daha fazlasını gör</button>
          </section>

          {/* ── Dahil olanlar ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">Dahil olanlar</h2>
            <div className="expd-included-grid">
              <div>
                {detail.included.map((item, i) => (
                  <div key={i} className="expd-inc-row expd-inc-row--yes">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2a9d3f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>
              <div>
                {detail.notIncluded.map((item, i) => (
                  <div key={i} className="expd-inc-row expd-inc-row--no">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c13515" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Buluşma noktası ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">Buluşma noktası</h2>
            <div className="expd-meeting-wrap">
              <div className="expd-meeting-map-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ash-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                </svg>
                <div className="expd-meeting-pin" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--rausch)" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
              </div>
              <p className="expd-meeting-desc">{detail.meetingPoint}</p>
              <a href="#" className="expd-maps-link">
                Google Haritalar&#39;da aç
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </section>

          {/* ── Önemli bilgiler ── */}
          <section className="expd-section">
            <h2 className="expd-section-title">Önemli bilgiler</h2>
            <div className="expd-important-grid">
              <div>
                <h3 className="expd-imp-subtitle">Ne getirmeli</h3>
                <ul className="expd-imp-list">
                  {detail.whatToBring.map((item, i) => (
                    <li key={i} className="expd-imp-item">
                      <span className="expd-bullet-dot" aria-hidden="true">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="expd-imp-subtitle">Etkinlikten önce bilmen gerekenler</h3>
                <ul className="expd-imp-list">
                  {detail.beforeActivity.map((item, i) => (
                    <li key={i} className="expd-imp-item">
                      <span className="expd-bullet-dot" aria-hidden="true">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── Was helpful ── */}
          <div className="expd-helpful">
            Aradığınızı buldunuz mu?&nbsp;
            <button className="expd-helpful-btn">Evet</button>
            <span aria-hidden="true">/</span>
            <button className="expd-helpful-btn">Hayır</button>
          </div>

        </div>

        {/* ── Sticky right panel ── */}
        <div className="expd-right">
          <div className="expd-panel-sticky">
            <BookingPanel
              price={exp.startingPrice}
              originalPrice={detail.originalPrice > 0 ? detail.originalPrice : undefined}
            />
          </div>
        </div>

      </div>

      {/* ── Related experiences ── */}
      {related.length > 0 && (
        <section className="expd-related">
          <div className="expd-related-inner">
            <h2 className="expd-related-title">
              {exp.category} kategorisinde benzer deneyimler
            </h2>
            <p className="expd-related-lede">Aynı kategoride öne çıkan diğer seçenekler</p>
            <div className="exp-grid exp-grid--detail-related">
              {related.map(r => (
                <ExperienceCard key={r.id} exp={r} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
