"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  PLAN_FEATURES,
  type DemoPlanId,
  type PlanFeatureKey,
  type PlanFeatures,
} from "@/lib/demo-plan";

type DemoPlanContextValue = {
  plan: DemoPlanId | null;
  features: PlanFeatures;
  has: (feature: PlanFeatureKey) => boolean;
};

const DemoPlanContext = createContext<DemoPlanContextValue>({
  plan: null,
  features: PLAN_FEATURES.presence,
  has: () => false,
});

export function DemoPlanProvider({
  plan,
  children,
}: {
  plan: DemoPlanId | null;
  children: ReactNode;
}) {
  const features = plan ? PLAN_FEATURES[plan] : PLAN_FEATURES.presence;
  const value: DemoPlanContextValue = {
    plan,
    features,
    has: (feature) => Boolean(plan) && features[feature],
  };

  return <DemoPlanContext.Provider value={value}>{children}</DemoPlanContext.Provider>;
}

export function useDemoPlan() {
  return useContext(DemoPlanContext);
}
