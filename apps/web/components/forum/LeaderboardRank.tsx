import { Medal } from 'lucide-react'

const MEDAL_CLASS: Record<number, string> = {
  0: 'forum-medal--gold',
  1: 'forum-medal--silver',
  2: 'forum-medal--bronze',
}

/** İlk 3 sıra madalya; sonrası rakam. */
export default function LeaderboardRank({ index }: { index: number }) {
  if (index < 3) {
    return (
      <Medal
        className={`forum-medal ${MEDAL_CLASS[index] ?? ''}`}
        size={18}
        strokeWidth={2}
        aria-hidden
      />
    )
  }
  return (
    <span className="forum-contrib-rank-num" aria-hidden>
      {index + 1}
    </span>
  )
}
