'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, MessageCircleMore, Send } from 'lucide-react'
import type { GuestConversationDTO, GuestMessageDTO } from '@getyourboat/shared'
import AuthModal from '@/components/auth/AuthModal'
import { fetchConversation, fetchMyConversations, sendConversationMessage } from '@/lib/api'
import { useFavorites } from '@/lib/favorites'

const POLL_MS = 15_000

function fmtTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function fmtStamp(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MesajlarimPage() {
  return (
    <Suspense fallback={<main className="sh-inbox-page" />}>
      <Inbox />
    </Suspense>
  )
}

function Inbox() {
  const router = useRouter()
  const params = useSearchParams()
  const activeId = params.get('c')
  const { user, ready } = useFavorites()
  const [authOpen, setAuthOpen] = useState(false)
  const closeAuth = useCallback(() => setAuthOpen(false), [])

  const [convs, setConvs] = useState<GuestConversationDTO[] | null>(null)
  const [thread, setThread] = useState<{ conversation: GuestConversationDTO; messages: GuestMessageDTO[] } | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const loadList = useCallback(async () => {
    try {
      setConvs(await fetchMyConversations())
    } catch {
      setConvs(c => c ?? [])
    }
  }, [])

  const loadThread = useCallback(async (id: string) => {
    try {
      setThread(await fetchConversation(id))
      setThreadError(null)
    } catch (e) {
      setThreadError(e instanceof Error && e.message !== 'AUTH' ? e.message : 'Konuşma açılamadı')
    }
  }, [])

  // liste + açık konuşma; yeni yanıtlar için periyodik yenileme
  useEffect(() => {
    if (!user) return
    void loadList()
    const t = window.setInterval(() => void loadList(), POLL_MS)
    return () => window.clearInterval(t)
  }, [user, loadList])

  useEffect(() => {
    if (!user || !activeId) {
      setThread(null)
      return
    }
    setThread(null)
    void loadThread(activeId)
    const t = window.setInterval(() => void loadThread(activeId), POLL_MS)
    return () => window.clearInterval(t)
  }, [user, activeId, loadThread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [thread?.messages.length])

  const send = async () => {
    const content = text.trim()
    if (!content || !activeId || sending) return
    setSending(true)
    try {
      const msg = await sendConversationMessage(activeId, content)
      setText('')
      setThread(t => (t ? { ...t, messages: [...t.messages, msg] } : t))
      void loadList()
    } catch (e) {
      setThreadError(e instanceof Error ? e.message : 'Mesaj gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  if (!ready) return <main className="sh-inbox-page" />

  if (!user) {
    return (
      <main className="sh-inbox-page">
        <div className="sh-container">
          <div className="sh-inbox-gate">
            <span className="sh-inbox-gate-ico">
              <MessageCircleMore size={28} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <h1>Mesajlarım</h1>
            <p>Kaptanlarla yazışmalarını görmek için giriş yap.</p>
            <button type="button" className="sh-btn sh-btn--navy" onClick={() => setAuthOpen(true)}>
              Giriş yap
            </button>
          </div>
        </div>
        {authOpen && <AuthModal reason="Kaptanlarla yazışmalarını görmek için giriş yap." onClose={closeAuth} />}
      </main>
    )
  }

  const select = (id: string | null) => router.replace(id ? `/mesajlarim?c=${id}` : '/mesajlarim', { scroll: false })

  return (
    <main className="sh-inbox-page">
      <div className="sh-container">
        <h1 className="sh-inbox-title">Mesajlarım</h1>

        {convs !== null && convs.length === 0 ? (
          <div className="sh-inbox-empty">
            <span className="sh-inbox-gate-ico">
              <MessageCircleMore size={28} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <b>Henüz mesajın yok</b>
            <p>İlan sayfalarındaki “Kaptana mesaj gönder” ile kaptanlara soru sorabilirsin; yanıtlar burada görünür.</p>
            <Link href="/tekne-kiralama" className="sh-ld-outline">
              Tekneleri keşfet
            </Link>
          </div>
        ) : (
          <div className={`sh-inbox${activeId ? ' has-active' : ''}`}>
            <aside className="sh-inbox-list" aria-label="Konuşmalar">
              {convs === null ? (
                <p className="sh-inbox-muted">Yükleniyor…</p>
              ) : (
                convs.map(c => (
                  <button key={c.id} type="button" className={`sh-inbox-item${c.id === activeId ? ' is-active' : ''}`} onClick={() => select(c.id)}>
                    <span className="sh-inbox-item-ava" aria-hidden="true">
                      {(c.boat?.name ?? 'T').charAt(0).toLocaleUpperCase('tr')}
                    </span>
                    <span className="sh-inbox-item-text">
                      <span className="sh-inbox-item-top">
                        <b>{c.boat?.name ?? 'Tekne'}</b>
                        <small>{fmtTime(c.lastAt)}</small>
                      </span>
                      <span className="sh-inbox-item-last">{c.lastMessage ?? (c.booking ? 'Rezervasyon talebi' : 'Yeni konuşma')}</span>
                    </span>
                  </button>
                ))
              )}
            </aside>

            <section className="sh-inbox-thread" aria-label="Konuşma">
              {!activeId ? (
                <div className="sh-inbox-pick">
                  <MessageCircleMore size={30} strokeWidth={1.6} aria-hidden="true" />
                  <p>Okumak için soldan bir konuşma seç.</p>
                </div>
              ) : (
                <>
                  <header className="sh-inbox-head">
                    <button type="button" className="sh-icon-btn sh-inbox-back" onClick={() => select(null)} aria-label="Konuşmalara dön">
                      <ArrowLeft size={18} />
                    </button>
                    <span>
                      <b>{thread?.conversation.boat?.name ?? 'Konuşma'}</b>
                      {thread?.conversation.booking && (
                        <small>
                          Rezervasyon talebi · {new Date(thread.conversation.booking.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} –{' '}
                          {new Date(thread.conversation.booking.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </small>
                      )}
                    </span>
                    {thread?.conversation.boatId && (
                      <Link href={`/listing/${thread.conversation.boatId}`} className="sh-inbox-boatlink">
                        İlanı gör
                      </Link>
                    )}
                  </header>

                  <div className="sh-inbox-msgs">
                    {threadError && <p className="sh-auth-error">{threadError}</p>}
                    {!thread && !threadError && (
                      <p className="sh-inbox-muted">
                        <Loader2 size={16} className="sh-auth-spin" aria-hidden="true" /> Yükleniyor…
                      </p>
                    )}
                    {thread?.messages.map(m =>
                      m.senderType === 'SYSTEM' ? (
                        <p key={m.id} className="sh-inbox-sys">
                          {m.content}
                        </p>
                      ) : (
                        <div key={m.id} className={`sh-bubble${m.senderType === 'GUEST' ? ' is-me' : ''}`}>
                          {m.senderType === 'CAPTAIN' && <span className="sh-bubble-name">{m.senderName}</span>}
                          <p>{m.content}</p>
                          <time dateTime={m.createdAt}>{fmtStamp(m.createdAt)}</time>
                        </div>
                      ),
                    )}
                    {thread && thread.messages.length > 0 && thread.messages.every(m => m.senderType !== 'CAPTAIN') && (
                      <p className="sh-inbox-sys">Mesajın kaptana iletildi. Yanıt geldiğinde burada görünecek.</p>
                    )}
                    <div ref={endRef} />
                  </div>

                  <form
                    className="sh-inbox-compose"
                    onSubmit={e => {
                      e.preventDefault()
                      void send()
                    }}
                  >
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value.slice(0, 2000))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void send()
                        }
                      }}
                      rows={1}
                      placeholder="Mesaj yaz…"
                      aria-label="Mesaj yaz"
                    />
                    <button type="submit" className="sh-inbox-send" disabled={!text.trim() || sending} aria-label="Gönder">
                      {sending ? <Loader2 size={18} className="sh-auth-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
