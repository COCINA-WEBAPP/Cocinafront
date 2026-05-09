"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login } from "@/lib/services/user";
import { Loader2, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const t = useTranslations("Login");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login({
        email: formData.email,
        password: formData.password,
      });

      console.log("Usuario autenticado:", user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fillExample = () => {
    // Credenciales del usuario seed del back (ver CocinaBack/src/seed/seed.data.ts).
    setFormData({ email: "maria@cocina.com", password: "password123" });
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:opacity-50 transition bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">{t("email")}</label>
        <input
          id="email" name="email" type="email"
          placeholder={t("emailPlaceholder")}
          value={formData.email} onChange={handleChange}
          required disabled={isLoading} className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">{t("password")}</label>
        <input
          id="password" name="password" type="password"
          placeholder="••••••••"
          value={formData.password} onChange={handleChange}
          required disabled={isLoading} className={inputCls}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={fillExample}
          className="text-[#f97316] hover:underline font-medium text-xs"
        >
          {t("useExample")}
        </button>
        <a href="#" className="text-gray-400 hover:text-gray-600 text-xs">
          {t("forgotPassword")}
        </a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-semibold text-sm shadow hover:opacity-90 transition disabled:opacity-50"
      >
        {isLoading ? (
          <><Loader2 size={16} className="animate-spin" />{t("loggingIn")}</>
        ) : (
          <><LogIn size={16} />{t("loginButton")}</>
        )}
      </button>

      <div className="text-xs text-gray-400 text-center pt-1 space-y-0.5">
        <p>{t("testUsers")}</p>
        <p>{t("testEmails")}</p>
      </div>
    </form>
  );
}