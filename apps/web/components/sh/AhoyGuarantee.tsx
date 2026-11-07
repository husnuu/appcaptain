import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

/**
 * "Ahoy güvence" kutusu — ilan ve tekne kiralama sayfalarında kullanılan
 * sade, ortalanmış bilgi kutusu (marka yazısı + tek satır açıklama).
 */
export default function AhoyGuarantee({ className }: { className?: string }) {
  return (
    <div className={className ? `sh-ag ${className}` : 'sh-ag'}>
      <p className="sh-ag-mark">
        <ShieldCheck size={36} strokeWidth={2.1} aria-hidden="true" />
        <span className="sh-ag-ahoy">ahoy</span>
        <span className="sh-ag-word">güvence</span>
      </p>
      <p className="sh-ag-text">
        Doğrulanmış kaptanlar, sigortalı tekneler ve 7/24 destekle güvenle rezervasyon yapıyorsun.{' '}
        <Link href="/#neden-ahoy">Daha fazla bilgi al</Link>
      </p>
    </div>
  )
}
