"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PagoPendientePage() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? params.get("external_reference");

  return (
    <div className="container max-w-xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Pago pendiente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Tu pago quedó en estado pendiente. Esto puede ocurrir con medios
            como Pago Fácil, Rapipago o transferencia. Apenas se acredite, vas
            a recibir la confirmación.
          </p>
          {ref && (
            <p className="text-sm text-muted-foreground">
              Referencia: <code>{ref}</code>
            </p>
          )}
          <Button asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
