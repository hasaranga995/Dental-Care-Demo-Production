export interface WhatsAppChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WhatsAppSession {
  messages: WhatsAppChatMessage[];
  seenIds: string[];
  pendingSend?: { messageId: string; text: string } | null;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
}

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string };
        messages?: WhatsAppIncomingMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
}
