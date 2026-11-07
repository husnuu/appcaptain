"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationDetailDTO, MessageDTO } from "@getyourboat/shared";
import { Button, Skeleton } from "@getyourboat/ui";
import { AppShell } from "../../../components/layout/AppShell";
import { api, ApiError } from "../../../lib/api";
import { useMessagingSocket } from "../../../lib/hooks/useMessagingSocket";
import { MessageSenderType } from "@getyourboat/shared";

function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatContent({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<ConversationDetailDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { connected, joinConversation, leaveConversation, sendMessage, markRead, onNewMessage } =
    useMessagingSocket(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ conversation: detail }, page] = await Promise.all([
          api.getConversation(conversationId),
          api.getMessages(conversationId),
        ]);
        if (!active) return;
        setConversation(detail);
        setMessages(page.items.length > 0 ? page.items : detail.messages);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Sohbet yüklenemedi");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!connected) return;
    let cleanup: (() => void) | undefined;
    void joinConversation(conversationId).then((ok) => {
      if (!ok) return;
      cleanup = onNewMessage((message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });
    });
    return () => {
      cleanup?.();
      leaveConversation(conversationId);
    };
  }, [conversationId, connected, joinConversation, leaveConversation, onNewMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastCustomer = [...messages].reverse().find((m) => m.senderType === MessageSenderType.CUSTOMER);
    if (lastCustomer && !lastCustomer.readAt) {
      markRead(conversationId, lastCustomer.id);
    }
  }, [messages, conversationId, markRead]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      const message = connected
        ? await sendMessage(conversationId, body)
        : (await api.sendMessage(conversationId, body)).message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    } catch (err) {
      setDraft(body);
      setError(err instanceof Error ? err.message : "Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  }, [conversationId, connected, draft, sendMessage, sending]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !conversation) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-card border border-gray-200/70 bg-white shadow-card">
      <div className="border-b border-gray-200 px-4 py-3">
        <Link href="/messages" className="text-sm text-brand-600 hover:underline">
          ← Mesajlara dön
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          {conversation?.customerName ?? "Sohbet"}
        </h1>
        {conversation?.boatTitle ? (
          <p className="text-sm text-gray-500">{conversation.boatTitle}</p>
        ) : null}
        {!connected ? (
          <p className="mt-1 text-xs text-amber-600">Canlı bağlantı yok — REST yedek modu</p>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const mine = message.senderType === MessageSenderType.CAPTAIN;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-gray-500"}`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            placeholder="Mesajınızı yazın…"
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/15 focus:border-brand-400 bg-white"
          />
          <Button onClick={() => void handleSend()} disabled={sending || !draft.trim()}>
            Gönder
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;

  return (
    <AppShell active="messages">
      <ChatContent conversationId={conversationId} />
    </AppShell>
  );
}
