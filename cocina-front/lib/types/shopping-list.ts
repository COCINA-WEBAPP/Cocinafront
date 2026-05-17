export type ShoppingListEntry = {
  recipeId: string;
  recipeTitle: string;
  ingredients: string[];
};

export type ConsolidatedSection = {
  category: string;
  items: string[];
};

export type ShoppingListState = {
  entries: ShoppingListEntry[];
  ownedItems: string[];
  consolidated?: ConsolidatedSection[];
};
