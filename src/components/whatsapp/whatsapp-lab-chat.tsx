"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, SendHorizontal } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "I'd like to book a checkup",
  "What are your hours today?",
  "Do you do teeth whitening?",
  "Which doctors are available?",
] as const;

type ChatLine = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
};

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatWhatsAppMarkup(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export function WhatsAppLabChat() {
  const [from, setFrom] = useState("94771234567");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setInput("");
    setError(null);
    setLines((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: trimmed, time: nowLabel() },
    ]);
    setBusy(true);

    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, text: trimmed }),
      });
      const data = (await response.json()) as { reply?: string; error?: string | null };
      if (!response.ok) {
        throw new Error(data.error || "Could not reach the front desk.");
      }
      const reply = data.reply?.trim();
      if (reply) {
        setLines((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", text: reply, time: nowLabel() },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function resetChat() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, text: "", reset: true }),
      });
      setLines([]);
    } catch {
      setError("Could not reset the conversation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-[70dvh] w-full max-w-md flex-col bg-[#0b141a] text-white sm:max-w-lg lg:max-w-none lg:min-h-dvh">
      <header className="flex items-center gap-3 bg-[#075E54] px-3 py-2.5 shadow-md">
        <div className="grid size-10 place-items-center rounded-full bg-white/15">
          <WhatsAppIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{CLINIC.name}</p>
          <p className="text-[11px] text-white/80">{CLINIC.receptionistName} · Front desk · online</p>
        </div>
        <button
          type="button"
          onClick={resetChat}
          disabled={busy}
          className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          aria-label="Start a new conversation"
          title="New conversation"
        >
          <RotateCcw className="size-4" />
        </button>
      </header>

      <div className="flex items-center gap-2 border-b border-white/5 bg-[#0b141a] px-3 py-2 text-[11px] text-white/60">
        <span className="shrink-0">Test as</span>
        <input
          value={from}
          onChange={(event) => setFrom(event.target.value.replace(/\D/g, ""))}
          className="h-7 flex-1 rounded-md border border-white/10 bg-white/5 px-2 font-mono text-white outline-none focus:border-[#25D366]"
          inputMode="numeric"
          aria-label="Test WhatsApp number"
        />
      </div>

      <div
        className="relative flex-1 overflow-y-auto px-3 py-4"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {lines.length === 0 && (
          <div className="mx-auto mb-4 max-w-[85%] rounded-lg bg-[#182229] px-3 py-2 text-center text-[11px] leading-relaxed text-white/70">
            Same front-desk receptionist that will answer on WhatsApp. Bookings go into the hospital diary.
            Messages are not sent to Meta until Cloud API keys are added.
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {lines.map((line) => (
            <div
              key={line.id}
              className={cn("flex", line.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-lg px-2.5 py-1.5 text-[13.5px] leading-5 shadow-sm",
                  line.role === "user"
                    ? "rounded-tr-none bg-[#005c4b] text-white"
                    : "rounded-tl-none bg-[#202c33] text-[#e9edef]"
                )}
              >
                <p
                  dangerouslySetInnerHTML={{ __html: formatWhatsAppMarkup(line.text) }}
                />
                <p
                  className={cn(
                    "mt-0.5 text-right text-[10px]",
                    line.role === "user" ? "text-white/60" : "text-white/40"
                  )}
                >
                  {line.time}
                </p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2 text-white/70">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <p className="bg-[#2a1010] px-3 py-1.5 text-center text-xs text-red-200">{error}</p>
      )}

      {lines.length === 0 && (
        <div className="flex flex-wrap gap-1.5 bg-[#0b141a] px-3 pb-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              disabled={busy}
              className="rounded-full border border-[#25D366]/40 bg-transparent px-3 py-1 text-[12px] text-[#25D366] disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-end gap-2 bg-[#202c33] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder="Type a message"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-[#2a3942] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-white disabled:opacity-40"
          aria-label="Send"
        >
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </div>
  );
}
