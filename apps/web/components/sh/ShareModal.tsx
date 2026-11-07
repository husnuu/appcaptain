'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import {
  IconBrandFacebook,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandX,
  IconCopy,
  IconDots,
  IconMail,
} from '@tabler/icons-react'

interface Props {
  url: string
  title: string
  /** Önizleme satırı (ilan görseli + başlık + alt satır). */
  image?: string | null
  subtitle?: string | null
  onClose: () => void
}

/** "Bu ilanı paylaş" penceresi — bağlantı kopyalama, e-posta ve sosyal ağlar. */
export default function ShareModal({ url, title, image, subtitle, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const links: { key: string; label: string; icon: ReactNode; href: string }[] = [
    { key: 'mail', label: 'E-posta', icon: <IconMail size={24} stroke={1.6} />, href: `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n${url}`)}` },
    { key: 'wa', label: 'WhatsApp', icon: <IconBrandWhatsapp size={24} stroke={1.6} />, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { key: 'fb', label: 'Facebook', icon: <IconBrandFacebook size={24} stroke={1.6} />, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'x', label: 'X / Twitter', icon: <IconBrandX size={22} stroke={1.6} />, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: 'tg', label: 'Telegram', icon: <IconBrandTelegram size={24} stroke={1.6} />, href: `https://t.me/share/url?url=${u}&text=${t}` },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Eski tarayıcılar: geçici input ile kopyala
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      /* kullanıcı vazgeçti */
    }
  }

  return createPortal(
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal sh-share" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={e => e.stopPropagation()}>
        <div className="sh-share-top">
          <button type="button" className="sh-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div className="sh-share-body">
          <h2 id="share-title">Bu ilanı paylaş</h2>

          <div className="sh-share-item">
            {image && (
              <span className="sh-share-thumb">
                <Image src={image} alt="" fill sizes="72px" />
              </span>
            )}
            <span>
              <b>{title}</b>
              {subtitle && <small>{subtitle}</small>}
            </span>
          </div>

          <ul className="sh-share-grid">
            <li>
              <button type="button" className={`sh-share-opt${copied ? ' is-done' : ''}`} onClick={copy}>
                {copied ? <Check size={24} strokeWidth={2} /> : <IconCopy size={24} stroke={1.6} />}
                {copied ? 'Bağlantı kopyalandı' : 'Bağlantıyı kopyala'}
              </button>
            </li>
            {links.map(l => (
              <li key={l.key}>
                <a className="sh-share-opt" href={l.href} target={l.key === 'mail' ? undefined : '_blank'} rel="noopener noreferrer">
                  {l.icon}
                  {l.label}
                </a>
              </li>
            ))}
            {canNativeShare && (
              <li>
                <button type="button" className="sh-share-opt" onClick={nativeShare}>
                  <IconDots size={24} stroke={1.6} />
                  Daha fazla seçenek
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  )
}
