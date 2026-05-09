"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAllRecipes } from "@/lib/services/recipe";
import type { Recipe } from "@/lib/types/recipes";
import type { User as AppUser } from "@/lib/types/users";

interface TopRecetasProps {
  user: AppUser;
}

export function TopRecetas({ user }: TopRecetasProps) {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    getAllRecipes()
      .then(setAllRecipes)
      .catch((err) => {
        console.error("[TopRecetas] error cargando recetas:", err);
        setAllRecipes([]);
      });
  }, []);

  const topRecipes = useMemo(() => {
    return allRecipes
      .filter((r) => r.author.username === user.username)
      .filter((r) => r.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, [allRecipes, user.username]);

  if (topRecipes.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
        <Star size={18} className="fill-yellow-400 text-yellow-400" />
        Mis Recetas Top
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topRecipes.map((recipe) => (
          <Link key={recipe.id} href={`/recetas/${recipe.id}`}>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:border-[#2d6a4f] hover:bg-[#f0faf5] transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {recipe.images[0] ? (
                  <img src={recipe.images[0]} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{recipe.title}</p>
                <p className="flex items-center gap-1 text-xs text-yellow-500 font-semibold mt-0.5">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {recipe.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
