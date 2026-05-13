import type { Recipe } from "@/lib/types/recipes";

/**
 * TIPOS DE USUARIO
 */

export type CookingHistoryEntry = {
  recipeId: Recipe["id"];
  recipeTitle: string;
  recipeImage?: string;
  cookedAt: string; // ISO date string
};

export type User = {
  // ===== Información Básica =====
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  role: "user" | "admin";
  isPremium?: boolean;
  premiumSince?: string;

  // ===== Estadísticas del Usuario =====
  stats: {
    recipesCount: number;
    followersCount: number;
    followingCount: number;
    savedRecipesCount: number;
  };

  // ===== Relaciones con Recetas =====
  savedRecipes: Recipe["id"][];
  recipes: Recipe["id"][];

  // ===== Historial de recetas preparadas =====
  cookingHistory: CookingHistoryEntry[];

  // ===== Inventario de Etiquetas =====
  tagInventory: string[];

  // ===== Relaciones con Otros Usuarios =====
  following: string[];
  followers: string[];

  // ===== Información Adicional (opcional) =====
  location?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  username: string;
  email: string;
  password: string;
  fullName: string;
};

export type UpdateUserProfile = {
  fullName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
};