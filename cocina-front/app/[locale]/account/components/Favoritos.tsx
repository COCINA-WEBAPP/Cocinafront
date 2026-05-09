"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/services/user";
import { getAllRecipes } from "@/lib/services/recipe";
import type { Recipe } from "@/lib/types/recipes";
import type { User as AppUser } from "@/lib/types/users";
import { RecipeCard } from "../../Explorar/components/RecipeCard";
import { useTranslations } from "next-intl";

interface FavoritosProps {
  user?: AppUser;
}

export function Favoritos({ user: passedUser }: FavoritosProps) {
  const t = useTranslations("Favorites");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(passedUser || null);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const user = passedUser ?? getCurrentUser();
    setCurrentUser(user);
    if (!user) return;

    getAllRecipes()
      .then((all) => setFavoriteRecipes(all.filter((r) => user.savedRecipes.includes(r.id))))
      .catch((err) => {
        console.error("[Favoritos] error cargando favoritos:", err);
        setFavoriteRecipes([]);
      });
  }, [passedUser]);

  const refreshFavorites = () => {
    const user = getCurrentUser();
    if (!user) return;
    setCurrentUser({ ...user });
    getAllRecipes()
      .then((all) => setFavoriteRecipes(all.filter((r) => user.savedRecipes.includes(r.id))))
      .catch((err) => {
        console.error("[Favoritos] error refrescando favoritos:", err);
      });
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")} ({favoriteRecipes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {favoriteRecipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFavorites")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFavoriteChange={refreshFavorites}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
