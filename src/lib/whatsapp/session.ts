import "server-only";

import { getCached, setCached } from "@/lib/redis";
import type { WhatsAppChatMessage, WhatsAppSession } from "@/lib/whatsapp/types";

const SESSION_TTL_SECONDS = 60 * 60 * 6;
const MAX_MESSAGES = 24;
const MAX_SEEN_IDS = 40;

const memory = new Map<string, { session: WhatsAppSession; expiresAt: number }>();

function sessionKey(phone: string) {
  return `whatsapp:session:${phone.replace(/\D/g, "")}`;
}

function emptySession(): WhatsAppSession {
  return { messages: [], seenIds: [], pendingSend: null };
}

function pruneMemory() {
  const now = Date.now();
  for (const [key, value] of memory) {
    if (value.expiresAt <= now) memory.delete(key);
  }
}

export async function getWhatsAppSession(phone: string): Promise<WhatsAppSession> {
  const key = sessionKey(phone);
  const cached = await getCached<WhatsAppSession>(key);
  if (cached?.messages) return cached;

  pruneMemory();
  const local = memory.get(key);
  if (local && local.expiresAt > Date.now()) return local.session;
  return emptySession();
}

export async function saveWhatsAppSession(phone: string, session: WhatsAppSession): Promise<void> {
  const trimmed: WhatsAppSession = {
    messages: session.messages.slice(-MAX_MESSAGES),
    seenIds: session.seenIds.slice(-MAX_SEEN_IDS),
    pendingSend: session.pendingSend ?? null,
  };
  const key = sessionKey(phone);
  await setCached(key, trimmed, SESSION_TTL_SECONDS);
  memory.set(key, { session: trimmed, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 });
}

export async function clearWhatsAppSession(phone: string): Promise<void> {
  const key = sessionKey(phone);
  await setCached(key, emptySession(), 1);
  memory.delete(key);
}

export async function appendWhatsAppTurn(
  phone: string,
  userText: string,
  assistantText: string,
  messageId?: string
): Promise<WhatsAppChatMessage[]> {
  const session = await getWhatsAppSession(phone);
  const next: WhatsAppSession = {
    messages: [
      ...session.messages,
      { role: "user", content: userText },
      { role: "assistant", content: assistantText },
    ],
    seenIds: messageId ? [...session.seenIds, messageId] : session.seenIds,
  };
  await saveWhatsAppSession(phone, next);
  return next.messages;
}

export async function hasSeenWhatsAppMessage(phone: string, messageId: string): Promise<boolean> {
  const session = await getWhatsAppSession(phone);
  return session.seenIds.includes(messageId);
}

export async function markWhatsAppMessageSeen(phone: string, messageId: string): Promise<void> {
  const session = await getWhatsAppSession(phone);
  if (session.seenIds.includes(messageId)) return;
  await saveWhatsAppSession(phone, {
    ...session,
    seenIds: [...session.seenIds, messageId],
  });
}

export async function setPendingWhatsAppSend(
  phone: string,
  pendingSend: { messageId: string; text: string } | null
): Promise<void> {
  const session = await getWhatsAppSession(phone);
  await saveWhatsAppSession(phone, { ...session, pendingSend });
}

export async function getPendingWhatsAppSend(phone: string) {
  const session = await getWhatsAppSession(phone);
  return session.pendingSend ?? null;
}
