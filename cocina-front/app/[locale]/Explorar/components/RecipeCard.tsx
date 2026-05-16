"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, ChefHat, Users, Star, Flame, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Link } from "@/i18n/navigation";
import { Recipe } from "@/lib/types/recipes";
import { getCurrentUser, saveRecipe, unsaveRecipe, isRecipeSaved } from "@/lib/services/user";
import { useTranslations } from "next-intl";

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteChange?: (recipeId: string, saved: boolean) => void;
}

export function RecipeCard({ recipe, onFavoriteChange }: RecipeCardProps) {
  const t = useTranslations("RecipeCard");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const avgRating = recipe.rating;
  const reviewCount = recipe.reviews?.length ?? 0;

  useEffect(() => {
    getCurrentUser();
    setIsWishlisted(isRecipeSaved(recipe.id));
  }, [recipe.id]);

  const handleWishlist = async () => {
    const user = getCurrentUser();
    if (!user) { toast.error(t("loginToSave")); return; }
    try {
      if (isWishlisted) {
        await unsaveRecipe(recipe.id);
        setIsWishlisted(false);
        toast.success(t("removedFromFavorites"));
      } else {
        await saveRecipe(recipe.id);
        setIsWishlisted(true);
        toast.success(t("addedToFavorites"));
      }
      onFavoriteChange?.(recipe.id, !isWishlisted);
    } catch {
      toast.error(t("favoriteError"));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermedio": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Difícil":    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:           return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {recipe.isNew && (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">{t("new")}</Badge>
        )}
        {recipe.isFeatured && (
          <Badge className="bg-purple-500 text-white hover:bg-purple-600">{t("featured")}</Badge>
        )}
      </div>

      <button
        onClick={handleWishlist}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow-md transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
        aria-label={isWishlisted ? t("removeFromFavorites") : t("addToFavorites")}
      >
        <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}`} />
      </button>

      <Link
        href={`/recetas/${recipe.id}`}
        className="relative block h-48 w-full overflow-hidden bg-muted"
        aria-label={t("viewRecipe")}
      >
        <ImageWithFallback
          src={recipe.images[0]}
          alt={recipe.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div
          className="absolute inset-0 hidden md:flex items-center justify-center bg-black/40 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none"
        >
          <span className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow">
            {t("viewRecipe")}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">{recipe.category}</Badge>
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight">{recipe.title}</h3>

        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <ChefHat className="h-4 w-4" />
          <span>
            {t("by")}{" "}
            <Link href={`/perfil/${recipe.author.username}`} className="hover:underline">
              {recipe.author.fullName}
            </Link>
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.cookTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} {t("portions")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            <span>{recipe.calories} kcal</span>
          </div>
          {(recipe.protein ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              <span>{recipe.protein}g prot.</span>
            </div>
          )}
        </div>

        <div className="mb-3">
          <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star key={i}
                className={`h-4 w-4 ${i < Math.floor(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({reviewCount})</span>
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        <Button asChild className="mt-auto w-full">
          <Link href={`/recetas/${recipe.id}`}>{t("viewFullRecipe")}</Link>
        </Button>
      </div>
    </motion.div>
  );
}