"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLINIC } from "@/lib/clinic-config";

type WhatsAppStatus = {
  configured: boolean;
  hasAccessToken: boolean;
  hasPhoneNumberId: boolean;
  hasAppSecret: boolean;
  hasBusinessNumber: boolean;
  businessNumber: string | null;
  verifyToken: string;
  webhookPath: string;
  graphVersion: string;
  callbackUrl: string | null;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2.5">
      <p className="text-[10px] font-semibold tracking-wide text-white/50 uppercase">{label}</p>
      <div className="mt-1 flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-[#d1f4e8]">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="grid size-7 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-3.5 text-[#25D366]" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[12px]">
      <span className={cn("size-1.5 rounded-full", ok ? "bg-[#25D366]" : "bg-white/25")} />
      <span className={ok ? "text-white/80" : "text-white/45"}>{label}</span>
    </li>
  );
}

export function MetaSetupPanel() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [wabaId, setWabaId] = useState("");
  const [subscribeBusy, setSubscribeBusy] = useState(false);
  const [subscribeNote, setSubscribeNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/whatsapp/status");
        const data = (await response.json()) as WhatsAppStatus;
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function subscribeWaba() {
    setSubscribeBusy(true);
    setSubscribeNote(null);
    try {
      const response = await fetch("/api/whatsapp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wabaId }),
      });
      const data = (await response.json()) as {
        error?: string;
        subscribeStatus?: number;
        apps?: { data?: Array<{ whatsapp_business_api_data?: { name?: string } }> };
      };
      if (!response.ok) {
        throw new Error(data.error || "Subscribe failed.");
      }
      const name = data.apps?.data?.[0]?.whatsapp_business_api_data?.name;
      setSubscribeNote(
        data.subscribeStatus === 200
          ? `Subscribed${name ? ` as ${name}` : ""}. Send Hi on WhatsApp again.`
          : `Meta returned ${data.subscribeStatus}. Check the WABA ID and try again.`
      );
    } catch (error) {
      setSubscribeNote(error instanceof Error ? error.message : "Subscribe failed.");
    } finally {
      setSubscribeBusy(false);
    }
  }

  if (!status) {
    return (
      <aside className="flex items-center gap-2 border-b border-white/10 bg-[#111b21] px-4 py-3 text-sm text-white/60 lg:w-[26rem] lg:border-r lg:border-b-0">
        <Loader2 className="size-4 animate-spin" />
        Checking Meta test number…
      </aside>
    );
  }

  return (
    <aside className="max-h-[42vh] overflow-y-auto border-b border-white/10 bg-[#111b21] px-4 py-4 text-white lg:max-h-none lg:w-[26rem] lg:shrink-0 lg:border-r lg:border-b-0 lg:py-5">
      <p className="text-[10px] font-semibold tracking-wider text-[#25D366] uppercase">
        Meta test number · free
      </p>
      <h1 className="mt-1 font-heading text-lg font-semibold">
        {status.configured ? "Ready for a real-phone demo" : "Connect the free test inbox"}
      </h1>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
        {status.configured
          ? `Message the test number from an allowed phone. ${CLINIC.receptionistName} answers on WhatsApp — no payment, max 5 tester numbers.`
          : "Create a free Meta app, paste 3 values into .env.local, then point the webhook at the URL below. No card required."}
      </p>

      <ul className="mt-3 space-y-1">
        <Flag ok={status.hasAccessToken} label="Access token" />
        <Flag ok={status.hasPhoneNumberId} label="Phone number ID" />
        <Flag ok={status.hasBusinessNumber} label="Display number (wa.me)" />
        <Flag ok={status.hasAppSecret} label="App secret (optional for demo)" />
      </ul>

      <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-[12.5px] leading-relaxed text-amber-50">
        <p className="font-semibold text-amber-200">No reply on your phone?</p>
        <p className="mt-1 text-white/75">
          Meta saved the webhook URL but is not forwarding your chats. Do both of these:
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-white/75">
          <li>
            App Dashboard → Dental-Care → WhatsApp →{" "}
            <span className="text-white">Configuration</span> → Webhook fields → turn{" "}
            <span className="text-white">messages</span> ON.
          </li>
          <li>
            API Setup → copy <span className="text-white">WhatsApp Business Account ID</span> and
            subscribe below.
          </li>
        </ol>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void subscribeWaba();
          }}
        >
          <input
            value={wabaId}
            onChange={(event) => setWabaId(event.target.value.replace(/\D/g, ""))}
            placeholder="WABA ID"
            className="h-8 flex-1 rounded-md border border-white/15 bg-black/30 px-2 font-mono text-[12px] text-white outline-none placeholder:text-white/35 focus:border-[#25D366]"
          />
          <button
            type="submit"
            disabled={subscribeBusy || !wabaId}
            className="h-8 rounded-md bg-[#25D366] px-2.5 text-[12px] font-semibold text-[#111b21] disabled:opacity-40"
          >
            {subscribeBusy ? "…" : "Subscribe"}
          </button>
        </form>
        {subscribeNote && <p className="mt-2 text-[12px] text-white/80">{subscribeNote}</p>}
      </div>

      <div className="mt-4 space-y-2">
        {status.callbackUrl && (
          <CopyRow label="Webhook callback URL" value={status.callbackUrl} />
        )}
        <CopyRow label="Verify token" value={status.verifyToken} />
      </div>

      <ol className="mt-4 list-decimal space-y-2 pl-4 text-[12.5px] leading-relaxed text-white/70">
        <li>
          Open{" "}
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#25D366] hover:underline"
          >
            Meta App Dashboard
            <ExternalLink className="size-3" />
          </a>{" "}
          → Create App → <span className="text-white/90">Connect with customers through WhatsApp</span>.
        </li>
        <li>
          WhatsApp → <span className="text-white/90">API Setup</span> → Generate access token. Copy
          token, Phone number ID, and the From number (digits only).
        </li>
        <li>
          Under <span className="text-white/90">To</span>, add your WhatsApp and the client’s WhatsApp
          (up to 5). They must accept the invite SMS/WhatsApp prompt.
        </li>
        <li>
          Paste into <code className="text-white/90">.env.local</code>:{" "}
          <span className="text-white/90">WHATSAPP_ACCESS_TOKEN</span>,{" "}
          <span className="text-white/90">WHATSAPP_PHONE_NUMBER_ID</span>,{" "}
          <span className="text-white/90">NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER</span>. Restart{" "}
          <code className="text-white/90">npm run dev</code>.
        </li>
        <li>
          API Setup / Configuration → Webhooks. Callback URL and verify token from above. Subscribe to{" "}
          <span className="text-white/90">messages</span>.
        </li>
        <li>
          On an allowed phone, open the test chat (or the site WhatsApp button) and say hi. Temporary
          tokens expire in ~24 hours — generate a fresh one before the meeting.
        </li>
      </ol>
    </aside>
  );
}
