'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const STEPS = [
  {
    title: 'Tekneni keşfet',
    text: 'Lokasyona, tekne tipine ve bütçene göre filtrele; ilanları fotoğraf, imkan ve koşullarıyla karşılaştır.',
    img: '/pages/sailboat.webp',
  },
  {
    title: 'Kaptana sor',
    text: 'Aklına takılanı rezervasyondan önce kaptana mesajla sor, yanıtını Mesajlarım’dan takip et.',
    img: '/pages/captain.webp',
  },
  {
    title: 'Talebini gönder',
    text: 'Tarihini ve kişi sayısını seç, talebini ilet. Bu aşamada hiçbir ödeme yapmazsın.',
    img: '/pages/view.webp',
  },
  {
    title: 'Denize açıl',
    text: 'Kaptan onaylayınca rezervasyonun kesinleşir. Gerisi güneş, deniz ve rüzgâr.',
    img: '/pages/fishing.webp',
  },
]

/** "Nasıl çalışır?" — ana sayfadaki "Seyahatini planla" adımlarının diliyle; fotoğraf adımla değişir. */
export default function HowItWorks() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % STEPS.length), 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <div className="sh-ed-how-photo">
        {STEPS.map((s, i) => (
          <Image key={s.img} src={s.img} alt="" fill sizes="(max-width: 860px) 100vw, 1280px" className={i === active ? 'is-on' : undefined} />
        ))}
      </div>
      <div className="sh-steps sh-steps--4">
        {STEPS.map((s, i) => (
          <button key={s.title} type="button" className={`sh-step${i === active ? ' sh-step--active' : ''}`} onClick={() => setActive(i)}>
            <div className="sh-step-bar" />
            <h3 className="sh-step-title">{s.title}</h3>
            <p className="sh-step-desc">{s.text}</p>
          </button>
        ))}
      </div>
    </>
  )
}
