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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-display text-ink">Merhaba, {displayName(name)} 👋</h1>
        <p className="mt-1 text-body text-gray-600">
          Teknelerini, rezervasyonlarını ve kazançlarını buradan yönet.
        </p>
      </div>
      <p className="mt-1 text-body-sm font-medium capitalize text-gray-500">{today}</p>
    </div>
  );
}
