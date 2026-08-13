"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/chat/chat-widget";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";

export function SiteChatWidget() {
  const pathname = usePathname();
  const { has } = useDemoPlan();

  if (pathname.startsWith("/plans")) return null;
  if (!has("ai")) return null;
  return <ChatWidget />;
}
