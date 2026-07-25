"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Template = Awaited<ReturnType<typeof api.listNotificationTemplates>>["templates"][number];

const TARGET_GROUPS = [
  { value: "CAPTAIN", label: "Tüm Kaptanlar / Tekne Sahipleri", description: "Profile tablosundaki tüm kullanıcılar" },
  { value: "OWNER", label: "Sadece Tekne Sahipleri (OWNER)", description: "Rolü OWNER olan profiller" },
  { value: "GUEST", label: "Sadece Misafirler", description: "Kayıtlı misafir kullanıcılar (User tablosu)" },
  { value: "ALL", label: "Tüm Kullanıcılar", description: "Kaptanlar + misafirler birlikte" },
];

const CHANNELS = [
  { value: "EMAIL", label: "E-posta", icon: "✉️", available: true },
  { value: "PUSH", label: "Push Bildirimi", icon: "🔔", available: false },
  { value: "SMS", label: "SMS", icon: "💬", available: false },
];

const TYPE_LABELS: Record<string, string> = {
  CUSTOM: "Özel",
  APPROVAL: "Onay",
  REJECTION: "Red",
  REMINDER: "Hatırlatma",
  CAMPAIGN: "Kampanya",
};

export default function NotificationsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("CAPTAIN");
  const [channel, setChannel] = useState("EMAIL");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ campaignId: string; count: number; subject: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listNotificationTemplates().then((d) => setTemplates(d.templates)).catch(() => {});
  }, []);

  useEffect(() => {
    setRecipientCount(null);
    setCountLoading(true);
    api.getRecipientCount(targetGroup)
      .then((d) => setRecipientCount(d.count))
      .catch(() => setRecipientCount(null))
      .finally(() => setCountLoading(false));
  }, [targetGroup]);

  function applyTemplate(tpl: Template) {
    setSubject(tpl.subject);
    setMessage(tpl.body);
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) { setError("Konu ve mesaj zorunludur."); return; }
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.sendBroadcast({ subject, message, targetGroup, channel });
      setResult({ campaignId: r.campaignId, count: r.recipientCount, subject: r.subject });
      setSubject("");
      setMessage("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Hata oluştu");
    } finally {
      setSending(false);
    }
  }

  const groupedTemplates = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const key = t.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bildirim Gönder</h1>
        <Link href="/notifications/templates" className="text-sm text-brand-600 hover:underline">Şablonları Yönet →</Link>
      </div>

      {/* Channel selector */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Kanal</p>
        <div className="flex gap-2 flex-wrap">
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              type="button"
              disabled={!ch.available}
              onClick={() => setChannel(ch.value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                channel === ch.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : ch.available
                  ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                  : "border-gray-100 text-gray-300"
              }`}
            >
              <span>{ch.icon}</span>
              {ch.label}
              {!ch.available && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">Yakında</span>
              )}
            </button>
          ))}
        </div>
        {channel !== "EMAIL" && (
          <p className="mt-2 text-xs text-yellow-600">Bu kanal henüz aktif değil — gönderim yapılmaz.</p>
        )}
      </div>

      {/* Target group */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Hedef Kitle</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TARGET_GROUPS.map((tg) => (
            <button
              key={tg.value}
              type="button"
              onClick={() => setTargetGroup(tg.value)}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                targetGroup === tg.value
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{tg.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{tg.description}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {countLoading ? "Sayılıyor…" : recipientCount !== null ? (
            <><span className="font-semibold text-gray-700">{recipientCount}</span> alıcı bulundu</>
          ) : ""}
        </p>
      </div>

      {/* Template picker */}
      {templates.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Şablondan Başla</p>
          <div className="space-y-2">
            {Object.entries(groupedTemplates).map(([type, items]) => (
              <div key={type}>
                <p className="text-xs text-gray-400 mb-1">{TYPE_LABELS[type] ?? type}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:border-brand-300"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compose */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-700">Mesaj İçeriği</p>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Konu *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="E-posta konusu"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mesaj *</label>
          <textarea
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesaj metni… (satır sonları korunur)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">{message.length} karakter</p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {result && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">Kampanya oluşturuldu — gönderim başladı</p>
            <p className="text-xs text-emerald-600 mt-0.5">{result.count} alıcıya &quot;{result.subject}&quot; gönderiliyor.</p>
            <Link href="/notifications/history" className="mt-1 block text-xs text-brand-600 hover:underline">Geçmişte görüntüle →</Link>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {channel === "EMAIL" && recipientCount !== null && (
              <>{recipientCount} e-posta gönderilecek</>
            )}
          </p>
          <button
            type="button"
            disabled={sending || !subject.trim() || !message.trim()}
            onClick={handleSend}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
