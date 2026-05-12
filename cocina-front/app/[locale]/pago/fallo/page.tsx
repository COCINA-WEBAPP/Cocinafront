"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PagoFalloPage() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? params.get("external_reference");

  return (
    <div className="container max-w-xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>El pago no se pudo procesar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Tu pago fue rechazado o cancelado. No te preocupes, no se realizó
            ningún cargo. Podés intentar nuevamente.
          </p>
          {ref && (
            <p className="text-sm text-muted-foreground">
              Referencia: <code>{ref}</code>
            </p>
          )}
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Volver al inicio</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/checkout">Reintentar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
