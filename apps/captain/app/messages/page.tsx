"use client";

import { useEffect, useRef, useState } from "react";
import {
  FontAwesomeIcon,
  faAnchor,
  faChevronLeft,
  faClock,
  faComments,
  faMagnifyingGlass,
  faPaperPlane,
} from "@getyourboat/ui";
import {
  BOOKING_STATUS_LABELS,
  GuestSenderType,
  type BookingStatus,
  type GuestConversationDTO,
  type GuestMessageDTO,
} from "@getyourboat/shared";
import { AppShell } from "../../components/layout/AppShell";
import { api, ApiError } from "../../lib/api";

const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-100 text-blue-700",
};

function statusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))} dk`;
  if (diff < 86_400_000)
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function MessagesContent() {
  const [conversations, setConversations] = useState<GuestConversationDTO[]>([]);
  const [selected, setSelected] = useState<GuestConversationDTO | null>(null);
  const [messages, setMessages] = useState<GuestMessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const data = await api.listGuestConversations();
      setConversations(data.conversations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mesajlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  const openConversation = async (conv: GuestConversationDTO) => {
    setSelected(conv);
    setShowChat(true);
    setConversations((cs) =>
      cs.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    try {
      const data = await api.getGuestMessages(conv.id);
      setMessages(data.messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch {
      setMessages([]);
    }
  };

  const send = async () => {
    const content = input.trim();
    if (!selected || !content) return;
    setSending(true);
    setInput("");
    const temp: GuestMessageDTO = {
      id: `temp-${Date.now()}`,
      conversationId: selected.id,
      senderType: GuestSenderType.CAPTAIN,
      senderName: "Siz",
      content,
      attachmentUrl: null,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, temp]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    try {
      const data = await api.sendGuestMessage(selected.id, content);
      setMessages((m) => m.map((msg) => (msg.id === temp.id ? data.message : msg)));
      setConversations((cs) =>
        cs.map((c) =>
          c.id === selected.id
            ? { ...c, lastMessage: content, lastAt: new Date().toISOString() }
            : c
        )
      );
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== temp.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.guestName.toLowerCase().includes(q) ||
      (c.boat?.name.toLowerCase().includes(q) ?? false) ||
      (c.lastMessage?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Left: conversation list */}
      <div
        className={`flex w-full flex-col border-r border-gray-100 md:w-80 lg:w-96 ${selected && showChat ? "hidden md:flex" : "flex"}`}
      >
        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-red-600">{error}</p>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <FontAwesomeIcon icon={faAnchor} className="text-gray-400" aria-hidden />
              </div>
              <p className="text-sm text-gray-500">Henüz mesaj yok</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 ${selected?.id === conv.id ? "border-l-2 border-brand-500 bg-brand-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-primary-600 text-sm font-bold text-white">
                    {initials(conv.guestName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}
                      >
                        {conv.guestName}
                      </p>
                      <span className="ml-2 flex-shrink-0 text-[10px] text-gray-400">
                        {formatTime(conv.lastAt)}
                      </span>
                    </div>
                    {conv.boat && (
                      <p className="mb-0.5 truncate text-[10px] font-semibold text-brand-600">
                        {conv.boat.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-gray-400">
                        {conv.lastMessage ?? "Konuşma başladı"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.booking && (
                      <span
                        className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${BOOKING_STATUS_COLOR[conv.booking.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {statusLabel(conv.booking.status)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: thread */}
      <div className={`flex-1 flex-col ${selected && showChat ? "flex" : "hidden md:flex"}`}>
        {!selected ? (
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                <FontAwesomeIcon icon={faComments} className="text-2xl text-brand-500" aria-hidden />
              </div>
              <p className="font-medium text-gray-500">Bir konuşma seç</p>
              <p className="mt-1 text-sm text-gray-400">Misafirlerinle iletişime geç</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-4">
              <button
                onClick={() => setShowChat(false)}
                className="rounded-lg p-1 hover:bg-gray-100 md:hidden"
                aria-label="Geri"
              >
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-primary-600 text-sm font-bold text-white">
                {initials(selected.guestName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{selected.guestName}</p>
                <p className="truncate text-xs text-gray-400">{selected.guestEmail}</p>
              </div>
            </div>

            {selected.booking && (
              <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50 px-5 py-2">
                <FontAwesomeIcon icon={faClock} className="text-xs text-brand-600" aria-hidden />
                <span className="text-xs text-brand-700">
                  {selected.boat?.name ? `${selected.boat.name} · ` : ""}
                  {new Date(selected.booking.startDate).toLocaleDateString("tr-TR")} –{" "}
                  {new Date(selected.booking.endDate).toLocaleDateString("tr-TR")}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${BOOKING_STATUS_COLOR[selected.booking.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {statusLabel(selected.booking.status)}
                </span>
              </div>
            )}

            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
              {messages.map((msg) => {
                const isCapt = msg.senderType === GuestSenderType.CAPTAIN;
                if (msg.senderType === GuestSenderType.SYSTEM) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">
                        {msg.content}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`flex ${isCapt ? "justify-end" : "justify-start"}`}>
                    {!isCapt && (
                      <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center self-end rounded-full bg-gradient-to-br from-brand-500 to-primary-600 text-[10px] font-bold text-white">
                        {initials(msg.senderName)}
                      </div>
                    )}
                    <div className={`flex max-w-[72%] flex-col ${isCapt ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isCapt ? "rounded-br-sm bg-brand-500 text-white" : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"}`}
                      >
                        {msg.content}
                      </div>
                      <span className="mt-1 text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors focus-within:border-brand-500">
                  <textarea
                    rows={1}
                    placeholder="Mesaj yaz..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    className="max-h-[120px] w-full resize-none bg-transparent text-sm text-gray-800 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => void send()}
                  disabled={!input.trim() || sending}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700 disabled:opacity-40"
                  aria-label="Gönder"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="text-sm" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AppShell active="messages">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mesajlar</h1>
        <p className="mt-1 text-sm text-gray-600">
          Rezervasyon taleplerinden gelen misafir mesajları
        </p>
      </div>
      <MessagesContent />
    </AppShell>
  );
}
