import type { Metadata } from "next";
import { MetaSetupPanel } from "@/components/whatsapp/meta-setup-panel";
import { WhatsAppLabChat } from "@/components/whatsapp/whatsapp-lab-chat";
import { CLINIC } from "@/lib/clinic-config";

export const metadata: Metadata = {
  title: `WhatsApp Front Desk | ${CLINIC.name}`,
  robots: { index: false, follow: false },
};

export default function WhatsAppLabPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0b141a] lg:flex-row">
      <MetaSetupPanel />
      <div className="min-h-[70dvh] flex-1 lg:min-h-dvh">
        <WhatsAppLabChat />
      </div>
    </div>
  );
}
