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
      className={`fixed bottom-16 md:bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        fadeIn ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      role="complementary"
      aria-label="Publicidad"
    >
      {/* Publicidad label */}
      <div className="flex justify-center">
        <span className="bg-muted/90 text-muted-foreground text-[10px] px-2 py-0.5 rounded-t-md tracking-widest uppercase">
          Publicidad
        </span>
      </div>

      {/* Banner body */}
      <div
        className="w-full border-t border-border shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${sponsor.bgFrom}, ${sponsor.bgTo})`,
        }}
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-3 max-w-4xl">
          {/* Logo / emoji */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner">
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
              className="text-xs leading-tight line-clamp-1 opacity-90"
              style={{ color: sponsor.textColor }}
            >
              {sponsor.tagline}
            </p>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={sponsor.ctaUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold bg-white/90 hover:bg-white transition-colors shadow-sm"
              style={{ color: sponsor.bgFrom }}
            >
              {sponsor.ctaLabel}
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              onClick={dismiss}
              className="h-7 w-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              style={{ color: sponsor.textColor }}
              aria-label="Cerrar anuncio"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Premium upsell strip */}
        <div className="bg-black/10 py-1 text-center">
          <button
            onClick={() => router.push("/premium")}
            className="text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: sponsor.textColor }}
          >
            ¿Cansado de los anuncios? Hazte Premium y elimínalos →
          </button>
        </div>
      </div>
    </div>
  );
}
