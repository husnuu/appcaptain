import type { ReactNode } from "react";

export function LegalTitle({ title, updated }: { title: string; updated?: string }) {
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mb-8 text-sm text-gray-400">
        Son güncelleme: {updated ?? "1 Temmuz 2026"}
      </p>
    </>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 border-b border-gray-100 pb-2 text-xl font-bold text-gray-900">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}
