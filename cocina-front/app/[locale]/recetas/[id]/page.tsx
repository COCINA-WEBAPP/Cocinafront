"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useParams } from "next/navigation";
import { getRecipeById, getRecipeReviews, deleteRecipe, getUserTags, addTagToRecipe, removeTagFromRecipe } from "@/lib/services/recipe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Clock, Users, ChefHat, Star, Heart, Share2, Printer, Flame,
  Pencil, Trash2, Tag, X, ShoppingCart, UtensilsCrossed, Dumbbell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageCarousel } from "./components/ImageCarousel";
import { Comments } from "./components/Comments";
import { Reseñas } from "./components/Reseñas";
import type { Recipe } from "@/lib/types/recipes";
import { normalizeStep } from "@/lib/types/recipes";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  getCurrentUser, saveRecipe, unsaveRecipe, isRecipeSaved,
  addToCookingHistory,
} from "@/lib/services/user";
import { addRecipeToShoppingList, getShoppingList } from "@/lib/services/shopping-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveRecipeUser, getInitials, getAvatarSrc } from "@/lib/services/recipe-user";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Tab = "ingredientes" | "pasos" | "galeria";

export default function RecipePage() {
  const t = useTranslations("Recipe");
  const tCard = useTranslations("RecipeCard");
  const params = useParams();
  const router = useRouter();
  const recipeId = (params as any).id as string;

  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipeTags, setRecipeTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [inShoppingList, setInShoppingList] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("ingredientes");
  const [isCooking, setIsCooking] = useState(false);
  const [reviews, setReviews] = useState<Recipe["reviews"]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      let found: Recipe | undefined;
      let fetchedReviews: Recipe["reviews"] = [];
      try {
        [found, fetchedReviews] = await Promise.all([
          getRecipeById(recipeId),
          getRecipeReviews(recipeId).catch(() => [] as Recipe["reviews"]),
        ]);
      } catch {
        found = undefined;
      }
      if (cancelled) return;
      setRecipe(found);
      setReviews(fetchedReviews);
      setIsSaved(isRecipeSaved(recipeId));
      if (found) setRecipeTags([...found.tags]);
      setIsLoading(false);

      if (getCurrentUser()) {
        const [shoppingList, tags] = await Promise.all([
          getShoppingList().catch(() => null),
          getUserTags().catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        if (shoppingList) {
          setInShoppingList(shoppingList.entries.some((e) => e.recipeId === recipeId));
        }
        if (found) {
          setAvailableTags(tags.filter((tag) => !found!.tags.includes(tag)));
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [recipeId]);

  const handleAddTag = async (tag: string) => {
    try {
      await addTagToRecipe(recipeId, tag);
      setRecipeTags((prev) => [...prev, tag]);
      setAvailableTags((prev) => prev.filter((t) => t !== tag));
      toast.success(t("tagAdded"));
    } catch (error) {
      if (error instanceof Error && error.message === "La receta ya tiene esta etiqueta") {
        toast.error(t("tagDuplicate"));
      } else {
        toast.error(t("tagError"));
      }
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTagFromRecipe(recipeId, tag);
      const updated = recipeTags.filter((t) => t !== tag);
      setRecipeTags(updated);
      const freshTags = await getUserTags();
      setAvailableTags(freshTags.filter((t) => !updated.includes(t)));
      toast.success(t("tagRemoved"));
    } catch {
      toast.error(t("tagRemoveError"));
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipe) return;
    try {
      await addRecipeToShoppingList(recipeId, recipe.title, recipe.ingredients);
      setInShoppingList(true);
      toast.success(t("addedToShoppingList"));
    } catch {
      toast.error(t("addedToShoppingList"));
    }
  };

  const handleCook = async () => {
    const user = getCurrentUser();
    if (!user) { toast.error(t("loginToSave")); return; }
    if (!recipe) return;
    setIsCooking(true);
    try {
      await addToCookingHistory(recipeId, recipe.title, recipe.images[0]);
      toast.success(t("cookHistorySuccess"), {
        description: t("cookHistoryDesc"),
      });
      setActiveTab("pasos");
    } catch {
      toast.error(t("cookHistoryError"));
    } finally {
      setIsCooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center pb-20 md:pb-0">
          <p className="text-muted-foreground">{t("loading") ?? "Cargando..."}</p>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center pb-20 md:pb-0">
          <p className="text-muted-foreground">{t("notFound")}</p>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user) { toast.error(t("loginToSave")); return; }
    try {
      if (isSaved) {
        await unsaveRecipe(recipeId);
        setIsSaved(false);
        toast.success(t("unsavedSuccess"));
      } else {
        await saveRecipe(recipeId);
        setIsSaved(true);
        toast.success(t("savedSuccess"));
      }
    } catch { toast.error(t("favoriteError")); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t("linkCopied"));
  };

  const handlePrint = () => window.print();

  const currentUser = getCurrentUser();
  const isAuthor = currentUser?.username === recipe.author.username;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe(recipeId);
      toast.success(t("recipeDeleted"));
      router.push("/Explorar");
    } catch { toast.error(t("deleteError")); }
    finally { setIsDeleting(false); setIsDeleteDialogOpen(false); }
  };

  const resolvedAuthor = resolveRecipeUser(recipe.author);
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : recipe.rating;

  const rawSteps = recipe.steps ?? [];
  const steps = rawSteps.map(normalizeStep);
  const hasSteps = steps.length > 0;
  const hasGallery = recipe.images.length > 1;
  const protein = recipe.protein ?? 0;

  const TABS: { id: Tab; label: string }[] = [
    { id: "ingredientes", label: t("ingredients") },
    { id: "pasos",        label: t("stepsTab") },
    { id: "galeria",      label: t("galleryTab") },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-0 sm:px-6 lg:px-8">

          <div className="relative w-full overflow-hidden rounded-b-2xl mb-0" style={{ height: 340 }}>
            {recipe.images[0] && (
              <img src={recipe.images[0]} alt={recipe.title}
                className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <button onClick={() => router.back()}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors z-10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {isAuthor && (
              <Link href={`/recetas/${recipeId}/editar`}>
                <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors z-10">
                  <Pencil size={16} />
                </button>
              </Link>
            )}

            <div className="absolute top-4 left-14 flex gap-2 z-10">
              {recipe.isNew && <Badge className="bg-blue-500 text-white">{tCard("new")}</Badge>}
              {recipe.isFeatured && <Badge className="bg-purple-500 text-white">{tCard("featured")}</Badge>}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h1 className="text-3xl font-bold mb-2 drop-shadow">{recipe.title}</h1>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="opacity-80" />{recipe.cookTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={14} className="opacity-80" />{recipe.calories} kcal
                </span>
                {protein > 0 && (
                  <span className="flex items-center gap-1">
                    <Dumbbell size={14} className="opacity-80" />{protein}g {t("protein").toLowerCase()}.
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />{avgRating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around border-b border-gray-200 bg-white py-3 sticky top-0 z-20 shadow-sm">
            <button onClick={handleSave}
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${isSaved ? "text-red-500" : "text-gray-500 hover:text-gray-800"}`}>
              <Heart size={22} className={isSaved ? "fill-red-500 text-red-500" : ""} />
              {isSaved ? t("saved") : t("save")}
            </button>

            <button onClick={handleCook} disabled={isCooking}
              className="flex flex-col items-center gap-1 text-xs font-medium text-[#2d6a4f] hover:text-[#1b4332] transition-colors disabled:opacity-50">
              <UtensilsCrossed size={22} />
              {t("prepare")}
            </button>

            <button onClick={handleAddToShoppingList}
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${inShoppingList ? "text-[#2d6a4f]" : "text-gray-500 hover:text-gray-800"}`}>
              <ShoppingCart size={22} />
              {inShoppingList ? t("inList") : t("addToList")}
            </button>

            <button onClick={handleShare}
              className="flex flex-col items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
              <Share2 size={22} />
              {t("share")}
            </button>

            <button onClick={handlePrint}
              className="flex flex-col items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
              <Printer size={22} />
              {t("print")}
            </button>

            {isAuthor && (
              <button onClick={() => setIsDeleteDialogOpen(true)}
                className="flex flex-col items-center gap-1 text-xs font-medium text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={22} />
                {t("delete")}
              </button>
            )}
          </div>

          <div className="flex border-b border-gray-200 bg-white sticky top-[57px] z-10">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? "border-[#e07b39] text-[#e07b39]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-6 space-y-8">

            {activeTab === "ingredientes" && (
              <div className="space-y-8">

                <div className={`grid gap-3 ${protein > 0 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {[
                    { icon: <Clock size={20} className="text-[#2d6a4f]" />,    label: t("time"),       value: `${recipe.cookTime} min` },
                    { icon: <Flame size={20} className="text-[#e07b39]" />,    label: t("calories"),   value: `${recipe.calories} kcal` },
                    ...(protein > 0 ? [{ icon: <Dumbbell size={20} className="text-[#2d6a4f]" />, label: t("protein"), value: `${protein}g` }] : []),
                    { icon: <Users size={20} className="text-[#2d6a4f]" />,    label: t("servings"),   value: recipe.servings },
                    { icon: <ChefHat size={20} className="text-[#2d6a4f]" />,  label: t("difficulty"), value: recipe.difficulty },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-3 gap-1">
                      {stat.icon}
                      <span className="text-xs text-gray-500">{stat.label}</span>
                      <span className="text-sm font-semibold text-gray-800">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-gray-600 leading-relaxed">{recipe.description}</p>

                <div className="flex items-center gap-3">
                  <Link href={`/perfil/${recipe.author.username}`} aria-label={t("goToProfile", { name: recipe.author.fullName })}>
                    <Avatar size="lg">
                      <AvatarImage src={getAvatarSrc(recipe.author.fullName, resolvedAuthor?.avatar)} alt={recipe.author.fullName} />
                      <AvatarFallback>{getInitials(recipe.author.fullName)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <p className="text-xs text-gray-400">{t("createdBy")}</p>
                    <Link href={`/perfil/${recipe.author.username}`} className="font-semibold text-[#2d6a4f] hover:underline text-sm">
                      {recipe.author.fullName}
                    </Link>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4">{t("ingredients")}</h2>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[#2d6a4f] flex-shrink-0" />
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(recipeTags.length > 0 || isAuthor) && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Tag size={18} /> {t("tags")}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recipeTags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1 text-sm px-3 py-1">
                          {tag}
                          {isAuthor && (
                            <button type="button" onClick={() => handleRemoveTag(tag)}
                              className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive"
                              aria-label={t("removeTag")}>
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isAuthor && availableTags.length > 0 && (
                      <Select onValueChange={handleAddTag}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder={t("addTag")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <Reseñas
                  recipeId={recipeId}
                  initialReviews={reviews}
                  onChange={(next) => setReviews(next)}
                />

                <Card>
                  <CardHeader><CardTitle>{t("comments")}</CardTitle></CardHeader>
                  <CardContent>
                    <Comments initialComments={recipe.comments}
                      onChange={(next) => console.log("Comentarios actualizados (mock):", next)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">{t("statistics")}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("avgRating")}</span>
                      <span className="font-semibold">{avgRating.toFixed(1)}/5</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("totalReviews")}</span>
                      <span className="font-semibold">{reviewCount}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("comments")}</span>
                      <span className="font-semibold">{recipe.comments.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "pasos" && (
              <div>
                {!hasSteps ? (
                  <p className="text-gray-400 italic text-sm">{t("noSteps")}</p>
                ) : (
                  <ol className="space-y-8">
                    {steps.map((step, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e07b39] text-white flex items-center justify-center font-bold text-sm mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-gray-800 leading-relaxed">{step.text}</p>
                          {step.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {step.images.map((img, imgIdx) => (
                                <div key={imgIdx} className="w-28 h-28 rounded-lg overflow-hidden border border-gray-200">
                                  <img src={img} alt={`${t("stepsTab")} ${idx + 1} - ${imgIdx + 1}`}
                                    className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {activeTab === "galeria" && (
              <div>
                {!hasGallery ? (
                  <p className="text-gray-400 italic text-sm">{t("noGallery")}</p>
                ) : (
                  <>
                    <ImageCarousel images={recipe.images} height="h-[360px]" />
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {recipe.images.map((img, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden">

                          <img src={img} alt={`${recipe.title} ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogDescription>{t("confirmDeleteDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}