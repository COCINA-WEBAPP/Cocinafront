"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/services/user";
import { getAllRecipes } from "@/lib/services/recipe";
import type { Recipe } from "@/lib/types/recipes";
import type { User as AppUser } from "@/lib/types/users";
import { RecipeCard } from "../../Explorar/components/RecipeCard";
import { useTranslations } from "next-intl";

interface RecetasCreadasProps {
  user?: AppUser;
}

export function RecetasCreadas({ user: passedUser }: RecetasCreadasProps) {
  const t = useTranslations("CreatedRecipes");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(passedUser || null);
  const [createdRecipes, setCreatedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const user = passedUser ?? getCurrentUser();
    setCurrentUser(user);
    if (!user) return;
    getAllRecipes()
      .then((all) => setCreatedRecipes(all.filter((r) => r.author.username === user.username)))
      .catch((err) => {
        console.error("[RecetasCreadas] error cargando recetas creadas:", err);
        setCreatedRecipes([]);
      });
  }, [passedUser]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")} ({createdRecipes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {createdRecipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRecipes")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createdRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}