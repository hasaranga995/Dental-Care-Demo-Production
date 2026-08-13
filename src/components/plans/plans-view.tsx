"use client";

import { useTransition } from "react";
import { Check, Crown, Headphones, ShieldCheck, Sparkles, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { selectDemoPlan } from "@/actions/demo-plan";
import { ToothLogo } from "@/components/tooth-logo";
import { CLINIC } from "@/lib/clinic-config";
import { DEMO_PLAN_CATALOG, type DemoPlanId } from "@/lib/demo-plan";
import { cn } from "@/lib/utils";

const BLUE = "#007acc";

function PlanCard({
  plan,
  onSelect,
  pending,
}: {
  plan: (typeof DEMO_PLAN_CATALOG)[number];
  onSelect: (id: DemoPlanId) => void;
  pending: boolean;
}) {
  const featured = plan.highlighted;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-3xl border bg-white p-6 text-neutral-900 sm:p-7",
        featured
          ? "border-white ring-2 ring-white shadow-[0_28px_60px_-24px_rgba(255,255,255,0.4)] lg:-translate-y-3"
          : "border-white/25"
      )}
    >
      {plan.badge ? (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase"
          style={{ backgroundColor: BLUE }}
        >
          {plan.badge}
        </span>
      ) : null}

      <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: BLUE }}>
        {plan.eyebrow}
      </p>
      <h2 className="mt-1 font-heading text-3xl font-semibold text-neutral-900">{plan.name}</h2>
      <p className="mt-2 min-h-16 text-sm leading-relaxed text-neutral-500">{plan.tagline}</p>

      <button
        type="button"
        disabled={pending}
        onClick={() => onSelect(plan.id)}
        className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: BLUE }}
      >
        {plan.cta}
      </button>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((item) => {
          const spotlight = item.spotlight;
          return (
            <li
              key={item.text}
              className={cn(
                "flex items-start gap-2.5 text-sm",
                spotlight && "-mx-1 rounded-xl px-2 py-2",
                spotlight === "vip" && "bg-[#007acc]/10 ring-1 ring-[#007acc]/25",
                spotlight === "ai" && "bg-sky-50 ring-1 ring-sky-200",
                spotlight === "whatsapp" && "bg-[#25D366]/10 ring-1 ring-[#25D366]/30"
              )}
            >
              {item.included ? (
                spotlight === "vip" ? (
                  <Crown className="mt-0.5 size-4 shrink-0" style={{ color: BLUE }} strokeWidth={2.25} />
                ) : spotlight === "ai" ? (
                  <Sparkles className="mt-0.5 size-4 shrink-0" style={{ color: BLUE }} strokeWidth={2.25} />
                ) : spotlight === "whatsapp" ? (
                  <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
                ) : (
                  <Check className="mt-0.5 size-4 shrink-0" style={{ color: BLUE }} strokeWidth={2.5} />
                )
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-neutral-400" strokeWidth={2.5} />
              )}
              <span
                className={cn(
                  "flex-1",
                  item.included ? "text-neutral-900" : "text-neutral-400 line-through",
                  spotlight && "font-semibold"
                )}
              >
                {item.text}
                {spotlight ? (
                  <span
                    className="ml-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase"
                    style={{ backgroundColor: BLUE }}
                  >
                    {spotlight === "vip" ? "VIP" : spotlight === "whatsapp" ? "AI Bot" : "AI"}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-4 border-t border-neutral-200 pt-5">
        <div>
          <p
            className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: BLUE }}
          >
            <Headphones className="size-3.5" />
            {plan.support.title}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-neutral-500">
            {plan.support.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full" style={{ backgroundColor: BLUE }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        {plan.backups ? (
          <div>
            <p
              className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
              style={{ color: BLUE }}
            >
              <ShieldCheck className="size-3.5" />
              {plan.backups.title}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-500">
              {plan.backups.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1 shrink-0 rounded-full" style={{ backgroundColor: BLUE }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PlansView() {
  const [pending, startTransition] = useTransition();

  function handleSelect(plan: DemoPlanId) {
    startTransition(async () => {
      await selectDemoPlan(plan);
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ backgroundColor: BLUE }}>
      <header className="relative border-b border-white/15" style={{ backgroundColor: BLUE }}>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4 sm:px-6">
          <ToothLogo className="size-7 text-white" />
          <div>
            <p className="font-heading text-base font-semibold text-white">{CLINIC.name}</p>
            <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
              Website plans · live demo
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-center font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Choose a subscription
        </h1>

        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-3">
          {DEMO_PLAN_CATALOG.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} pending={pending} />
          ))}
        </div>
      </main>
    </div>
  );
}
