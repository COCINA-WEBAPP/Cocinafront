"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentsService, PreferenceItem } from "@/lib/services/payments";

export default function CheckoutPage() {
  const [title, setTitle] = useState("Receta premium");
  const [unitPrice, setUnitPrice] = useState(1500);
  const [quantity, setQuantity] = useState(1);
  const [payerEmail, setPayerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setLoading(true);
    try {
      const items: PreferenceItem[] = [{ title, unitPrice, quantity }];
      await paymentsService.checkout({
        items,
        payerEmail: payerEmail || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar el pago");
      setLoading(false);
    }
  }

  const total = unitPrice * quantity;

  return (
    <div className="container max-w-xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Producto</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio unitario</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Cantidad</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email del pagador (opcional)</Label>
            <Input
              id="email"
              type="email"
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              placeholder="comprador@mail.com"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-semibold">
              ${total.toLocaleString()}
            </span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            className="w-full"
            disabled={loading || total <= 0}
            onClick={handlePay}
          >
            {loading ? "Redirigiendo..." : "Pagar con MercadoPago"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
