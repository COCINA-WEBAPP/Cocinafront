"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Trophy } from "lucide-react";
import { getAllRecipes } from "@/lib/services/recipe";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type { Recipe } from "@/lib/types/recipes";
import type { User as AppUser } from "@/lib/types/users";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface InformacionProps {
  user: AppUser;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function Informacion({ user, onFollowersClick, onFollowingClick }: InformacionProps) {
  const t = useTranslations("UserInfo");
  const [topRecipes, setTopRecipes] = useState<(Recipe & { avgRating: number })[]>([]);

  useEffect(() => {
    getAllRecipes()
      .then((all) => {
        const userRecipes = all
          .filter((r) => r.author.username === user.username && r.rating > 0)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
          .map((r) => ({ ...r, avgRating: r.rating }));
        setTopRecipes(userRecipes);
      })
      .catch((err) => {
        console.error("[Informacion] error cargando top recetas:", err);
        setTopRecipes([]);
      });
  }, [user.username]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          <img
            src={user.avatar || "https://i.pravatar.cc/150?img=3"}
            alt={user.fullName}
            className="h-24 w-24 rounded-full object-cover border"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{user.fullName}</h2>
          <p className="text-muted-foreground">@{user.username}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{user.role}</Badge>
            {user.location && <Badge variant="outline">{user.location}</Badge>}
          </div>
          {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}
        </div>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <Link href="/account?tab=recetas" className="block hover:text-primary">
              <p className="text-2xl font-bold">{user.recipes.length}</p>
              <p className="text-sm text-muted-foreground">{t("recipes")}</p>
            </Link>
          </div>
          <button
            onClick={onFollowingClick}
            className="block w-full hover:text-primary cursor-pointer hover:bg-orange-50 p-2 rounded transition"
          >
            <p className="text-2xl font-bold">{user.following.length}</p>
            <p className="text-sm text-muted-foreground">{t("following")}</p>
          </button>
          <button
            onClick={onFollowersClick}
            className="block w-full hover:text-primary cursor-pointer hover:bg-orange-50 p-2 rounded transition"
          >
            <p className="text-2xl font-bold">{user.followers.length}</p>
            <p className="text-sm text-muted-foreground">{t("followers")}</p>
          </button>
          <div>
            <Link href="/account?tab=favoritos" className="block hover:text-primary">
              <p className="text-2xl font-bold">{user.savedRecipes.length}</p>
              <p className="text-sm text-muted-foreground">{t("favorites")}</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-2">
            <h3 className="font-semibold">{t("contact")}</h3>
            <p className="text-sm text-muted-foreground">Email: {user.email}</p>
            {user.website && (
              <p className="text-sm text-muted-foreground">Web: {user.website}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-2">
            <h3 className="font-semibold">{t("social")}</h3>
            <p className="text-sm text-muted-foreground">
              Instagram: {user.socialMedia?.instagram || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Twitter: {user.socialMedia?.twitter || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Facebook: {user.socialMedia?.facebook || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {topRecipes.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">{t("topRecipes")}</h3>
              </div>
              <div className="space-y-3">
                {topRecipes.map((recipe, index) => (
                  <Link
                    key={recipe.id}
                    href={`/recetas/${recipe.id}`}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                      {index + 1}
                    </span>
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                      <ImageWithFallback
                        src={recipe.images[0]}
                        alt={recipe.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{recipe.title}</p>
                      <p className="text-xs text-muted-foreground">{recipe.category}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{recipe.avgRating.toFixed(1)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
