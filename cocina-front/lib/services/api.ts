/**
 * CLIENTE HTTP BASE
 *
 * Instancia centralizada para todas las llamadas a la API REST.
 * Gestiona automáticamente el token JWT en los headers.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const TOKEN_KEY = "auth_token";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  async request<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        (error as { message?: string }).message || "Error en la petición"
      );
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    const json = await res.json();

    // El back tiene un TransformInterceptor global que envuelve respuestas no
    // paginadas en { data: ... }. Las paginadas vienen como { data, meta } y
    // las dejamos pasar tal cual (los servicios saben leerlas).
    // Aquí desenvolvemos el sobre cuando aplica, así el resto del cliente ve
    // la forma "natural" del recurso.
    if (
      json &&
      typeof json === "object" &&
      !Array.isArray(json) &&
      "data" in json &&
      !("meta" in json) &&
      Object.keys(json).length === 1
    ) {
      return (json as { data: T }).data;
    }

    return json as T;
  }

  get<T>(url: string): Promise<T> {
    return this.request<T>(url);
  }

  post<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  patch<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  put<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }

  async uploadFile(url: string, file: File): Promise<{ url: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        (error as { message?: string }).message || "Error al subir archivo"
      );
    }

    const json = await res.json();
    // Mismo unwrap que en request(): el TransformInterceptor del back envuelve
    // las respuestas en { data: ... }.
    if (
      json &&
      typeof json === "object" &&
      !Array.isArray(json) &&
      "data" in json &&
      !("meta" in json) &&
      Object.keys(json).length === 1
    ) {
      return (json as { data: { url: string } }).data;
    }
    return json;
  }
}

export const api = new ApiClient();
