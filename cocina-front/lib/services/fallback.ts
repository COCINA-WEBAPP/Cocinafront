/**
 * FALLBACK DE MOCK DATA
 *
 * Si la API no responde y `NEXT_PUBLIC_USE_MOCK_FALLBACK=true`, las funciones
 * de lectura caen a los datos mock locales para que la app siga navegable.
 * Las escrituras (POST/PATCH/DELETE) NO usan fallback — fallan como siempre.
 */

const FALLBACK_ENABLED =
  process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === "true";

let warned = false;
function warnFallback(label: string, err: unknown): void {
  if (typeof window === "undefined") return;
  if (!warned) {
    console.warn(
      "[Cocina] API no disponible — usando mock data como respaldo. Las escrituras no funcionarán.",
      err,
    );
    warned = true;
  } else {
    console.warn(`[Cocina] fallback en ${label}`);
  }
}

/**
 * Ejecuta una llamada a la API; si falla y el fallback está activo,
 * devuelve el valor mock. Si está desactivado, propaga el error.
 */
export async function withFallback<T>(
  label: string,
  apiCall: () => Promise<T>,
  mock: () => T,
): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    if (!FALLBACK_ENABLED) throw err;
    warnFallback(label, err);
    return mock();
  }
}

export const isFallbackEnabled = (): boolean => FALLBACK_ENABLED;
