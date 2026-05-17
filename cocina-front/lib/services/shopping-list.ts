/**
 * SERVICIOS DE LISTA DE COMPRAS
 *
 * Reemplaza localStorage con llamadas a la API REST.
 * Las funciones de lectura/mutación son async.
 * isItemOwned e isRecipeInShoppingList son síncronos y leen del caché local.
 */

import { api } from "@/lib/services/api";
import type { ShoppingListState } from "@/lib/types/shopping-list";

// Caché en memoria para consultas síncronas
let cachedState: ShoppingListState | null = null;

function updateCache(state: ShoppingListState): ShoppingListState {
  cachedState = state;
  return state;
}

// ========================================
// API pública
// ========================================

/**
 * No-op mantenido por compatibilidad: con API el caché se invalida
 * automáticamente en cada operación.
 */
export function resetShoppingListCache(): void {
  cachedState = null;
}

/**
 * Obtiene el estado actual de la lista de compras desde la API.
 */
export async function getShoppingList(): Promise<ShoppingListState> {
  const state = await api.get<ShoppingListState>("/shopping-list");
  return updateCache(state);
}

/**
 * Agrega los ingredientes de una receta a la lista.
 * El backend lee el título e ingredientes desde la receta en BD, así que
 * solo se envía recipeId. Los otros params se mantienen para compatibilidad
 * con llamadores existentes pero se ignoran.
 */
export async function addRecipeToShoppingList(
  recipeId: string,
  _recipeTitle?: string,
  _ingredients?: string[]
): Promise<void> {
  const state = await api.post<ShoppingListState>("/shopping-list/recipes", {
    recipeId,
  });
  updateCache(state);
}

/**
 * Elimina una receta y sus ingredientes de la lista.
 */
export async function removeRecipeFromShoppingList(recipeId: string): Promise<void> {
  const state = await api.delete<ShoppingListState>(
    `/shopping-list/recipes/${recipeId}`
  );
  updateCache(state);
}

/**
 * Vacía toda la lista de compras.
 */
export async function clearShoppingList(): Promise<void> {
  await api.delete("/shopping-list");
  updateCache({ entries: [], ownedItems: [] });
}

/**
 * Marca o desmarca un ingrediente como "ya tengo en casa".
 */
export async function toggleOwnedItem(ingredient: string): Promise<void> {
  const state = await api.put<ShoppingListState>("/shopping-list/owned-items", {
    ingredient,
  });
  updateCache(state);
}

/**
 * Síncrono: comprueba si un ingrediente está marcado como "en casa".
 * Requiere que getShoppingList() haya sido llamado antes para poblar el caché.
 */
export function isItemOwned(ingredient: string): boolean {
  if (!cachedState) return false;
  return cachedState.ownedItems.includes(ingredient.toLowerCase().trim());
}

/**
 * Síncrono: comprueba si una receta ya está en la lista de compras.
 * Requiere que getShoppingList() haya sido llamado antes para poblar el caché.
 */
export function isRecipeInShoppingList(recipeId: string): boolean {
  if (!cachedState) return false;
  return cachedState.entries.some((e) => e.recipeId === recipeId);
}
