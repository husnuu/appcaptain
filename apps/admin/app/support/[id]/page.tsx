"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "../../../lib/api";

type Ticket = Awaited<ReturnType<typeof api.getTicket>>["ticket"];
type Template = Awaited<ReturnType<typeof api.listTemplates>>["templates"][number];

const STATUS_LABELS: Record<string, string> = { OPEN: "Açık", IN_PROGRESS: "İşlemde", RESOLVED: "Çözüldü", CLOSED: "Kapatıldı" };
const STATUS_COLORS: Record<string, string> = { OPEN: "bg-red-100 text-red-700", IN_PROGRESS: "bg-yellow-100 text-yellow-700", RESOLVED: "bg-emerald-100 text-emerald-700", CLOSED: "bg-gray-100 text-gray-500" };
const PRIORITY_LABELS: Record<string, string> = { LOW: "Düşük", NORMAL: "Normal", HIGH: "Yüksek", URGENT: "Acil" };
const PRIORITY_COLORS: Record<string, string> = { LOW: "text-gray-400", NORMAL: "text-gray-600", HIGH: "text-orange-600", URGENT: "text-red-600 font-semibold" };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply
  const [replyBody, setReplyBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [replyBusy, setReplyBusy] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<boolean | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Note
  const [noteBody, setNoteBody] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"reply" | "note">("reply");

  // Status / priority change
  const [busy, setBusy] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function load() {
    setLoading(true);
    Promise.all([api.getTicket(id), api.listTemplates()])
      .then(([d, t]) => { setTicket(d.ticket); setTemplates(t.templates); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticket?.messages.length]);

  async function handleStatusChange(newStatus: string) {
    setBusy("status");
    try {
      await api.updateTicket(id, { status: newStatus });
      load();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
    finally { setBusy(null); }
  }

  async function handlePriorityChange(newPriority: string) {
    setBusy("priority");
    try {
      await api.updateTicket(id, { priority: newPriority });
      load();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
    finally { setBusy(null); }
  }

  async function handleAssignMe() {
    setBusy("assign");
    try { await api.assignTicketToMe(id); load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
    finally { setBusy(null); }
  }

  async function handleReply() {
    if (!replyBody.trim()) return;
    setReplyBusy(true);
    try {
      const r = await api.replyTicket(id, replyBody, sendEmail);
      setLastEmailSent(r.emailSent);
      setReplyBody("");
      load();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
    finally { setReplyBusy(false); }
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    setNoteBusy(true);
    try {
      await api.addTicketNote(id, noteBody);
      setNoteBody("");
      load();
    } catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
    finally { setNoteBusy(false); }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Bu notu silmek istiyor musunuz?")) return;
    try { await api.deleteTicketNote(id, noteId); load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "Hata"); }
  }

  if (loading) return <p className="text-gray-400 text-sm">Yükleniyor…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!ticket) return null;

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/support" className="hover:text-brand-600">Destek</Link>
        <span>/</span>
        <span className="truncate text-gray-700 max-w-xs">{ticket.subject}</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
              <span className={`text-xs ${PRIORITY_COLORS[ticket.priority] ?? "text-gray-600"}`}>
                {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
              </span>
              <span className="text-xs text-gray-400">#{ticket.id.slice(-8)}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{ticket.subject}</h1>
            <div className="mt-1 text-xs text-gray-400">
              {ticket.guestName} · {ticket.guestEmail}
              {ticket.guestPhone && ` · ${ticket.guestPhone}`}
              {ticket.user && (
                <> · <Link href={`/users/guests/${ticket.user.id}`} className="text-brand-600 hover:underline">Hesap: {ticket.user.name}</Link></>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Oluşturuldu: {new Date(ticket.createdAt).toLocaleString("tr-TR")}
              {ticket.resolvedAt && ` · Çözüldü: ${new Date(ticket.resolvedAt).toLocaleString("tr-TR")}`}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2 flex-wrap justify-end">
              <select
                disabled={!!busy}
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select
                disabled={!!busy}
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>{ticket.assignedTo ? `Atanan: ${ticket.assignedTo.fullName}` : "Atanmamış"}</span>
              <button
                type="button"
                disabled={!!busy}
                onClick={handleAssignMe}
                className="rounded border border-gray-200 px-2 py-0.5 text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                Bana Al
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message thread */}
      <div className="space-y-3">
        {ticket.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.fromAdmin ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 shadow-sm ${msg.fromAdmin ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
              <div className={`text-xs mb-1 ${msg.fromAdmin ? "text-brand-200" : "text-gray-400"}`}>
                {msg.fromAdmin ? (msg.admin?.fullName ?? "Admin") : ticket.guestName}
                {" · "}{new Date(msg.createdAt).toLocaleString("tr-TR")}
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Internal notes */}
      {ticket.notes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">İç Notlar (Kullanıcı Görmez)</h3>
          {ticket.notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-yellow-600 mb-1">{note.admin.fullName} · {new Date(note.createdAt).toLocaleString("tr-TR")}</div>
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap">{note.body}</p>
                </div>
                <button type="button" onClick={() => handleDeleteNote(note.id)} className="shrink-0 text-yellow-400 hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply / Note composer */}
      {!isClosed && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => setActiveTab("reply")}
              className={`px-5 py-3 text-sm font-medium ${activeTab === "reply" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              Yanıtla
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("note")}
              className={`px-5 py-3 text-sm font-medium ${activeTab === "note" ? "border-b-2 border-yellow-500 text-yellow-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              İç Not
            </button>
          </div>

          <div className="p-4 space-y-3">
            {activeTab === "reply" ? (
              <>
                {/* Template picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplates((s) => !s)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {showTemplates ? "Şablonları Gizle ▲" : "Şablondan Seç ▼"}
                  </button>
                  {showTemplates && templates.length > 0 && (
                    <div className="absolute z-10 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => { setReplyBody(tpl.body); setShowTemplates(false); }}
                          className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        >
                          <div className="font-medium text-gray-800">{tpl.name}</div>
                          {tpl.category && <div className="text-xs text-gray-400">{tpl.category}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                  {showTemplates && templates.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">Henüz şablon eklenmemiş. <Link href="/support/templates" className="text-brand-600 hover:underline">Şablon Ekle</Link></p>
                  )}
                </div>

                <textarea
                  rows={5}
                  placeholder="Yanıtınızı yazın…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                />

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded" />
                    E-posta olarak da gönder
                  </label>
                  {lastEmailSent !== null && (
                    <span className={`text-xs ${lastEmailSent ? "text-emerald-600" : "text-gray-400"}`}>
                      {lastEmailSent ? "E-posta gönderildi" : "E-posta gönderilemedi (SMTP kurulu değil)"}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={replyBusy || !replyBody.trim()}
                    onClick={handleReply}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    Yanıtla
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  rows={4}
                  placeholder="İç not (yalnızca adminler görebilir)…"
                  className="w-full rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={noteBusy || !noteBody.trim()}
                    onClick={handleAddNote}
                    className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Not Ekle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isClosed && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-400 text-center">
          Bu talep kapatılmış. Yanıt vermek için önce durumu değiştirin.
        </div>
      )}
    </div>
  );
}
