export function WelcomeHeader({ name }: { name: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-display text-ink">Hello {name},</h1>
      <p className="mt-1 text-body text-gray-600">
        Teknelerini, rezervasyonlarını ve kazançlarını buradan yönet.
      </p>
    </div>
  );
}
