// Mobil alt menü için renkli, hafif üç boyutlu özgün ikonlar (SVG, gradyanlı).
// Her ikon kendi gradyan kimliklerini önekle kullanır; sayfada tek kez çizilirler.

type P = { size?: number }

export function CompassIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="mn-cmp-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE08A" />
          <stop offset="0.55" stopColor="#F2B441" />
          <stop offset="1" stopColor="#C97A1A" />
        </linearGradient>
        <radialGradient id="mn-cmp-face" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCE5F2" />
        </radialGradient>
        <linearGradient id="mn-cmp-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A6B" />
          <stop offset="1" stopColor="#E0362A" />
        </linearGradient>
        <linearGradient id="mn-cmp-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F78C9" />
          <stop offset="1" stopColor="#183D85" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44.5" rx="13" ry="2.2" fill="#0E2035" opacity="0.16" />
      <circle cx="24" cy="23" r="19" fill="url(#mn-cmp-rim)" />
      <circle cx="24" cy="23" r="15.5" fill="url(#mn-cmp-face)" />
      <g fill="#9AA8BF">
        <rect x="23.2" y="9.3" width="1.6" height="3" rx="0.8" />
        <rect x="23.2" y="33.7" width="1.6" height="3" rx="0.8" />
        <rect x="10.3" y="22.2" width="3" height="1.6" rx="0.8" />
        <rect x="34.7" y="22.2" width="3" height="1.6" rx="0.8" />
      </g>
      <g transform="rotate(35 24 23)">
        <path d="M24 10.5 L27.4 23 H20.6 Z" fill="url(#mn-cmp-red)" />
        <path d="M24 35.5 L20.6 23 H27.4 Z" fill="url(#mn-cmp-navy)" />
      </g>
      <circle cx="24" cy="23" r="2.3" fill="#FFFFFF" stroke="#C3CDDE" strokeWidth="0.8" />
      <path d="M10.5 16.5 A15 15 0 0 1 21 7.6" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function SailboatIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="mn-sb-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D5E0EF" />
        </linearGradient>
        <linearGradient id="mn-sb-jib" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E3EAF4" />
        </linearGradient>
        <linearGradient id="mn-sb-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3360BE" />
          <stop offset="1" stopColor="#14336F" />
        </linearGradient>
        <linearGradient id="mn-sb-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6ED3F5" />
          <stop offset="1" stopColor="#2A8CC4" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44.5" rx="15" ry="2" fill="#0E2035" opacity="0.14" />
      <path d="M5 38.5 Q9.5 35.5 14 38.5 T23 38.5 T32 38.5 T43 38.5 V43 Q24 45.5 5 43 Z" fill="url(#mn-sb-sea)" />
      <rect x="23.2" y="5.5" width="1.7" height="27" rx="0.85" fill="#8C5A2E" />
      <path d="M24 6 L29.5 7.6 L24 9.4 Z" fill="#F0503F" />
      <path d="M25.6 8.8 Q38 18 38.5 29.5 H25.6 Z" fill="url(#mn-sb-sail)" />
      <path d="M22.4 11.5 V29.5 H11.5 Q14.5 19 22.4 11.5 Z" fill="url(#mn-sb-jib)" />
      <path d="M25.6 8.8 Q38 18 38.5 29.5" stroke="#B9C7DB" strokeWidth="0.8" fill="none" />
      <path d="M8.5 31 H39.5 L35 38 Q24 39.6 13 38 Z" fill="url(#mn-sb-hull)" />
      <path d="M10.4 33.2 H37.6" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function UmbrellaIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="mn-um-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A73" />
          <stop offset="1" stopColor="#E23E30" />
        </linearGradient>
        <linearGradient id="mn-um-white" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D6DEE9" />
        </linearGradient>
        <linearGradient id="mn-um-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE7AE" />
          <stop offset="1" stopColor="#EFC064" />
        </linearGradient>
        <linearGradient id="mn-um-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="17" ry="3.6" fill="url(#mn-um-sand)" />
      <rect x="23.1" y="12" width="1.8" height="30" rx="0.9" fill="#9A6A3A" />
      <path d="M24 6 Q10 9 5 22 Q9.75 18.5 14.5 22 Z" fill="url(#mn-um-red)" />
      <path d="M24 6 L14.5 22 Q19.25 18.5 24 22 Z" fill="url(#mn-um-white)" />
      <path d="M24 6 L24 22 Q28.75 18.5 33.5 22 Z" fill="url(#mn-um-red)" />
      <path d="M24 6 Q38 9 43 22 Q38.25 18.5 33.5 22 Z" fill="url(#mn-um-white)" />
      <path d="M24 6 Q10 9 5 22 Q9.75 18.5 14.5 22 L24 6" fill="url(#mn-um-shine)" />
      <path d="M24 6 Q10 9 5 22 Q9.75 18.5 14.5 22 Q19.25 18.5 24 22 Q28.75 18.5 33.5 22 Q38.25 18.5 43 22 Q38 9 24 6 Z" fill="none" stroke="#B4402F" strokeOpacity="0.28" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="24" cy="5.6" r="1.9" fill="#FFC93C" />
      <ellipse cx="33" cy="42.6" rx="5" ry="1.2" fill="#0E2035" opacity="0.12" />
    </svg>
  )
}

export function CalendarIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="mn-cal-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E1E8F2" />
        </linearGradient>
        <linearGradient id="mn-cal-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7E66" />
          <stop offset="1" stopColor="#DC3426" />
        </linearGradient>
        <linearGradient id="mn-cal-ok" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FD6C2" />
          <stop offset="1" stopColor="#2E9B88" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44.5" rx="15" ry="2" fill="#0E2035" opacity="0.15" />
      <rect x="7" y="10" width="34" height="32" rx="7" fill="url(#mn-cal-paper)" />
      <path d="M14 10 H34 A7 7 0 0 1 41 17 V20 H7 V17 A7 7 0 0 1 14 10 Z" fill="url(#mn-cal-top)" />
      <rect x="14.5" y="5.5" width="3.4" height="9" rx="1.7" fill="#3B4659" />
      <rect x="30.1" y="5.5" width="3.4" height="9" rx="1.7" fill="#3B4659" />
      <circle cx="24" cy="30.5" r="7.5" fill="url(#mn-cal-ok)" />
      <path d="M20.4 30.7 L23 33.2 L27.8 28.2" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11 13.5 Q12.5 11.8 15 11.6" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function CaptainIcon({ size = 32 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="mn-cp-bg" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#EAF6FD" />
          <stop offset="1" stopColor="#B7DAF0" />
        </radialGradient>
        <radialGradient id="mn-cp-skin" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FFE0C4" />
          <stop offset="1" stopColor="#EFAE82" />
        </radialGradient>
        <linearGradient id="mn-cp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3E67BE" />
          <stop offset="1" stopColor="#163A80" />
        </linearGradient>
        <clipPath id="mn-cp-clip">
          <circle cx="24" cy="23" r="19" />
        </clipPath>
      </defs>
      <ellipse cx="24" cy="44.5" rx="13" ry="2" fill="#0E2035" opacity="0.15" />
      <circle cx="24" cy="23" r="19" fill="url(#mn-cp-bg)" />
      <g clipPath="url(#mn-cp-clip)">
        <path d="M8 44 Q9 31 24 30 Q39 31 40 44 Z" fill="url(#mn-cp-body)" />
        <path d="M21 30.4 L24 34.5 L27 30.4" fill="#FFFFFF" />
      </g>
      <circle cx="24" cy="21.5" r="7" fill="url(#mn-cp-skin)" />
      <path d="M15 15.6 Q15 10.2 24 10 Q33 10.2 33 15.6 Q24 13.4 15 15.6 Z" fill="#FFFFFF" />
      <path d="M15.2 15.4 Q24 13.2 32.8 15.4 L32.4 17.4 Q24 15.4 15.6 17.4 Z" fill="#163A80" />
      <path d="M16.2 17.2 Q24 15.8 31.8 17.2 Q30.5 19.3 24 18.8 Q17.5 19.3 16.2 17.2 Z" fill="#0E2035" opacity="0.85" />
      <circle cx="24" cy="13.2" r="1.5" fill="#F2B441" />
    </svg>
  )
}
