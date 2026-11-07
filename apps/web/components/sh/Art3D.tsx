import Image from 'next/image'

/**
 * Renkli 3D ikon — Microsoft Fluent Emoji (MIT lisansı, bkz. public/icons/3d/LICENSE-fluentui-emoji.txt).
 * Dosyalar: public/icons/3d/<name>.webp
 */
export default function Art3D({ name, size = 48, className }: { name: string; size?: number; className?: string }) {
  return <Image className={className ? `sh-art ${className}` : 'sh-art'} src={`/icons/3d/${name}.webp`} alt="" width={size} height={size} />
}
