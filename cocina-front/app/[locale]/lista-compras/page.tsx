"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart, Trash2, Copy, Printer, House, UtensilsCrossed,
  Milk, Beef, Fish, Carrot, Apple, Wheat, Flame, Droplets, Egg, CakeSlice, Package,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { groupIngredientsByCategory } from "@/lib/data/ingredient-categories";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  getShoppingList,
  removeRecipeFromShoppingList,
  clearShoppingList,
  toggleOwnedItem,
} from "@/lib/services/shopping-list";
import type { ShoppingListState } from "@/lib/types/shopping-list";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function ShoppingListPage() {
  const t = useTranslations("ShoppingListPage");
  const [state, setState] = useState<ShoppingListState>({ entries: [], ownedItems: [] });
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = useCallback(async () => {
    try {
      const current = await getShoppingList();
      setState({
        ...current,
        entries: [...current.entries],
        ownedItems: [...current.ownedItems],
        consolidated: current.consolidated ? [...current.consolidated] : [],
      });
    } catch {
      setState({ entries: [], ownedItems: [], consolidated: [] });
    }
  }, []);

  useEffect(() => {
    refreshState().finally(() => setIsLoading(false));
  }, [refreshState]);

  const finalList = useMemo(() => {
    const seen = new Map<string, string>();
    for (const entry of state.entries) {
      for (const ingredient of entry.ingredients) {
        const key = ingredient.toLowerCase().trim();
        if (!seen.has(key)) seen.set(key, ingredient);
      }
    }
    return Array.from(seen.entries())
      .filter(([key]) => !state.ownedItems.includes(key))
      .map(([, original]) => original);
  }, [state]);

  const totalIngredients = useMemo(() => {
    const seen = new Set<string>();
    for (const entry of state.entries) {
      for (const ingredient of entry.ingredients) seen.add(ingredient.toLowerCase().trim());
    }
    return seen.size;
  }, [state]);

  const ownedCount = useMemo(() => {
    const allNormalized = new Set<string>();
    for (const entry of state.entries) {
      for (const ingredient of entry.ingredients) allNormalized.add(ingredient.toLowerCase().trim());
    }
    return state.ownedItems.filter((item) => allNormalized.has(item)).length;
  }, [state]);

  const localGrouped = useMemo(() => groupIngredientsByCategory(finalList), [finalList]);

  /**
   * Si el backend devolvió una versión consolidada por Claude, la usamos
   * (filtrando los ítems marcados como "ya los tengo"). Si no, caemos al
   * agrupamiento local por categoría.
   */
  const groupedFinalList = useMemo<Array<[string, string[]]>>(() => {
    if (state.consolidated && state.consolidated.length > 0) {
      return state.consolidated
        .map((s) => {
          const filtered = s.items.filter(
            (item) => !state.ownedItems.includes(item.toLowerCase().trim()),
          );
          return [s.category, filtered] as [string, string[]];
        })
        .filter(([, items]) => items.length > 0);
    }
    return Array.from(localGrouped.entries());
  }, [state.consolidated, state.ownedItems, localGrouped]);

  const isAiOrganized = (state.consolidated?.length ?? 0) > 0;

  const tCat = useTranslations("IngredientCategories");

  const CATEGORY_ICONS: Record<string, React.ElementType> = {
    // Claves locales (en inglés)
    dairy: Milk, meat: Beef, seafood: Fish, vegetables: Carrot, fruits: Apple,
    grains: Wheat, spices: Flame, oils: Droplets, eggs: Egg, bakery: CakeSlice, other: Package,
    // Claves devueltas por Claude (en español)
    "vegetales": Carrot,
    "frutas": Apple,
    "carnes y pescados": Beef,
    "lácteos y huevos": Milk,
    "granos, cereales y panes": Wheat,
    "especias y condimentos": Flame,
    "otros": Package,
  };

  const renderCategoryLabel = (category: string): string => {
    if (isAiOrganized) return category;
    try { return renderCategoryLabel(category); } catch { return category; }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    try {
      await removeRecipeFromShoppingList(recipeId);
      await refreshState();
      toast.success(t("recipeRemoved"));
    } catch {
      toast.error(t("recipeRemoved"));
    }
  };

  const handleClearAll = async () => {
    try {
      await clearShoppingList();
      setState({ entries: [], ownedItems: [], consolidated: [] });
      setIsClearDialogOpen(false);
      toast.success(t("listCleared"));
    } catch {
      toast.error(t("listCleared"));
    }
  };

  const handleToggleOwned = async (ingredient: string) => {
    try {
      await toggleOwnedItem(ingredient);
      await refreshState();
    } catch { /* noop */ }
  };

  const handleCopy = () => {
    const sections: string[] = [];
    for (const [category, items] of groupedFinalList) {
      sections.push(`\n${renderCategoryLabel(category).toUpperCase()}\n${items.map((item) => `  • ${item}`).join("\n")}`);
    }
    navigator.clipboard.writeText(`${t("finalList")}\n${sections.join("\n")}`);
    toast.success(t("copied"));
  };

  const handlePrint = () => {
    const sections: string[] = [];
    for (const [category, items] of groupedFinalList) {
      const itemsHtml = items.map((item) => `<li style="padding:4px 0;">&#9744; ${item}</li>`).join("");
      sections.push(`
        <div style="margin-bottom:1.5rem;">
          <h2 style="font-size:1.1rem;font-weight:600;border-bottom:2px solid #e5e5e5;padding-bottom:4px;margin-bottom:8px;">${renderCategoryLabel(category)}</h2>
          <ul style="list-style:none;padding:0;margin:0;">${itemsHtml}</ul>
        </div>
      `);
    }
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>${t("finalList")}</title></head>
        <body style="font-family:system-ui,sans-serif;padding:2rem;">
          <h1 style="font-size:1.5rem;margin-bottom:0.25rem;">${t("finalList")}</h1>
          <p style="color:#666;margin-bottom:1.5rem;">${t("toBuyCount", { count: finalList.length })}</p>
          ${sections.join("")}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando lista…</p>
      </div>
    );
  }

  if (state.entries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>{t("empty")}</CardTitle>
            <CardDescription>{t("emptyHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/Explorar"><Button>{t("goExplore")}</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />{t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setIsClearDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />{t("clearAll")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            <ShoppingCart className="mr-1 h-3 w-3" />{t("toBuyCount", { count: finalList.length })}
          </Badge>
          {ownedCount > 0 && (
            <Badge variant="secondary">
              <House className="mr-1 h-3 w-3" />{t("ownedCount", { count: ownedCount })}
            </Badge>
          )}
          <Badge variant="outline">
            <UtensilsCrossed className="mr-1 h-3 w-3" />{t("totalRecipes", { count: state.entries.length })}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-4">
          {state.entries.map((entry) => (
            <Card key={entry.recipeId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <Link href={`/recetas/${entry.recipeId}`} className="hover:underline text-primary">
                      {entry.recipeTitle}
                    </Link>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveRecipe(entry.recipeId)}
                    aria-label={t("removeRecipe")}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {entry.ingredients.map((ingredient, idx) => {
                    const owned = state.ownedItems.includes(ingredient.toLowerCase().trim());
                    return (
                      <label key={idx}
                        className={`flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors ${
                          owned ? "bg-muted/40" : "hover:bg-muted/50"
                        }`}>
                        <Checkbox checked={owned} onCheckedChange={() => handleToggleOwned(ingredient)} />
                        <span className={`flex-1 ${owned ? "line-through text-muted-foreground" : ""}`}>
                          {ingredient}
                        </span>
                        {owned && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <House className="h-3 w-3" />{t("atHome")}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />{t("finalList")}
            </CardTitle>
            <CardDescription>
              {t("toBuyCount", { count: finalList.length })} — {t("totalIngredients", { count: totalIngredients })} {t("total")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {finalList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("allOwned")}</p>
            ) : (
              <div className="space-y-6">
                {groupedFinalList.map(([category, items], idx) => {
                  const Icon = CATEGORY_ICONS[category.toLowerCase()] || Package;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm uppercase tracking-wide">{renderCategoryLabel(category)}</h3>
                        <Badge variant="outline" className="text-xs">{items.length}</Badge>
                      </div>
                      <ul className="space-y-1.5 ml-7">
                        {items.map((ingredient, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                      {idx < groupedFinalList.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {finalList.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />{t("copy")}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />{t("print")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clearAll")}</DialogTitle>
            <DialogDescription>{t("clearAllConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={handleClearAll}>{t("clearAll")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
