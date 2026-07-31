'use client'

import { Check, Mail } from 'lucide-react'
import { useState } from 'react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    // TODO: Replace with actual newsletter API / Sanity mutation
    await new Promise(r => setTimeout(r, 800))
    setStatus('success')
    setEmail('')
    setTimeout(() => setStatus('idle'), 4000)
  }

  const benefits = [
    'Haftalık kampanyalar',
    'Erken erişim fırsatları',
    'Kişiselleştirilmiş öneriler',
  ]

  return (
    <section className="newsletter-section" aria-labelledby="nl-heading">
      <div className="newsletter-inner">
        <div className="newsletter-badge">
          <Mail size={14} strokeWidth={2.2} aria-hidden="true" />
          Ücretsiz üyelik
        </div>

        <h2 id="nl-heading" className="newsletter-title">
          Denizi Kaçırmayın
        </h2>
        <p className="newsletter-lead">
          Özel fırsatlar, yeni rotalar ve deniz dünyasından haberler doğrudan gelen kutunuza gelsin.
        </p>

        <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
          <input
            className="newsletter-input"
            type="email"
            placeholder="E-posta adresinizi girin"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            aria-label="E-posta adresi"
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            className={`newsletter-btn${status === 'success' ? ' newsletter-btn--success' : ''}`}
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Kaydediliyor…' : status === 'success' ? 'Teşekkürler' : 'Üye Ol'}
          </button>
        </form>

        <p className="newsletter-disclaimer">
          Spam yok. İstediğiniz zaman çıkabilirsiniz. Gizliliğinize saygı duyuyoruz.
        </p>

        <ul className="newsletter-benefits" aria-label="Bülten avantajları">
          {benefits.map(b => (
            <li key={b} className="newsletter-benefit">
              <Check size={16} strokeWidth={2.4} aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
