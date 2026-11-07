import Link from "next/link";
import { FontAwesomeIcon, faCalendarDays, faShip } from "@getyourboat/ui";

const DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function displayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Kaptan";
  const first = trimmed.split(/[\s.@_-]+/)[0] ?? trimmed;
  return first.charAt(0).toLocaleUpperCase("tr-TR") + first.slice(1);
}

export function WelcomeHeader({ name }: { name: string }) {
  const today = DATE_FORMATTER.format(new Date());

  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[13px] font-semibold capitalize text-accent-600">{today}</p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">
          Merhaba, {displayName(name)}
        </h1>
        <p className="mt-1 text-[15px] text-gray-500">
          Teknelerini, rezervasyonlarını ve kazançlarını buradan yönet.
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" aria-hidden />
          Takvim
        </Link>
        <Link
          href="/boats"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <FontAwesomeIcon icon={faShip} className="text-[13px]" aria-hidden />
          Teknelerim
        </Link>
      </div>
    </header>
  );
}
