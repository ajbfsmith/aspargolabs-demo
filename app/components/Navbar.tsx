"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AttributionCtaLink } from "@/app/components/AttributionCtaLink";
import { CTA_LINK_LABELS } from "@/lib/attribution/cta";

const navLinks = [
  { label: "About", href: "/about", isExternal: false },
  { label: "Blog", href: "/blog", isExternal: false },
];

const navGlassScrolled =
  "bg-[rgba(6,8,16,0.72)] border-[rgba(13,183,187,0.28)] shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]";
const navGlassDefault =
  "bg-[rgba(6,8,16,0.52)] border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]";

const LOGO_WIDTH = 69;
const LOGO_HEIGHT = 64;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 80);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed z-[900] inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-auto md:max-w-[calc(100%-2rem)] px-2 py-1.5 transition-all duration-500 rounded-xl border backdrop-blur-2xl ${
          scrolled ? navGlassScrolled : navGlassDefault
        }`}
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" />
          <div className="absolute inset-0 grid-overlay opacity-30" />
        </div>

        <div className="relative z-10 flex items-center justify-between md:justify-start gap-4 md:gap-8 lg:gap-12 px-3 py-0.5 sm:px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center shrink-0"
            aria-label="Accelerate Health home"
          >
            <Image
              src="/images/Logo-nav-64.webp"
              alt=""
              width={LOGO_WIDTH}
              height={LOGO_HEIGHT}
              sizes="(max-width: 640px) 28px, 32px"
              className="h-7 sm:h-8 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-5 lg:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-dm text-[14px] font-normal text-text-primary link-hover"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <AttributionCtaLink
            placement="navbar"
            className="btn-primary nav-cta hidden md:inline-flex shrink-0"
          >
            <span className="btn-fill" />
            <span className="relative z-10">{CTA_LINK_LABELS.navbar}</span>
          </AttributionCtaLink>

          <button
            type="button"
            className="md:hidden shrink-0 p-1 text-text-primary"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 bg-black/60 z-[950] backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
      <div
        className={`grid-overlay fixed top-0 right-0 h-full w-[min(280px,85vw)] bg-[rgba(6,8,16,0.95)] backdrop-blur-[30px] border-l border-[rgba(13,183,187,0.2)] z-[960] p-8 flex flex-col transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top))",
        }}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="self-end text-text-secondary mb-8"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-dm text-[18px] font-normal text-text-primary link-hover"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <AttributionCtaLink
            placement="navbar"
            className="btn-primary text-[14px] py-3 px-6 mt-4 text-center"
            onClick={() => setMobileOpen(false)}
          >
            <span className="btn-fill" />
            <span className="relative z-10">{CTA_LINK_LABELS.navbar}</span>
          </AttributionCtaLink>
        </div>
      </div>
    </>
  );
}
