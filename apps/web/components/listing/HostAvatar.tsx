import Image from 'next/image'

/** Kaptan fotoğrafı; yoksa adın baş harfiyle renkli daire. */
export default function HostAvatar({ name, src, size = 56 }: { name: string; src: string | null; size?: number }) {
  return (
    <span className="sh-host-ava" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }} aria-hidden="true">
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} /> : name.charAt(0).toLocaleUpperCase('tr')}
    </span>
  )
}
