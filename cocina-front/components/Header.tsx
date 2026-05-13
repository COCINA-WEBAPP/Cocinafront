"use client";

import { Search, BookMarked, User, Menu, ChefHat, LogOut, UserCircle, Plus, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { getCurrentUser, logout } from "@/lib/services/user";
import type { User as AppUser } from "@/lib/types/users";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  savedRecipesCount?: number;
  onMenuToggle?: () => void;
}

export function Header({ savedRecipesCount = 0, onMenuToggle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const router = useRouter();
  const t = useTranslations("Header");

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/Explorar?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleSavedClick = () => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login?tab=login");
      return;
    }
    router.push("/guardados");
  };

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMenuToggle}
            aria-label={t("menuToggle")}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:block">RecipeShare</span>
          </div>
        </div>

        {/* Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-primary transition-colors">{t("home")}</Link>
          <Link href="/Explorar" className="hover:text-primary transition-colors">{t("explore")}</Link>
        </nav>

        {/* Search Bar - Hidden on small screens */}
        <form onSubmit={handleSearch} role="search" className="hidden sm:flex relative max-w-sm flex-1 mx-4">
          <label htmlFor="header-search" className="sr-only">{t("searchPlaceholder")}</label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="header-search"
            placeholder={t("searchPlaceholder")}
            className="pl-10 bg-input-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="sm:hidden" aria-label={t("search")}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="relative" onClick={handleSavedClick} aria-label={t("savedRecipes")}>
            <BookMarked className="h-5 w-5" />
            {savedRecipesCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {savedRecipesCount}
              </Badge>
            )}
          </Button>
          <Link href="/lista-compras">
            <Button variant="ghost" size="sm" aria-label={t("shoppingList")}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          {currentUser && (
            <Link href="/create">
              <Button variant="default" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden lg:inline">{t("createRecipe")}</span>
              </Button>
            </Link>
          )}
          <LanguageSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={t("userMenu")} className={currentUser ? "p-0 h-9 w-9 rounded-full" : undefined}>
                {currentUser ? (
                  <img
                    src={currentUser.avatar || `https://i.pravatar.cc/150?u=${currentUser.id}`}
                    alt={currentUser.fullName}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-orange-200"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {!currentUser && (
                <>
                  <DropdownMenuItem onSelect={() => router.push("/login?tab=login")}>{t("login")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/login?tab=register")}>{t("register")}</DropdownMenuItem>
                </>
              )}
              {currentUser && (
                <>
                  <DropdownMenuItem onSelect={() => router.push("/account")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    {t("myProfile")}
                  </DropdownMenuItem>
                  {!currentUser.isPremium && (
                    <DropdownMenuItem onSelect={() => router.push("/premium")}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Hazte premium
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      await logout();
                      setCurrentUser(null);
                      router.push("/login");
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
