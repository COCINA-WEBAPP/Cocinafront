"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ExternalLink, Crown, Volume2, VolumeX } from "lucide-react";
import { getRandomSponsor, type Sponsor } from "./adsData";
import { getCurrentUser } from "@/lib/services/user";
import { useRouter } from "@/i18n/navigation";

const POPUP_SHOWN_KEY = "ad_popup_shown";
/** Seconds before the skip button appears (YouTube-style) */
const SKIP_DELAY_S = 5;
/** Seconds before the popup auto-closes if the user does nothing */
const AUTO_CLOSE_S = 30;
/** Time after page load before the popup appears */
const TRIGGER_DELAY_MS = 18_000;

export function AdPopup() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [visible, setVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(SKIP_DELAY_S);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(AUTO_CLOSE_S);
  const [muted, setMuted] = useState(true);
  const skipRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => setVisible(false), 300);
    if (skipRef.current) clearInterval(skipRef.current);
    if (autoRef.current) clearInterval(autoRef.current);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.isPremium) return;

    // Only show once per session
    if (sessionStorage.getItem(POPUP_SHOWN_KEY)) return;

    const triggerTimer = setTimeout(() => {
      sessionStorage.setItem(POPUP_SHOWN_KEY, "1");
      const s = getRandomSponsor();
      setSponsor(s);
      setVisible(true);
      setTimeout(() => setFadeIn(true), 50);

      // Skip countdown
      skipRef.current = setInterval(() => {
        setSkipCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(skipRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1_000);

      // Auto-close countdown
      autoRef.current = setInterval(() => {
        setAutoCloseCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(autoRef.current!);
            close();
            return 0;
          }
          return prev - 1;
        });
      }, 1_000);
    }, TRIGGER_DELAY_MS);

    return () => {
      clearTimeout(triggerTimer);
      if (skipRef.current) clearInterval(skipRef.current);
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [close]);

  if (!visible || !sponsor) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end md:items-center justify-center transition-all duration-300 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`Anuncio de ${sponsor.name}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Ad card */}
      <div
        className={`relative w-full max-w-lg mx-0 md:mx-4 transition-transform duration-300 ${
          fadeIn ? "translate-y-0 md:scale-100" : "translate-y-full md:scale-95"
        }`}
      >
        {/* Top bar - YouTube style */}
        <div className="flex items-center justify-between bg-black/80 px-4 py-2 md:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/60 uppercase tracking-widest">
              Anuncio
            </span>
            <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
              Ad
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-close timer */}
            <span className="text-xs text-white/50 tabular-nums">
              {autoCloseCountdown}s
            </span>

            {/* Mute button (cosmetic) */}
            <button
              onClick={() => setMuted((m) => !m)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Ad creative */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${sponsor.bgFrom} 0%, ${sponsor.bgTo} 100%)`,
            minHeight: "220px",
          }}
        >
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Logo */}
          <div className="absolute top-6 left-6">
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                {sponsor.logoEmoji}
              </div>
              <span
                className="font-black text-xl tracking-tight"
                style={{ color: sponsor.textColor }}
              >
                {sponsor.name}
              </span>
            </div>
          </div>

          {/* Main message */}
          <div className="px-6 pt-24 pb-6">
            <p
              className="text-2xl font-bold leading-tight mb-2"
              style={{ color: sponsor.textColor }}
            >
              {sponsor.tagline}
            </p>
          </div>

          {/* Bottom actions */}
          <div className="px-6 pb-6 flex items-center gap-3">
            <a
              href={sponsor.ctaUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 bg-white"
              style={{ color: sponsor.bgFrom }}
            >
              {sponsor.ctaLabel}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={() => {
                close();
                router.push("/premium");
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold border border-white/40 hover:bg-white/10 transition-colors"
              style={{ color: sponsor.textColor }}
            >
              <Crown className="h-3.5 w-3.5" />
              Sin anuncios
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between bg-black/80 px-4 py-2.5 md:rounded-b-2xl">
          <p className="text-xs text-white/40">
            ¿Por qué este anuncio?
          </p>

          {/* Skip button - YouTube style */}
          <button
            onClick={close}
            disabled={skipCountdown > 0}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-sm font-medium transition-all ${
              skipCountdown > 0
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-white/90 text-black hover:bg-white cursor-pointer"
            }`}
          >
            {skipCountdown > 0 ? (
              <>
                Saltar en <span className="font-mono tabular-nums w-3 text-right">{skipCountdown}</span>
              </>
            ) : (
              <>
                Saltar anuncio
                <X className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
