"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { INTAKE_FORM_URL } from "@/lib/config/intake-form-url";

const navLinks = [
  { label: "About", href: "/about", isExternal: false },
  { label: "Blog", href: "/blog", isExternal: false },
];

const navGlassScrolled =
  "bg-[rgba(6,8,16,0.72)] border-[rgba(13,183,187,0.28)] shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]";
const navGlassDefault =
  "bg-[rgba(6,8,16,0.52)] border-[rgba(255,255,255,0.1)] shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

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
    if (mobileOpen && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.4, ease: "power3.out" }
      );
    }
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeDrawer = () => {
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        x: "100%",
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => setMobileOpen(false),
      });
    } else {
      setMobileOpen(false);
    }
  };

  return (
    <>
      <nav
        ref={navRef}
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
          <Link href="/" className="flex items-center gap-1 shrink-0 min-w-0">
            <span className="font-dm text-[14px] sm:text-[15px] font-light tracking-wide text-text-primary">
              ACCELERATE
            </span>
            <span className="text-teal mx-0.5 sm:mx-1">·</span>
            <span className="font-ibm text-[11px] sm:text-[12px] font-light tracking-wider text-text-secondary">
              HEALTH
            </span>
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

          <a
            href={INTAKE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary nav-cta hidden md:inline-flex shrink-0"
          >
            <span className="btn-fill" />
            <span className="relative z-10">Learn More</span>
          </a>

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

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[950] backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div
            ref={drawerRef}
            className="grid-overlay fixed top-0 right-0 h-full w-[min(280px,85vw)] bg-[rgba(6,8,16,0.95)] backdrop-blur-[30px] border-l border-[rgba(13,183,187,0.2)] z-[960] p-8 flex flex-col"
            style={{
              transform: "translateX(100%)",
              paddingTop: "max(2rem, env(safe-area-inset-top))",
            }}
          >
            <button
              type="button"
              onClick={closeDrawer}
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
                  onClick={closeDrawer}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={INTAKE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-[14px] py-3 px-6 mt-4 text-center"
                onClick={closeDrawer}
              >
                <span className="btn-fill" />
                <span className="relative z-10">Learn More</span>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
