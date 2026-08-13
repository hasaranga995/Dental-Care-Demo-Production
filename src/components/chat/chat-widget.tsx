"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock3,
  Loader2,
  SendHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToothLogo } from "@/components/tooth-logo";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { CLINIC, getWhatsAppHref } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const GUEST_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&h=160&q=80";

const WHATSAPP_ESCALATION_MESSAGE =
  "Hi Dental Care! I'd like to continue with the front desk on WhatsApp.";

const SUGGESTIONS = [
  "What are your clinic hours today?",
  "Which services do you offer?",
  "Check availability for a cleaning this week",
  "Help me book an appointment",
] as const;

type MessagePart = {
  type: string;
  text?: string;
  output?: unknown;
  state?: string;
};

function getMessageText(parts: MessagePart[]): string {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text!)
    .join("");
}

function getWhatsAppHandoffUrl(parts: MessagePart[]): string | null {
  for (const part of parts) {
    if (!part.type.includes("handoffToWhatsApp")) continue;
    const output = part.output;
    if (
      output &&
      typeof output === "object" &&
      "whatsappUrl" in output &&
      typeof (output as { whatsappUrl: unknown }).whatsappUrl === "string"
    ) {
      return (output as { whatsappUrl: string }).whatsappUrl;
    }
  }
  return null;
}

function hasToolsInProgress(parts: MessagePart[]): boolean {
  return parts.some((part) => {
    if (!part.type.startsWith("tool-")) return false;
    if (part.state === "output-available" || part.state === "output-error") return false;
    if (part.output != null) return false;
    return true;
  });
}

function ChatMarkdown({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className={cn("font-semibold", isUser ? "text-primary-foreground" : "text-foreground")}>
            {children}
          </strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-medium underline underline-offset-2",
              isUser ? "text-primary-foreground" : "text-brand-teal"
            )}
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function FrontDeskAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal ring-2 ring-white shadow-sm",
        className
      )}
      aria-hidden
    >
      <ToothLogo className="size-5" />
    </div>
  );
}

function UserChatAvatar({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground ring-2 ring-white shadow-sm"
      aria-hidden
    >
      <UserRound className="size-4" />
    </div>
  );
}

function WhatsAppEscalationPill({ className }: { className?: string }) {
  return (
    <a
      href={getWhatsAppHref(WHATSAPP_ESCALATION_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/35 bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/15",
        className
      )}
    >
      <WhatsAppIcon className="size-3.5 shrink-0" />
      <span>Prefer WhatsApp? Click Here</span>
      <ArrowUpRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

/**
 * Unified front-desk launcher — web reception chat + WhatsApp escalation.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const openedHandoffs = useRef<Set<string>>(new Set());
  const { user, isSignedIn } = useUser();

  const userAvatar = isSignedIn ? user?.imageUrl || GUEST_AVATAR : GUEST_AVATAR;
  const userName = isSignedIn ? user?.fullName || user?.firstName || "You" : "You";

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        credentials: "include",
      }),
    []
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, status]);

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      const url = getWhatsAppHandoffUrl(message.parts as MessagePart[]);
      if (!url || openedHandoffs.current.has(message.id)) continue;
      openedHandoffs.current.add(message.id);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [messages]);

  async function handleSubmit(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    await sendMessage({ text });
  }

  async function sendSuggestion(text: string) {
    if (isBusy) return;
    await sendMessage({ text });
  }

  // Staff consoles have action buttons in the same corner as this launcher.
  if (
    pathname?.startsWith("/whatsapp-lab") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/doctor-portal")
  ) {
    return null;
  }

  return (
    <div className="fixed right-3 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:right-6 sm:bottom-6 sm:max-w-none">
      {open && (
        <div
          className="flex h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/20"
          role="dialog"
          aria-label={`${CLINIC.name} front desk chat`}
        >
          <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#0D4F5C] to-[#1A7A84] px-4 py-3 text-white">
            <div className="flex items-start gap-3">
              <div className="relative mt-0.5">
                <span className="grid size-10 place-items-center rounded-full bg-white/15 text-brand-teal ring-2 ring-white/25">
                  <ToothLogo className="size-6" />
                </span>
                <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0D4F5C]" />
              </div>
              <div>
                <p className="font-heading text-base font-semibold">Dental Care Reception</p>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                  Online · Instant booking &amp; inquiries
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close front desk chat"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <WhatsAppEscalationPill />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background px-3 pt-4 pb-4 scrollbar-thin scrollbar-thumb-teal-200/60 hover:scrollbar-thumb-teal-300">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <FrontDeskAvatar />
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-secondary px-3.5 py-3 text-sm text-foreground">
                    Hello! I&apos;m {CLINIC.receptionistName} from the {CLINIC.name} front desk. I can help with
                    hours, treatments, availability, and booking — how may I assist you today?
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-11">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendSuggestion(suggestion)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:border-brand-teal/40 hover:bg-accent"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pl-11 pt-1">
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-primary"
                  >
                    <CalendarCheck className="size-3.5" />
                    Full booking page
                  </Link>
                  <Link
                    href="/faq"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-primary"
                  >
                    <Clock3 className="size-3.5" />
                    FAQ help center
                  </Link>
                </div>
              </div>
            )}

            {messages.map((message) => {
              const parts = message.parts as MessagePart[];
              const text = getMessageText(parts);
              const isUser = message.role === "user";
              const toolsRunning = !isUser && hasToolsInProgress(parts);
              const handoffUrl = !isUser ? getWhatsAppHandoffUrl(parts) : null;
              if (!text && !toolsRunning && !handoffUrl) return null;

              return (
                <div key={message.id} className="space-y-2">
                  <div
                    className={cn(
                      "flex items-end gap-2",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {isUser ? (
                      <UserChatAvatar src={userAvatar} alt={userName} />
                    ) : (
                      <FrontDeskAvatar />
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        isUser
                          ? "rounded-tr-md bg-primary text-primary-foreground"
                          : "rounded-tl-md bg-secondary text-foreground"
                      )}
                    >
                      {toolsRunning && !text && (
                        <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-brand-teal uppercase">
                          <Loader2 className="size-3 animate-spin" />
                          Checking the diary…
                        </p>
                      )}
                      {text ? (
                        isUser ? (
                          <p className="whitespace-pre-wrap">{text}</p>
                        ) : (
                          <ChatMarkdown text={text} isUser={false} />
                        )
                      ) : null}
                    </div>
                  </div>

                  {handoffUrl && (
                    <div className="pl-11">
                      <a
                        href={handoffUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                      >
                        <WhatsAppIcon className="size-4" />
                        Continue on WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              );
            })}

            {isBusy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-end gap-2">
                <FrontDeskAvatar />
                <div className="rounded-2xl rounded-tl-md bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin text-brand-teal" />
                    {CLINIC.receptionistName} is typing…
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <p>
                  {error.message || "Something went wrong. Please try again."}
                  <button
                    type="button"
                    className="ml-2 font-semibold underline"
                    onClick={() => setMessages([])}
                  >
                    Reset chat
                  </button>
                </p>
                <a
                  href={getWhatsAppHref(WHATSAPP_ESCALATION_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex font-semibold text-[#128C7E] underline"
                >
                  Message Us on WhatsApp
                </a>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                rows={1}
                placeholder="Ask about hours, services, or booking…"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-brand-teal focus-visible:ring-3 focus-visible:ring-brand-teal/25"
              />
              <Button
                type="submit"
                size="icon"
                variant="accent"
                disabled={isBusy || !input.trim()}
                aria-label="Send message"
                className="size-11 shrink-0 rounded-xl"
              >
                {isBusy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
              </Button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close front desk chat" : "Open front desk chat"}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-brand-teal/35 bg-brand-navy py-2.5 pr-5 pl-2.5 text-sm font-semibold text-white shadow-xl transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-brand-teal/50 hover:shadow-brand-teal/15",
          "focus-visible:ring-3 focus-visible:ring-brand-teal/40 focus-visible:outline-none"
        )}
      >
        {open ? (
          <X className="mx-1.5 size-5" />
        ) : (
          <span className="relative">
            <span className="grid size-8 place-items-center rounded-full bg-brand-teal/20 text-brand-teal ring-2 ring-brand-teal/40">
              <ToothLogo className="size-5" />
            </span>
            <span className="absolute right-0 bottom-0 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-navy" />
            </span>
          </span>
        )}
        {open ? "Close" : "Front Desk"}
      </button>
    </div>
  );
}
