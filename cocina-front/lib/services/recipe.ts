/**
 * SERVICIOS DE RECETAS
 *
 * Reemplaza la lógica mock con llamadas a la API REST.
 * Todas las funciones son async.
 */

import { api } from "@/lib/services/api";
import { withFallback } from "@/lib/services/fallback";
import { MOCK_RECIPES } from "@/lib/data/recipes";
import { Recipe, CreateRecipeData, UpdateRecipeData } from "@/lib/types/recipes";
import type { RecipeReview } from "@/lib/types/recipe-interactions";

// ─── Mapeo de respuesta API → tipo Recipe del frontend ───────────────────────

function mapApiRecipe(raw: Record<string, unknown>): Recipe {
  const id = (raw.id as string) || (raw._id as string) || "";

  // author puede venir como objeto populado o como string
  let author: Recipe["author"] = { username: "", fullName: "" };
  if (raw.author && typeof raw.author === "object") {
    const a = raw.author as Record<string, unknown>;
    author = {
      username: (a.username as string) || "",
      fullName: (a.fullName as string) || "",
    };
  }

  return {
    id,
    slug: (raw.slug as string) || id,
    title: (raw.title as string) || "",
    description: (raw.description as string) || "",
    images: (raw.images as string[]) || [],
    author,
    category: (raw.category as string) || "",
    cookTime: (raw.cookTime as number) || 0,
    protein: (raw.protein as number) || 0,
    calories: (raw.calories as number) || 0,
    servings: (raw.servings as number) || 1,
    difficulty: (raw.difficulty as Recipe["difficulty"]) || "Fácil",
    rating: (raw.rating as number) || 0,
    tags: (raw.tags as string[]) || [],
    ingredients: (raw.ingredients as string[]) || [],
    steps: (raw.steps as Recipe["steps"]) || [],
    reviews: (raw.reviews as RecipeReview[]) || [],
    comments: (raw.comments as Recipe["comments"]) || [],
    isNew: (raw.isNew as boolean) || false,
    isFeatured: (raw.isFeatured as boolean) || false,
  };
}

// Respuesta paginada del backend
interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ========================================
// SECCIÓN 1: LECTURA (READ)
// ========================================

export async function getAllRecipes(): Promise<Recipe[]> {
  return withFallback(
    "getAllRecipes",
    async () => {
      const res = await api.get<PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
        "/recipes?limit=200"
      );
      const raw = Array.isArray(res)
        ? res
        : (res as PaginatedResponse<Record<string, unknown>>).data;
      return raw.map(mapApiRecipe);
    },
    () => MOCK_RECIPES,
  );
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
  return withFallback(
    "getRecipeBySlug",
    async () => {
      try {
        const raw = await api.get<Record<string, unknown>>(`/recipes/${slug}`);
        return mapApiRecipe(raw);
      } catch {
        return undefined;
      }
    },
    () => MOCK_RECIPES.find((r) => r.slug === slug),
  );
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  return withFallback(
    "getRecipeById",
    async () => {
      try {
        const raw = await api.get<Record<string, unknown>>(`/recipes/id/${id}`);
        return mapApiRecipe(raw);
      } catch {
        return undefined;
      }
    },
    () => MOCK_RECIPES.find((r) => r.id === id),
  );
}

export async function getRecipesByCategory(category: string): Promise<Recipe[]> {
  return withFallback(
    "getRecipesByCategory",
    async () => {
      const res = await api.get<PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
        `/recipes?category=${encodeURIComponent(category)}&limit=200`
      );
      const raw = Array.isArray(res)
        ? res
        : (res as PaginatedResponse<Record<string, unknown>>).data;
      return raw.map(mapApiRecipe);
    },
    () => MOCK_RECIPES.filter((r) => r.category === category),
  );
}

// ========================================
// SECCIÓN 2: CREACIÓN (CREATE)
// ========================================

export async function createRecipe(data: CreateRecipeData): Promise<Recipe> {
  const raw = await api.post<Record<string, unknown>>("/recipes", data);
  return mapApiRecipe(raw);
}

// ========================================
// SECCIÓN 3: ACTUALIZACIÓN (UPDATE)
// ========================================

export async function updateRecipe(id: string, data: UpdateRecipeData): Promise<Recipe> {
  const raw = await api.patch<Record<string, unknown>>(`/recipes/${id}`, data);
  return mapApiRecipe(raw);
}

// ========================================
// SECCIÓN 4: ELIMINACIÓN (DELETE)
// ========================================

export async function deleteRecipe(id: string): Promise<void> {
  await api.delete(`/recipes/${id}`);
}

// ========================================
// SECCIÓN 5: ETIQUETAS (TAGS)
// ========================================

export async function getAllTags(): Promise<string[]> {
  try {
    const res = await api.get<string[]>("/recipes/tags");
    return res;
  } catch {
    return [];
  }
}

export async function getUserTags(): Promise<string[]> {
  try {
    const res = await api.get<string[]>("/recipes/user-tags");
    return res;
  } catch {
    return [];
  }
}

export async function addTagToRecipe(recipeId: string, tag: string): Promise<Recipe> {
  const raw = await api.post<Record<string, unknown>>(`/recipes/${recipeId}/tags`, { tag });
  return mapApiRecipe(raw);
}

export async function removeTagFromRecipe(recipeId: string, tag: string): Promise<Recipe> {
  const raw = await api.delete<Record<string, unknown>>(
    `/recipes/${recipeId}/tags/${encodeURIComponent(tag)}`
  );
  return mapApiRecipe(raw);
}

// ========================================
// SECCIÓN 6: RESEÑAS
// ========================================

export async function getRecipeReviews(recipeId: string): Promise<RecipeReview[]> {
  try {
    const raw = await api.get<Record<string, unknown>[]>(
      `/recipes/${recipeId}/reviews`
    );
    return raw.map((r) => ({
      user: (r.user as RecipeReview["user"]) || { username: "", fullName: "" },
      comment: (r.comment as string) || "",
      rating: (r.rating as number) || 0,
    }));
  } catch {
    return [];
  }
}

export async function saveRecipeReview(
  recipeId: string,
  review: RecipeReview
): Promise<RecipeReview[]> {
  await api.post(`/recipes/${recipeId}/reviews`, {
    comment: review.comment,
    rating: review.rating,
  });
  // Retorna la lista actualizada
  return getRecipeReviews(recipeId);
}
