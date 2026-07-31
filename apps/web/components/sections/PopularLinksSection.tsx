import Link from 'next/link'

const RENTAL_LOCATIONS = [
  'Bodrum - Göcek', 'Marmaris - Datça', 'Göcek - Kaş',
  'Çeşme - Kuşadası', 'Kaş - Antalya', 'Fethiye - Marmaris',
  'Bodrum - Marmaris', 'Kuşadası - Bodrum', 'İzmir - Çeşme',
  'Datça - Bodrum', 'Antalya - Kaş', 'Fethiye - Göcek',
  'Bodrum - Didim', 'Marmaris - Fethiye', 'Çeşme - İzmir',
  'Göcek - Fethiye', 'Kaş - Kastellorizo', 'Didim - Kuşadası',
  'Bozcaada - Çanakkale', 'Gökçeada - Çanakkale', 'Ayvalık - Midilli',
  'Bodrum - Kos', 'Kuşadası - Samos', 'Marmaris - Rodos',
  'Kaş - Meis', 'Fethiye - Rodos', 'Çeşme - Sakız',
  'Datça - Symi', 'Bodrum - Symi', 'Göcek - Ölüdeniz',
]

const EXPERIENCE_LOCATIONS = [
  'Bodrum Dalış Kursu', 'Marmaris Yoga Workshopu', 'Kaş Snorkeling',
  'Göcek Gün Batımı Turu', 'Çeşme Sörf Dersi', 'Fethiye Gulet Turu',
  'İzmir Tekne Turu', 'Antalya Macera Dalışı', 'Kuşadası Adalar Turu',
  'Datça Doğa Turu', 'Bodrum Balıkçılık', 'Marmaris Fotoğraf Turu',
  'Kaş Mağara Dalışı', 'Göcek Haftalık Charter', 'Bodrum Parti Teknesi',
  'Fethiye Kelebek Vadisi', 'Antalya Manavgat Turu', 'Çeşme Gün Turu',
  'Bodrum Yoga & Meditasyon', 'Marmaris Seramik Workshop', 'Kaş Deniz Kayağı',
  'İzmir Kordon Turu', 'Bodrum Şarap & Yelken', 'Kuşadası Efes Turu',
  'Datça Badem Bahçesi', 'Göcek Koy Turu', 'Marmaris Orman Yürüyüşü',
  'Kaş Bisiklet & Tekne', 'Bodrum Lüks Yat Turu', 'Fethiye Balonlu Gün',
]

// Split items into 3 equal columns
function splitToColumns<T>(items: T[], cols: number): T[][] {
  const perCol = Math.ceil(items.length / cols)
  return Array.from({ length: cols }, (_, i) =>
    items.slice(i * perCol, (i + 1) * perCol)
  )
}

interface PanelProps {
  title: string
  items: string[]
  showMoreLabel: string
  showMoreHref: string
}

function Panel({ title, items, showMoreLabel, showMoreHref }: PanelProps) {
  const visible = items.slice(0, 30)
  const columns = splitToColumns(visible, 3)

  return (
    <div className="popular-panel">
      <h3 className="popular-panel-title">{title}</h3>
      <div className="popular-links-grid">
        {columns.map((col, ci) => (
          <ul key={ci} className="popular-links-col">
            {col.map(item => (
              <li key={item}>
                <Link href="/listing" className="popular-link">{item}</Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <Link href={showMoreHref} className="popular-show-more">
        {showMoreLabel}
      </Link>
    </div>
  )
}

export default function PopularLinksSection() {
  return (
    <section className="popular-section" aria-label="Popüler konumlar ve deneyimler">
      <div className="popular-inner">
        <Panel
          title="Popüler Kiralama Konumları"
          items={RENTAL_LOCATIONS}
          showMoreLabel="Daha fazla kiralama konumu göster"
          showMoreHref="/listing"
        />
        <Panel
          title="Popüler Deneyim Noktaları"
          items={EXPERIENCE_LOCATIONS}
          showMoreLabel="Daha fazla deneyim noktası göster"
          showMoreHref="/listing"
        />
      </div>
    </section>
  )
}
