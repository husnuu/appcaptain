'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import BoatListCard from '@/components/boats/BoatListCard'
import { fetchBoats, type PublicBoatSummary } from '@/lib/api'

/** Hesabım → Favorilerim: favori teknelerin kartları (favorilere eklenme sırasıyla). */
export default function FavoriteBoats({ ids }: { ids: string[] }) {
  const [boats, setBoats] = useState<PublicBoatSummary[] | null>(null)
  const key = ids.join(',')

  useEffect(() => {
    const list = key ? key.split(',') : []
    if (list.length === 0) {
      setBoats([])
      return
    }
    let alive = true
    fetchBoats({ limit: 100 })
      .then(res => {
        if (!alive) return
        const byId = new Map(res.items.map(b => [b.id, b]))
        setBoats(list.map(id => byId.get(id)).filter((b): b is PublicBoatSummary => !!b))
      })
      .catch(() => alive && setBoats([]))
    return () => {
      alive = false
    }
  }, [key])

  return (
    <section className="sh-favs" id="favoriler" aria-labelledby="favs-title">
      <div className="sh-favs-head">
        <h2 id="favs-title">Favorilerim</h2>
        {boats && boats.length > 0 && <span>{boats.length} tekne</span>}
      </div>

      {boats === null ? (
        <p className="sh-favs-muted">Favorilerin yükleniyor…</p>
      ) : boats.length === 0 ? (
        <div className="sh-favs-empty">
          <span className="sh-favs-empty-ico">
            <Heart size={26} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <b>Henüz favorin yok</b>
          <p>Beğendiğin teknelerde “Favorilerime ekle”ye dokun; hepsi burada seni bekler.</p>
          <Link href="/tekne-kiralama" className="sh-ld-outline">
            Tekneleri keşfet
          </Link>
        </div>
      ) : (
        <div className="sh-bgrid">
          {boats.map(b => (
            <BoatListCard key={b.id} boat={b} />
          ))}
        </div>
      )}
    </section>
  )
}
