import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { getActiveKnowledgeDoc } from "@/lib/data/knowledge";
import { buildChatSystemPrompt } from "@/lib/chat/knowledge";
import { createDentalChatTools } from "@/lib/chat/tools";
import { rateLimit } from "@/lib/redis";
import { ANONYMOUS_VIP_CONTEXT, resolvePatientIdentity } from "@/lib/vip/identity";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
    return Response.json(
      {
        error:
          "Chatbot is not configured yet. Add GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) to .env.local.",
      },
      { status: 503 }
    );
  }

  // @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY by default; accept GEMINI_API_KEY too.
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  const { userId } = await auth();
  const rateKey = `chat:${userId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
  const { success: withinLimit } = await rateLimit(rateKey, 30, 600);
  if (!withinLimit) {
    return Response.json(
      { error: "Too many chat messages. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const messages = body.messages as UIMessage[];

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const recentMessages = messages.slice(-24);
  const isSignedIn = Boolean(userId);

  // Only a Clerk session counts as a verified identity on the web. Anonymous
  // visitors never unlock VIP handling, so nobody can impersonate a VIP by
  // typing their phone number into the public chat box.
  const [activeDoc, vip] = await Promise.all([
    getActiveKnowledgeDoc(),
    userId ? resolvePatientIdentity({ clerkId: userId }) : Promise.resolve(ANONYMOUS_VIP_CONTEXT),
  ]);

  const tools = createDentalChatTools({ channel: "web", vip });

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildChatSystemPrompt(isSignedIn, activeDoc?.extractedText, vip),
    messages: await convertToModelMessages(recentMessages),
    tools,
    stopWhen: stepCountIs(8),
    temperature: 0.4,
  });

  return result.toUIMessageStreamResponse();
}
