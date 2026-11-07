'use client'

import Image from 'next/image'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Gift, Loader2, MailCheck, ShieldCheck, X } from 'lucide-react'
import { IconBrandAppleFilled } from '@tabler/icons-react'
import { supabase } from '@/lib/supabase'

/**
 * Giriş / kayıt penceresi — e-posta ile devam akışı:
 *   1) e-posta → 2) şifre (giriş) veya yeni şifre (kayıt) → doğrulama e-postası.
 * Sosyal giriş butonları yalnızca Supabase'de açık olan sağlayıcılar için görünür.
 */

type Step = 'email' | 'signin' | 'signup' | 'reset'
type Provider = 'google' | 'facebook' | 'apple'

interface Props {
  initialMode?: 'signin' | 'signup'
  /** Başlık altındaki açıklama (ör. "Favorilerine eklemek için giriş yap"). */
  reason?: string
  onClose: () => void
  /** Giriş başarılı olunca (pencere kapanmadan hemen önce) çağrılır. */
  onSuccess?: () => void
}

const PROVIDER_LABEL: Record<Provider, string> = { google: 'Google', facebook: 'Facebook', apple: 'Apple' }

let providersCache: Provider[] | null = null
async function loadProviders(): Promise<Provider[]> {
  if (providersCache) return providersCache
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
    const ext = ((await res.json()) as { external?: Record<string, boolean> }).external ?? {}
    providersCache = (['google', 'facebook', 'apple'] as Provider[]).filter(p => ext[p] === true)
  } catch {
    providersCache = []
  }
  return providersCache
}

function trError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı. Bu e-postayla hesabın yoksa yeni hesap oluşturabilirsin.'
  if (m.includes('email not confirmed')) return 'E-posta adresin henüz doğrulanmadı. Gelen kutundaki bağlantıya tıkla.'
  if (m.includes('already registered')) return 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.'
  if (m.includes('at least 6')) return 'Şifre en az 6 karakter olmalı.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.'
  if (m.includes('provider is not enabled')) return 'Bu giriş yöntemi şu an kullanılamıyor.'
  return message
}

export default function AuthModal({ initialMode = 'signin', reason, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    void loadProviders().then(setProviders)
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const go = (next: Step) => {
    setStep(next)
    setError(null)
    setPassword('')
    setShowPw(false)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (step === 'email') {
      go(initialMode === 'signup' ? 'signup' : 'signin')
      return
    }

    setLoading(true)
    if (step === 'reset') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/hesabim`,
      })
      setLoading(false)
      if (err) return setError(trError(err.message))
      setSent(`${email} adresine bir şifre sıfırlama bağlantısı gönderdik. Bağlantıya tıklayıp yeni şifreni belirleyebilirsin.`)
      return
    }

    if (step === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } })
      setLoading(false)
      if (err) return setError(trError(err.message))
      setSent(`${email} adresine bir doğrulama bağlantısı gönderdik. Hesabını onaylamak için bağlantıya tıkla.`)
      return
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) return setError(trError(err.message))
    onSuccess?.()
    onClose()
  }

  async function oauth(provider: Provider) {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.href } })
    if (err) setError(trError(err.message))
  }

  if (!mounted) return null

  const title =
    step === 'email' ? 'Giriş yap veya kayıt ol' : step === 'signin' ? 'Giriş yap' : step === 'signup' ? 'Hesap oluştur' : 'Şifreni sıfırla'
  const lede =
    step === 'email'
      ? (reason ?? 'Rezervasyonlarını takip etmek, favorilerini kaydetmek ve cashback kazanmak için devam et.')
      : step === 'signin'
        ? 'Hesabının şifresini girerek devam et.'
        : step === 'signup'
          ? 'Ücretsiz hesabın için bir şifre belirle.'
          : 'E-posta adresine bir sıfırlama bağlantısı gönderelim.'

  return createPortal(
    <div className="sh-auth-overlay" onClick={onClose}>
      <div className="sh-auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={e => e.stopPropagation()}>
        <div className="sh-auth-main">
          <button type="button" className="sh-auth-x" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>

          {sent ? (
            <div className="sh-auth-sent">
              <span className="sh-auth-sent-ico">
                <MailCheck size={30} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h2 id="auth-title">E-postanı kontrol et</h2>
              <p>{sent}</p>
              <button type="button" className="sh-auth-submit" onClick={onClose}>
                Tamam
              </button>
            </div>
          ) : (
            <>
              {step !== 'email' && (
                <button type="button" className="sh-auth-back" onClick={() => go(step === 'reset' ? 'signin' : 'email')}>
                  <ArrowLeft size={18} aria-hidden="true" /> Geri
                </button>
              )}
              <h2 id="auth-title">{title}</h2>
              <p className="sh-auth-lede">{lede}</p>

              {step === 'email' && providers.length > 0 && (
                <>
                  <div className="sh-auth-social">
                    {providers.map(p => (
                      <button key={p} type="button" className="sh-auth-soc" onClick={() => oauth(p)}>
                        <ProviderIcon provider={p} />
                        {PROVIDER_LABEL[p]} ile devam et
                      </button>
                    ))}
                  </div>
                  <p className="sh-auth-or">
                    <span>veya</span>
                  </p>
                </>
              )}

              <form onSubmit={submit} className="sh-auth-form" noValidate={false}>
                {step === 'email' ? (
                  <input
                    className="sh-auth-input"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="E-posta adresin"
                    aria-label="E-posta adresin"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                ) : (
                  <p className="sh-auth-email">
                    <span>{email}</span>
                    <button type="button" onClick={() => go('email')}>
                      Değiştir
                    </button>
                  </p>
                )}

                {(step === 'signin' || step === 'signup') && (
                  <div className="sh-auth-pw">
                    <input
                      className="sh-auth-input"
                      type={showPw ? 'text' : 'password'}
                      required
                      autoFocus
                      minLength={6}
                      autoComplete={step === 'signin' ? 'current-password' : 'new-password'}
                      placeholder={step === 'signin' ? 'Şifren' : 'Yeni şifre (en az 6 karakter)'}
                      aria-label="Şifre"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}

                {step === 'signin' && (
                  <button type="button" className="sh-auth-link sh-auth-forgot" onClick={() => go('reset')}>
                    Şifremi unuttum
                  </button>
                )}

                {error && <p className="sh-auth-error">{error}</p>}

                <button type="submit" className="sh-auth-submit" disabled={loading}>
                  {loading ? (
                    <Loader2 size={18} className="sh-auth-spin" aria-hidden="true" />
                  ) : step === 'email' ? (
                    <>
                      Devam et <ArrowRight size={18} aria-hidden="true" />
                    </>
                  ) : step === 'signin' ? (
                    'Giriş yap'
                  ) : step === 'signup' ? (
                    'Hesap oluştur'
                  ) : (
                    'Sıfırlama bağlantısı gönder'
                  )}
                </button>
              </form>

              {step === 'signin' && (
                <p className="sh-auth-switch">
                  Ahoy’da yeni misin?{' '}
                  <button type="button" className="sh-auth-link" onClick={() => go('signup')}>
                    Hesap oluştur
                  </button>
                </p>
              )}
              {step === 'signup' && (
                <p className="sh-auth-switch">
                  Zaten hesabın var mı?{' '}
                  <button type="button" className="sh-auth-link" onClick={() => go('signin')}>
                    Giriş yap
                  </button>
                </p>
              )}

              <p className="sh-auth-terms">Devam ederek Ahoy Kullanım Koşulları’nı ve Gizlilik Politikası’nı kabul etmiş olursun.</p>
            </>
          )}
        </div>

        <div className="sh-auth-media" aria-hidden="true">
          {/* Fotoğraf: Unsplash, "a white boat with people on it in the water" (eWLlu8-KEAA) — Unsplash Lisansı */}
          <Image src="/home/auth-boat.webp" alt="" fill sizes="460px" />
          <div className="sh-auth-perks">
            <p>
              <Gift size={20} strokeWidth={1.8} />
              <span>
                <b>%15’e varan cashback</b>
                <small>Her onaylı rezervasyonda bakiyene eklenir</small>
              </span>
            </p>
            <p>
              <ShieldCheck size={20} strokeWidth={1.8} />
              <span>
                <b>Doğrulanmış kaptanlar</b>
                <small>Sigortalı tekneler ve 7/24 destek</small>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'apple') return <IconBrandAppleFilled size={22} aria-hidden="true" />
  if (provider === 'facebook')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path d="M15.1 12.6l.4-2.7h-2.6V8.2c0-.7.4-1.5 1.5-1.5h1.2V4.4s-1.1-.2-2.1-.2c-2.1 0-3.5 1.3-3.5 3.6v2.1H7.7v2.7H10V19h2.9v-6.4h2.2z" fill="#fff" />
      </svg>
    )
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" fill="#4285F4" />
      <path d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8C3.9 20.5 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.8z" fill="#FBBC05" />
      <path d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 7l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" fill="#EA4335" />
    </svg>
  )
}
