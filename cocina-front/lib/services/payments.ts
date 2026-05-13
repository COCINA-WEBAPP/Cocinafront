/**
 * SERVICIO DE PAGOS — MercadoPago
 *
 * Crea preferencias contra el backend y devuelve el init_point al que hay
 * que redirigir al usuario para que pague con Checkout Pro.
 */

import { api } from "@/lib/services/api";

export interface PreferenceItem {
  title: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  pictureUrl?: string;
}

export interface CreatePreferencePayload {
  items: PreferenceItem[];
  payerEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface PreferenceResponse {
  paymentId: string;
  externalReference: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  publicKey?: string;
}

export interface PaymentStatusResponse {
  _id: string;
  externalReference: string;
  status: string;
  statusDetail?: string;
  amount: number;
  currency: string;
  items: PreferenceItem[];
  mpPaymentId?: string;
  preferenceId?: string;
}

export interface PremiumConfig {
  price: number;
  currency: string;
  title: string;
  description: string;
}

export const paymentsService = {
  async createPreference(
    payload: CreatePreferencePayload
  ): Promise<PreferenceResponse> {
    return api.post<PreferenceResponse>("/payments/preference", payload);
  },

  async getByRef(ref: string): Promise<PaymentStatusResponse> {
    return api.get<PaymentStatusResponse>(
      `/payments/by-ref/${encodeURIComponent(ref)}`
    );
  },

  async getById(id: string): Promise<PaymentStatusResponse> {
    return api.get<PaymentStatusResponse>(`/payments/${id}`);
  },

  async getPremiumConfig(): Promise<PremiumConfig> {
    return api.get<PremiumConfig>("/payments/premium/config");
  },

  async createPremiumPreference(): Promise<PreferenceResponse> {
    return api.post<PreferenceResponse>("/payments/premium/checkout", {});
  },

  /** Re-consulta MP y activa premium si el pago está aprobado. */
  async syncByRef(
    ref: string,
    paymentId?: string
  ): Promise<PaymentStatusResponse> {
    const qs = paymentId
      ? `?payment_id=${encodeURIComponent(paymentId)}`
      : "";
    return api.post<PaymentStatusResponse>(
      `/payments/sync/${encodeURIComponent(ref)}${qs}`,
      {}
    );
  },

  /** Crea la preferencia y redirige al Checkout Pro de MercadoPago. */
  async checkout(payload: CreatePreferencePayload): Promise<void> {
    const pref = await this.createPreference(payload);
    redirectToCheckout(pref);
  },

  /** Atajo: inicia el checkout del acceso premium. */
  async checkoutPremium(): Promise<void> {
    const pref = await this.createPremiumPreference();
    redirectToCheckout(pref);
  },
};

function redirectToCheckout(pref: PreferenceResponse): void {
  const isProd = !pref.initPoint?.includes("sandbox");
  window.location.href =
    (isProd ? pref.initPoint : pref.sandboxInitPoint) ?? pref.initPoint;
}
