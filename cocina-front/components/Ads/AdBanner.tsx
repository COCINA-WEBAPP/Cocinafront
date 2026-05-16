"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ExternalLink } from "lucide-react";
import { SPONSORS, getRandomSponsor, type Sponsor } from "./adsData";
import { getCurrentUser } from "@/lib/services/user";
import { useRouter } from "@/i18n/navigation";

const BANNER_DISMISSED_KEY = "ad_banner_dismissed_until";
const ROTATE_INTERVAL_MS = 30_000;

export function AdBanner() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [visible, setVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.isPremium) return;

    const dismissedUntil = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const initial = getRandomSponsor();
    setSponsor(initial);
    setVisible(true);
    setTimeout(() => setFadeIn(true), 50);

    const interval = setInterval(() => {
      setSponsor((prev) => getRandomSponsor(prev?.id));
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const dismiss = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => setVisible(false), 300);
    // Don't show again for this session
    sessionStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now() + 60 * 60 * 1000));
  }, []);

  if (!visible || !sponsor) return null;

  return (
    <div
      className={`fixed z-40 transition-all duration-300 bottom-6 max-md:bottom-[5.5rem] right-[5.5rem] md:right-[5.5rem] w-[min(20rem,calc(100vw-6.5rem))] ${
        fadeIn ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
      role="complementary"
      aria-label="Publicidad"
    >
      {/* Publicidad label */}
      <div className="flex justify-start pl-3">
        <span className="bg-muted/90 text-muted-foreground text-[10px] px-2 py-0.5 rounded-t-md tracking-widest uppercase">
          Publicidad
        </span>
      </div>

      {/* Bubble body */}
      <div
        className="w-full rounded-2xl rounded-tl-none border border-border/40 shadow-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${sponsor.bgFrom}, ${sponsor.bgTo})`,
        }}
      >
        <div className="px-3 py-2.5 flex items-center gap-3">
          {/* Logo / emoji */}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg shadow-inner">
            {sponsor.logoEmoji}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-sm leading-tight truncate"
              style={{ color: sponsor.textColor }}
            >
              {sponsor.name}
            </p>
            <p
              className="text-[11px] leading-tight line-clamp-2 opacity-90"
              style={{ color: sponsor.textColor }}
            >
              {sponsor.tagline}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            style={{ color: sponsor.textColor }}
            aria-label="Cerrar anuncio"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* CTA + premium upsell row */}
        <div className="bg-black/10 px-3 py-1.5 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/premium")}
            className="text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity truncate"
            style={{ color: sponsor.textColor }}
          >
            Quitar anuncios →
          </button>
          <a
            href={sponsor.ctaUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/90 hover:bg-white transition-colors shadow-sm"
            style={{ color: sponsor.bgFrom }}
          >
            {sponsor.ctaLabel}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
