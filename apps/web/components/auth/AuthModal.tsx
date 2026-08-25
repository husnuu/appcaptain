'use client'

import { useState } from 'react'
import { Mail, Lock, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup' | 'reset'

interface Props {
  initialMode?: 'signin' | 'signup'
  onClose: () => void
}

export default function AuthModal({ initialMode = 'signin', onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/hesabim` : undefined,
      })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      setSentMessage(
        `${email} adresine bir şifre sıfırlama bağlantısı gönderdik. Bağlantıya tıklayıp yeni şifrenizi belirleyin.`
      )
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      setSentMessage(
        `${email} adresine bir doğrulama bağlantısı gönderdik. Hesabınızı onaylamak için bağlantıya tıklayın.`
      )
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onClose()
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Kapat">
          <X size={18} />
        </button>

        {sentMessage ? (
          <div className="auth-modal-success">
            <h2 className="auth-modal-title">E-postanızı kontrol edin</h2>
            <p className="auth-modal-lede">{sentMessage}</p>
            <button type="button" className="auth-submit-btn" onClick={onClose}>
              Tamam
            </button>
          </div>
        ) : (
          <>
            <h2 className="auth-modal-title">
              {mode === 'signin' ? 'Giriş yap' : mode === 'signup' ? 'Hesap oluştur' : 'Şifreni sıfırla'}
            </h2>
            <p className="auth-modal-lede">
              {mode === 'signin'
                ? 'Rezervasyonlarınızı takip etmek için giriş yapın.'
                : mode === 'signup'
                  ? 'Ücretsiz hesap oluşturun ve rezervasyonlarınızı yönetin.'
                  : 'E-posta adresinize bir sıfırlama bağlantısı gönderelim.'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="auth-field">
                <Mail size={16} className="auth-field-icon" aria-hidden />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="E-posta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              {mode !== 'reset' ? (
                <label className="auth-field">
                  <Lock size={16} className="auth-field-icon" aria-hidden />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              ) : null}

              {mode === 'signin' ? (
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() => {
                    setMode('reset')
                    setError(null)
                  }}
                >
                  Şifremi unuttum
                </button>
              ) : null}

              {error ? <p className="auth-error">{error}</p> : null}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className="auth-spin" aria-hidden />
                ) : mode === 'signin' ? (
                  'Giriş yap'
                ) : mode === 'signup' ? (
                  'Hesap oluştur'
                ) : (
                  'Sıfırlama bağlantısı gönder'
                )}
              </button>
            </form>

            {mode === 'reset' ? (
              <button
                type="button"
                className="auth-toggle"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                }}
              >
                Giriş ekranına dön
              </button>
            ) : (
              <button
                type="button"
                className="auth-toggle"
                onClick={() => {
                  setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
                  setError(null)
                }}
              >
                {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
