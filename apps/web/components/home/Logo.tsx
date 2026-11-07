/**
 * Ahoy Boats logosu — "ahoy" büyük, altında "boats" (Uber Eats dizilimi).
 * Boyut `font-size` ile ölçeklenir; `tone="light"` koyu zeminler içindir.
 */
export function Logo({ className = '', tone = 'brand' }: { className?: string; tone?: 'brand' | 'light' }) {
  return (
    <span className={`sh-logo sh-logo--${tone} ${className}`} role="img" aria-label="Ahoy Boats">
      <span className="sh-logo-ahoy" aria-hidden="true">
        ahoy
      </span>
      <span className="sh-logo-boats" aria-hidden="true">
        boats
      </span>
    </span>
  )
}
