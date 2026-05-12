"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  paymentsService,
  PaymentStatusResponse,
} from "@/lib/services/payments";

export default function PagoExitoPage() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? params.get("external_reference");
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;
    let attempts = 0;
    let active = true;
    const poll = async () => {
      try {
        const p = await paymentsService.getByRef(ref);
        if (!active) return;
        setPayment(p);
        if (p.status === "approved" || attempts > 8) return;
        attempts++;
        setTimeout(poll, 1500);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error consultando el pago");
      }
    };
    poll();
    return () => {
      active = false;
    };
  }, [ref]);

  return (
    <div className="container max-w-xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>¡Pago realizado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Tu pago se procesó correctamente. Gracias por tu compra.</p>
          {ref && (
            <p className="text-sm text-muted-foreground">
              Referencia: <code>{ref}</code>
            </p>
          )}
          {payment && (
            <div className="text-sm space-y-1 rounded-md bg-muted p-3">
              <div>
                Estado: <strong>{payment.status}</strong>
              </div>
              <div>
                Total: ${payment.amount.toLocaleString()} {payment.currency}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
