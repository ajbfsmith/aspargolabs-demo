"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseInboundFromSearchParams,
  saveInboundAttribution,
} from "@/lib/attribution/inbound-params";

function AttributionLandingSetupInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const inbound = parseInboundFromSearchParams(searchParams);
    if (inbound) {
      saveInboundAttribution(inbound);
      window.dispatchEvent(new Event("aspargo-attribution-updated"));
    }
  }, [searchParams]);

  return null;
}

export function AttributionLandingSetup() {
  return (
    <Suspense fallback={null}>
      <AttributionLandingSetupInner />
    </Suspense>
  );
}
