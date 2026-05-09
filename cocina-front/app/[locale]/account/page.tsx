"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCurrentUser, logout } from "@/lib/services/user";
import { getAllRecipes, getRecipeReviews } from "@/lib/services/recipe";
import type { User as AppUser } from "@/lib/types/users";
import { Informacion } from "./components/Informacion";
import { Favoritos } from "./components/Favoritos";
import { RecetasCreadas } from "./components/RecetasCreadas";
import { Historial } from "./components/Historial";
import { SeguidosySeguidores } from "./components/SeguidosySeguidores";
import { EditarPerfil } from "./components/Editar";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { Heart, Clock, UtensilsCrossed, LogOut, Star, ChefHat, Pencil } from "lucide-react";


type Tab = "favoritos" | "historial" | "recetas" | "info";

const TAB_KEYS: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
  { id: "favoritos",  labelKey: "tabFavorites",  icon: <Heart size={16} /> },
  { id: "historial",  labelKey: "tabHistory",    icon: <Clock size={16} /> },
  { id: "recetas",    labelKey: "tabMyRecipes",  icon: <UtensilsCrossed size={16} /> },
  { id: "info",       labelKey: "tabInfo",       icon: <ChefHat size={16} /> },
];

function TopRecipes({ user }: { user: AppUser }) {
  const t = useTranslations("Account");
  const [topRecipes, setTopRecipes] = useState<Array<{ id: string; title: string; images: string[]; avg: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getAllRecipes();
        const mine = all.filter((r) => r.author.username === user.username);
        const withAvg = await Promise.all(
          mine.map(async (r) => {
            const reviews = await getRecipeReviews(r.id);
            const avg = reviews.length > 0
              ? reviews.reduce((s, rv) => s + rv.rating, 0) / reviews.length
              : r.rating;
            return { id: r.id, title: r.title, images: r.images, avg };
          })
        );
        withAvg.sort((a, b) => b.avg - a.avg);
        if (!cancelled) setTopRecipes(withAvg.slice(0, 3));
      } catch {
        if (!cancelled) setTopRecipes([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user.username]);

  if (topRecipes.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
        <Star size={18} className="fill-yellow-400 text-yellow-400" />
        {t("topRecipesTitle")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topRecipes.map((recipe) => (
          <Link key={recipe.id} href={`/recetas/${recipe.id}`}>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:border-[#2d6a4f] hover:bg-[#f0faf5] transition-colors cursor-pointer shadow-sm">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {recipe.images[0] ? (
                  
                  <img src={recipe.images[0]} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{recipe.title}</p>
                <p className="flex items-center gap-0.5 text-xs text-yellow-500 font-semibold mt-0.5">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {recipe.avg.toFixed(1)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function AccountPageContent() {
  const t = useTranslations("Account");
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false);
  const [followingDialogTab, setFollowingDialogTab] = useState<"followers" | "following">("followers");
  const searchParams = useSearchParams();

  const defaultTab = useMemo((): Tab => {
    const tab = searchParams.get("tab") as Tab | null;
    if (tab && ["favoritos", "recetas", "historial", "info"].includes(tab)) return tab;
    return "favoritos";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <p className="text-lg font-semibold text-gray-800">{t("notLoggedIn")}</p>
            <p className="text-sm text-gray-500">{t("loginRequired")}</p>
            <Button onClick={() => router.push("/login")} className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white">
              {t("goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              
              <img
                src={currentUser.avatar || "https://i.pravatar.cc/150?img=3"}
                alt={currentUser.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{currentUser.fullName}</h1>
              <p className="text-sm text-gray-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5 text-sm font-semibold"
            >
              <Pencil size={14} className="mr-1.5" />
              {t("editProfileBtn")}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="rounded-full px-5 text-sm font-semibold text-red-500 border-red-200 hover:bg-red-50"
            >
              <LogOut size={14} className="mr-1.5" />
              {t("logoutBtn")}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl py-4 shadow-sm border border-gray-100">
          <TopRecipes user={currentUser} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="flex border-b border-gray-100">
            {TAB_KEYS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[#e07b39] text-[#e07b39]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.icon}
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "favoritos" && <Favoritos />}
            {activeTab === "historial" && <Historial />}
            {activeTab === "recetas"   && <RecetasCreadas />}
            {activeTab === "info"      && (
              <Informacion
                user={currentUser}
                onFollowersClick={() => {
                  setFollowingDialogTab("followers");
                  setIsFollowingDialogOpen(true);
                }}
                onFollowingClick={() => {
                  setFollowingDialogTab("following");
                  setIsFollowingDialogOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10">
            <DialogTitle className="text-2xl">{t("editProfile")}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>
          <div className="mt-6 pr-4">
            <EditarPerfil
              user={currentUser}
              onUpdated={(updated) => {
                setCurrentUser(updated);
                setIsEditDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFollowingDialogOpen} onOpenChange={setIsFollowingDialogOpen}>
        <DialogContent className="w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("followersAndFollowing")}</DialogTitle>
            <DialogDescription>{t("followersDescription")}</DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <SeguidosySeguidores
              user={currentUser}
              defaultTab={followingDialogTab}
              onUserSelect={() => setIsFollowingDialogOpen(false)}
              viewerUser={currentUser}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <AccountPageContent />
    </Suspense>
  );
}