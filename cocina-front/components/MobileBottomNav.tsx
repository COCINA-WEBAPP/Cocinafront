/**
 * MobileBottomNav - Barra de navegación inferior para dispositivos móviles.
 *
 * Reemplaza el Header (navbar superior) en pantallas móviles (<768px).
 * Se muestra fija en la parte inferior de la pantalla con los enlaces
 * principales de navegación de la aplicación.
 *
 * En desktop (>=768px) se oculta automáticamente via la clase `md:hidden`.
 *
 * Patrón de navegación (siguiendo referencia de Figma):
 * - Móvil: navegación fija en la parte inferior (fixed bottom-0)
 * - Desktop: se oculta, ya que el Header maneja la navegación superior
 *
 * Rutas de navegación:
 * - Inicio    → /           (icono: Home)
 * - Explorar  → /Explorar   (icono: Search)
 * - Perfil    → /account    (icono: User)
 */
"use client";

import { Home, Search, User, Globe, PlusCircle, ShoppingCart } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { getCurrentUser, refreshCurrentUser, subscribeAuthChanges } from "@/lib/services/user";
import type { User as AppUser } from "@/lib/types/users";
import { routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  it: "Italiano",
  hu: "Magyar",
  cs: "Čeština",
  ja: "日本語",
};

/**
 * Definición de cada ítem del menú de navegación inferior.
 * - href: ruta de destino
 * - icon: componente de icono de lucide-react
 * - label: texto visible debajo del icono
 */
const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "home", authOnly: false },
  { href: "/Explorar", icon: Search, labelKey: "explore", authOnly: false },
  { href: "/create", icon: PlusCircle, labelKey: "create", authOnly: true },
  { href: "/lista-compras", icon: ShoppingCart, labelKey: "shoppingList", authOnly: false },
  { href: "/account", icon: User, labelKey: "profile", authOnly: false },
] as const;

export function MobileBottomNav() {
  const t = useTranslations("MobileNav");
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    refreshCurrentUser()
      .then((fresh) => {
        if (fresh) setCurrentUser(fresh);
      })
      .catch(() => undefined);
    const unsubscribe = subscribeAuthChanges(() => {
      setCurrentUser(getCurrentUser());
    });
    return unsubscribe;
  }, []);

  return (
    /**
     * Contenedor principal del menú inferior:
     * - fixed bottom-0: fijo en la parte inferior de la pantalla
     * - z-50: por encima de todo el contenido de la página
     * - md:hidden: se oculta en pantallas >= 768px (desktop usa Header)
     * - border-t: línea superior para separación visual del contenido
     * - safe-area: pb-safe para dispositivos con barra de navegación del sistema (iPhone)
     */
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      role="navigation"
      aria-label={t("navLabel")}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.filter((item) => !item.authOnly || currentUser).map((item) => {
          const { href, icon: Icon, labelKey } = item;
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          const showAvatar = href === "/account" && currentUser;
          const avatarSrc = currentUser?.avatar || (currentUser ? `https://i.pravatar.cc/150?u=${currentUser.id}` : "");

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {showAvatar ? (
                <img
                  src={avatarSrc}
                  alt={currentUser.fullName}
                  className={`h-6 w-6 rounded-full object-cover ${isActive ? "ring-2 ring-primary" : ""}`}
                />
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span className="text-[10px] font-medium leading-none">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              aria-label={t("language")}
            >
              <Globe className="h-6 w-6" />
              <span className="text-[10px] font-medium leading-none uppercase">
                {locale}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2">
            {routing.locales.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onSelect={() => handleLocaleChange(loc)}
                className={loc === locale ? "font-semibold" : ""}
              >
                {LOCALE_LABELS[loc] || loc}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
