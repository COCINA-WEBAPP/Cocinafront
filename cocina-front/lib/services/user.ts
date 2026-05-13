/**
 * SERVICIOS DE USUARIO
 *
 * Reemplaza la lógica mock con llamadas a la API REST.
 * getCurrentUser / isAuthenticated permanecen síncronos mediante caché en localStorage.
 */

import { api } from "@/lib/services/api";
import { withFallback } from "@/lib/services/fallback";
import { MOCK_USERS } from "@/lib/data/users";
import {
  User,
  LoginCredentials,
  RegisterData,
  UpdateUserProfile,
  CookingHistoryEntry,
} from "@/lib/types/users";

// ========================================
// CACHÉ LOCAL
// ========================================

let currentUser: User | null = null;
const USER_CACHE_KEY = "auth_user";

/** Caché de todos los usuarios cargados (para recipe-user y seguidores) */
export let allUsersCache: User[] = [];

function cacheUser(user: User | null): void {
  currentUser = user;
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_CACHE_KEY);
    api.setToken(null);
  }
}

/** Mapea la respuesta de la API al tipo User del frontend */
function mapApiUser(raw: Record<string, unknown>): User {
  const id = (raw.id as string) || (raw._id as string) || "";
  return {
    id,
    username: raw.username as string,
    email: (raw.email as string) || "",
    fullName: raw.fullName as string,
    avatar: raw.avatar as string | undefined,
    bio: raw.bio as string | undefined,
    createdAt: (raw.createdAt as string) || new Date().toISOString(),
    role: (raw.role as "user" | "admin") || "user",
    isPremium: Boolean(raw.isPremium),
    premiumSince: raw.premiumSince as string | undefined,
    stats: (raw.stats as User["stats"]) || {
      recipesCount: 0,
      followersCount: 0,
      followingCount: 0,
      savedRecipesCount: 0,
    },
    savedRecipes: ((raw.savedRecipes as string[]) || []).map(String),
    recipes: ((raw.recipes as string[]) || []).map(String),
    cookingHistory: (raw.cookingHistory as CookingHistoryEntry[]) || [],
    tagInventory: (raw.tagInventory as string[]) || [],
    following: ((raw.following as string[]) || []).map(String),
    followers: ((raw.followers as string[]) || []).map(String),
    location: raw.location as string | undefined,
    website: raw.website as string | undefined,
    socialMedia: raw.socialMedia as User["socialMedia"],
  };
}

// ========================================
// SECCIÓN 1: AUTENTICACIÓN
// ========================================

export async function login(credentials: LoginCredentials): Promise<User> {
  const res = await api.post<{ accessToken: string; user: Record<string, unknown> }>(
    "/auth/login",
    credentials
  );
  api.setToken(res.accessToken);
  const user = mapApiUser(res.user);
  cacheUser(user);
  return user;
}

export async function register(data: RegisterData): Promise<User> {
  const res = await api.post<{ accessToken: string; user: Record<string, unknown> }>(
    "/auth/register",
    data
  );
  api.setToken(res.accessToken);
  const user = mapApiUser(res.user);
  cacheUser(user);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout", {});
  } catch {
    // Continuar aunque falle el endpoint
  }
  cacheUser(null);
}

/**
 * Síncrono: lee de caché en memoria o localStorage.
 * Para obtener datos frescos del servidor usar refreshCurrentUser().
 */
export function getCurrentUser(): User | null {
  if (currentUser) return currentUser;
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_CACHE_KEY);
    if (stored) {
      currentUser = JSON.parse(stored) as User;
    }
  } catch {
    localStorage.removeItem(USER_CACHE_KEY);
  }
  return currentUser;
}

/** Actualiza el usuario desde la API y refresca el caché */
export async function refreshCurrentUser(): Promise<User | null> {
  const token = api.getToken();
  if (!token) return null;
  try {
    const raw = await api.get<Record<string, unknown>>("/auth/me");
    const user = mapApiUser(raw);
    cacheUser(user);
    return user;
  } catch {
    cacheUser(null);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getCurrentUser()) && Boolean(api.getToken());
}

// ========================================
// SECCIÓN 2: GESTIÓN DE USUARIOS
// ========================================

export async function getAllUsers(): Promise<User[]> {
  return withFallback(
    "getAllUsers",
    async () => {
      const res = await api.get<{ data: Record<string, unknown>[] } | Record<string, unknown>[]>(
        "/users?limit=100"
      );
      const raw = Array.isArray(res) ? res : (res as { data: Record<string, unknown>[] }).data;
      const users = raw.map(mapApiUser);
      allUsersCache = users;
      return users;
    },
    () => {
      allUsersCache = MOCK_USERS;
      return MOCK_USERS;
    },
  );
}

export async function getUserById(id: string): Promise<User | undefined> {
  return withFallback(
    "getUserById",
    async () => {
      try {
        const raw = await api.get<Record<string, unknown>>(`/users/${id}`);
        return mapApiUser(raw);
      } catch {
        return undefined;
      }
    },
    () => MOCK_USERS.find((u) => u.id === id),
  );
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  return withFallback(
    "getUserByUsername",
    async () => {
      try {
        const raw = await api.get<Record<string, unknown>>(`/users/username/${username}`);
        return mapApiUser(raw);
      } catch {
        return undefined;
      }
    },
    () => MOCK_USERS.find((u) => u.username === username),
  );
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfile
): Promise<User> {
  const raw = await api.patch<Record<string, unknown>>(`/users/${userId}`, data);
  const user = mapApiUser(raw);
  if (currentUser?.id === userId) cacheUser(user);
  return user;
}

// ========================================
// SECCIÓN 3: SISTEMA DE SEGUIMIENTO (FOLLOW)
// ========================================

export async function followUser(userIdToFollow: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  await api.post(`/users/${userIdToFollow}/follow`, {});
  // Actualiza el caché local
  const updated: User = {
    ...user,
    following: [...user.following, userIdToFollow],
    stats: { ...user.stats, followingCount: user.stats.followingCount + 1 },
  };
  cacheUser(updated);
}

export async function unfollowUser(userIdToUnfollow: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  await api.delete(`/users/${userIdToUnfollow}/follow`);
  const updated: User = {
    ...user,
    following: user.following.filter((id) => id !== userIdToUnfollow),
    stats: {
      ...user.stats,
      followingCount: Math.max(0, user.stats.followingCount - 1),
    },
  };
  cacheUser(updated);
}

export async function getUserFollowers(userId: string): Promise<User[]> {
  const raw = await api.get<Record<string, unknown>[]>(`/users/${userId}/followers`);
  return raw.map(mapApiUser);
}

export async function getUserFollowing(userId: string): Promise<User[]> {
  const raw = await api.get<Record<string, unknown>[]>(`/users/${userId}/following`);
  return raw.map(mapApiUser);
}

export function isFollowingUser(userId: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.following.includes(userId);
}

// ========================================
// SECCIÓN 4: RECETAS GUARDADAS
// ========================================

export async function saveRecipe(recipeId: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  await api.post(`/users/${user.id}/saved-recipes/${recipeId}`, {});
  const saved = [...user.savedRecipes, recipeId];
  cacheUser({
    ...user,
    savedRecipes: saved,
    stats: { ...user.stats, savedRecipesCount: saved.length },
  });
}

export async function unsaveRecipe(recipeId: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  await api.delete(`/users/${user.id}/saved-recipes/${recipeId}`);
  const saved = user.savedRecipes.filter((id) => id !== recipeId);
  cacheUser({
    ...user,
    savedRecipes: saved,
    stats: { ...user.stats, savedRecipesCount: saved.length },
  });
}

export async function getUserSavedRecipes(userId: string): Promise<string[]> {
  const raw = await api.get<string[]>(`/users/${userId}/saved-recipes`);
  return raw;
}

export function isRecipeSaved(recipeId: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.savedRecipes.includes(recipeId);
}

// ========================================
// SECCIÓN 5: HISTORIAL DE COCINA
// ========================================

export async function addToCookingHistory(
  recipeId: string,
  recipeTitle: string,
  recipeImage?: string
): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  const entry = await api.post<CookingHistoryEntry>(
    `/users/${user.id}/cooking-history`,
    { recipeId, recipeTitle, recipeImage }
  );
  const history = [entry, ...(user.cookingHistory || [])];
  cacheUser({ ...user, cookingHistory: history });
}

export function getCookingHistory(): CookingHistoryEntry[] {
  const user = getCurrentUser();
  if (!user) return [];
  return user.cookingHistory || [];
}

export async function removeFromCookingHistory(index: number): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  await api.delete(`/users/${user.id}/cooking-history/${index}`);
  const history = [...(user.cookingHistory || [])];
  history.splice(index, 1);
  cacheUser({ ...user, cookingHistory: history });
}

export async function clearCookingHistory(): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión");
  await api.delete(`/users/${user.id}/cooking-history`);
  cacheUser({ ...user, cookingHistory: [] });
}

// ========================================
// COMPATIBILIDAD (shopping-list lo usa)
// ========================================

/** No-op mantenido para compatibilidad con código existente */
export function resetShoppingListCache(): void {
  // Con API no se necesita resetear caché de shopping list manualmente
}
