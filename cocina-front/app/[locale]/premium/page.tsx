"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { paymentsService, PremiumConfig } from "@/lib/services/payments";
import {
  getCurrentUser,
  isAuthenticated,
  refreshCurrentUser,
} from "@/lib/services/user";

const PREMIUM_BENEFITS = [
  "Acceso ilimitado a todas las recetas premium",
  "Crear y publicar tus propias recetas",
  "Lista de compras inteligente sincronizada",
  "Sin anuncios y soporte prioritario",
];

export default function PremiumPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PremiumConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyPremium, setAlreadyPremium] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const fresh = await refreshCurrentUser();
        if (!active) return;
        if (fresh?.isPremium) setAlreadyPremium(true);
        const cfg = await paymentsService.getPremiumConfig();
        if (!active) return;
        setConfig(cfg);
      } catch (e) {
        if (!active) return;
        setError(
          e instanceof Error ? e.message : "No se pudo cargar la información"
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubscribe() {
    setError(null);

    if (!isAuthenticated()) {
      router.push("/login?next=/premium");
      return;
    }

    setSubmitting(true);
    try {
      await paymentsService.checkoutPremium();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo iniciar el pago. Intenta de nuevo."
      );
      setSubmitting(false);
    }
  }

  const priceFormatted = config
    ? new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: config.currency,
        maximumFractionDigits: 0,
      }).format(config.price)
    : null;

  const user = getCurrentUser();

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Acceso premium Cocina</CardTitle>
          <CardDescription>
            Un solo pago de aproximadamente 1 USD para desbloquear toda la app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          )}

          {alreadyPremium && (
            <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-4 text-sm">
              Ya tienes acceso premium activo. ¡Gracias por apoyar Cocina!
            </div>
          )}

          {!loading && config && !alreadyPremium && (
            <>
              <ul className="space-y-2 text-sm">
                {PREMIUM_BENEFITS.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden>✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  Total (pago único)
                </span>
                <span className="text-3xl font-semibold">
                  {priceFormatted}
                </span>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                className="w-full"
                disabled={submitting}
                onClick={handleSubscribe}
              >
                {submitting
                  ? "Redirigiendo a MercadoPago…"
                  : user
                  ? "Pagar con MercadoPago"
                  : "Inicia sesión para pagar"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Pago seguro procesado por MercadoPago. El cobro se hace en{" "}
                {config.currency}; el equivalente en USD es aproximado y depende
                de la tasa de cambio del día.
              </p>
            </>
          )}

          {alreadyPremium && (
            <Button asChild className="w-full">
              <Link href="/">Volver al inicio</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
