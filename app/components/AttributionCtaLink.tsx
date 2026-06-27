"use client";

import { useEffect, useState } from "react";
import { buildLandingCtaRedirectUrl } from "@/lib/attribution/cta";
import type { CtaPlacement } from "@/lib/attribution/cta";

type AttributionCtaLinkProps = {
  placement: CtaPlacement;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function AttributionCtaLink({
  placement,
  className = "",
  children,
  onClick,
}: AttributionCtaLinkProps) {
  const [href, setHref] = useState("#");

  useEffect(() => {
    setHref(buildLandingCtaRedirectUrl(placement));
  }, [placement]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
