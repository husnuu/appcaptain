'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Loader2, ShieldCheck, X } from 'lucide-react'
import { sendBoatMessage } from '@/lib/api'
import HostAvatar from './HostAvatar'

const MAX = 2000

const PROMPTS = [
  'Seçtiğim tarihlerde müsait misiniz?',
  'Fiyata neler dahil?',
  'Nasıl bir rota önerirsiniz?',
  'Evcil hayvan kabul ediyor musunuz?',
]

interface Props {
  boatId: string
  boatTitle: string
  hostName: string
  hostAvatar: string | null
  onClose: () => void
  /** Oturum düşmüşse giriş penceresini açmak için. */
  onAuthRequired: () => void
}

/** İlan sayfasından kaptana ilk mesaj. Yanıtlar /mesajlarim sayfasında görünür. */
export default function MessageCaptainModal({ boatId, boatTitle, hostName, hostAvatar, onClose, onAuthRequired }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentId, setSentId] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setError(null)
    try {
      const { conversationId } = await sendBoatMessage(boatId, content)
      setSentId(conversationId)
    } catch (e) {
      if (e instanceof Error && e.message === 'AUTH') {
        onAuthRequired()
        return
      }
      setError(e instanceof Error ? e.message : 'Mesaj gönderilemedi, lütfen tekrar dene.')
    } finally {
      setSending(false)
    }
  }

  const addPrompt = (p: string) => setText(t => (t.trim() ? `${t.trim()}\n${p}` : p))

  return createPortal(
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal sh-msg" role="dialog" aria-modal="true" aria-labelledby="msg-title" onClick={e => e.stopPropagation()}>
        <div className="sh-share-top">
          <button type="button" className="sh-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {sentId ? (
          <div className="sh-msg-body sh-msg-done">
            <span className="sh-msg-done-ico">
              <CircleCheck size={30} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2 id="msg-title">Mesajın {hostName} kaptana iletildi</h2>
            <p>Kaptan yanıt verdiğinde konuşmayı Mesajlarım sayfasından takip edebilirsin.</p>
            <div className="sh-msg-actions">
              <Link href={`/mesajlarim?c=${sentId}`} className="sh-btn sh-btn--navy">
                Mesajlarıma git
              </Link>
              <button type="button" className="sh-ld-outline" onClick={onClose}>
                Kapat
              </button>
            </div>
          </div>
        ) : (
          <form
            className="sh-msg-body"
            onSubmit={e => {
              e.preventDefault()
              void send()
            }}
          >
            <div className="sh-msg-host">
              <HostAvatar name={hostName} src={hostAvatar} size={56} />
              <span>
                <h2 id="msg-title">{hostName} kaptana mesaj gönder</h2>
                <small>{boatTitle}</small>
              </span>
            </div>

            <p className="sh-msg-label">Hızlı soru ekle</p>
            <div className="sh-msg-prompts">
              {PROMPTS.map(p => (
                <button key={p} type="button" onClick={() => addPrompt(p)}>
                  {p}
                </button>
              ))}
            </div>

            <label className="sh-msg-field">
              <span className="sr-only">Mesajın</span>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX))}
                rows={6}
                autoFocus
                placeholder={`Merhaba ${hostName}, teknen hakkında bilgi almak istiyorum…`}
              />
              <small>
                {text.length}/{MAX}
              </small>
            </label>

            {error && <p className="sh-auth-error">{error}</p>}

            <p className="sh-msg-safe">
              <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" />
              Güvenliğin için iletişimi ve ödemeyi her zaman Ahoy üzerinden yap.
            </p>

            <button type="submit" className="sh-btn sh-btn--navy sh-msg-send" disabled={!text.trim() || sending}>
              {sending ? <Loader2 size={18} className="sh-auth-spin" aria-hidden="true" /> : 'Mesajı gönder'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
