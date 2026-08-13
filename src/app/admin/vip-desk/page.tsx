import type { Metadata } from "next";
import {
  AddSubscriberForm,
  AlertLogTable,
  SubscriberTable,
  VipDeskSetupCard,
  type AlertLogRow,
  type SubscriberRow,
} from "@/components/admin/vip-desk-manager";
import { getWhatsAppBusinessNumber } from "@/lib/clinic-config";
import { listRecentVipAlerts } from "@/lib/vip/alerts";
import { formatPhoneDisplay } from "@/lib/vip/phone";
import { listStaffSubscribers } from "@/lib/vip/subscribers";
import { getStaffChannelStatus } from "@/lib/whatsapp/config";

export const metadata: Metadata = {
  title: "VIP Desk | Dental Care Admin",
};

export default async function AdminVipDeskPage() {
  const [subscribers, alerts] = await Promise.all([listStaffSubscribers(), listRecentVipAlerts(20)]);
  const staff = getStaffChannelStatus();

  const subscriberRows: SubscriberRow[] = subscribers.map((subscriber) => ({
    id: subscriber.id,
    name: subscriber.name,
    phone: subscriber.phone,
    phoneDisplay: formatPhoneDisplay(subscriber.phone),
    role: subscriber.role,
    isActive: subscriber.isActive,
    source: subscriber.source,
    optedInAt: subscriber.optedInAt.toISOString(),
    lastNotifiedAt: subscriber.lastNotifiedAt?.toISOString() ?? null,
  }));

  const alertRows: AlertLogRow[] = alerts.map((alert) => ({
    id: alert.id,
    patientName: alert.patientName,
    tier: alert.tier,
    bookingChannel: alert.bookingChannel,
    status: alert.status,
    recipientCount: alert.recipientCount,
    sentCount: alert.sentCount,
    failedCount: alert.failedCount,
    error: alert.error,
    createdAt: alert.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">VIP Desk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The back-office WhatsApp channel. Whenever a VIP books — through WhatsApp, the website, or
          reception — every subscribed staff phone gets an arrival brief with the patient&apos;s
          history and preferences.
        </p>
      </div>

      <VipDeskSetupCard
        joinCode={staff.joinCode}
        joinNumber={getWhatsAppBusinessNumber()}
        hasDedicatedNumber={staff.hasDedicatedNumber}
        hasTemplate={staff.hasTemplate}
      />

      <AddSubscriberForm />
      <SubscriberTable subscribers={subscriberRows} />
      <AlertLogTable alerts={alertRows} />
    </div>
  );
}
