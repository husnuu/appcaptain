"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";

type Broadcast = Awaited<ReturnType<typeof api.listBroadcasts>>["items"][number];

export default function NotificationsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState<"ALL" | "OWNER" | "RENTER">("ALL");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api
      .listBroadcasts({ limit: 20 })
      .then((r) => setHistory(r.items))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError("Konu ve mesaj zorunludur");
      return;
    }
    setSending(true);
    setError(null);
    api
      .sendBroadcast({ subject, message, targetRole })
      .then((r) => {
        setSent(`Gönderildi — ${r.recipientCount} alıcı`);
        setSubject("");
        setMessage("");
        return api.listBroadcasts({ limit: 20 });
      })
      .then((r) => setHistory(r.items))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Hata"))
      .finally(() => setSending(false));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Bildirimler / Duyurular</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Yeni Duyuru Gönder</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hedef Kitle</label>
          <select
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as "ALL" | "OWNER" | "RENTER")}
          >
            <option value="ALL">Tüm Kullanıcılar</option>
            <option value="OWNER">Sadece Tekne Sahipleri</option>
            <option value="RENTER">Sadece Kiracılar</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Konu</label>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Duyuru konusu"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mesaj</label>
          <textarea
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={5}
            placeholder="Duyuru metni..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {sent && <p className="text-green-600 text-sm">{sent}</p>}
        <button
          onClick={handleSend}
          disabled={sending}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">Gönderilen Duyurular</h2>
        </div>
        {loadingHistory ? (
          <p className="px-4 py-6 text-sm text-gray-400">Yükleniyor...</p>
        ) : history.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">Henüz duyuru gönderilmemiş</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {history.map((b) => {
              const meta = b.metadata as { subject?: string; targetRole?: string; recipientCount?: number } | null;
              return (
                <li key={b.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{meta?.subject ?? "—"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {meta?.targetRole} · {meta?.recipientCount ?? "?"} alıcı
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{b.admin.fullName}</p>
                      <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
