"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/services/user";
import { createRecipe, getUserTags } from "@/lib/services/recipe";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CreateRecipeData } from "@/lib/types/recipes";
import { X, Upload, Plus, Trash2, LinkIcon, ImageIcon } from "lucide-react";


type ImageSource =
  | { type: "url"; value: string }
  | { type: "file"; file: File; preview: string };

interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface StepRow {
  id: string;
  text: string;
  images: ImageSource[];
}


const FIXED_UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "oz", "lb"];
const DIFFICULTY_VALUES: CreateRecipeData["difficulty"][] = ["Fácil", "Intermedio", "Difícil"];


const hasNumbers = (str: string) => /\d/.test(str);


const isValidQuantity = (val: string) => {
  if (val === "") return true;
  if (!/^\d+$/.test(val)) return false;
  const n = Number(val);
  return n >= 0 && n <= 999;
};


function ImageInputModal({
  onAdd,
  onClose,
}: {
  onAdd: (src: ImageSource) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAdd({ type: "file", file, preview: URL.createObjectURL(file) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Agregar imagen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 mb-5">
          {(["url", "file"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tb
                  ? "border-[#2d6a4f] text-[#2d6a4f]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tb === "url" ? <><LinkIcon size={14} />URL</> : <><ImageIcon size={14} />Archivo local</>}
            </button>
          ))}
        </div>

        {tab === "url" ? (
          <div className="space-y-3">
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && url.trim() && (onAdd({ type: "url", value: url.trim() }), onClose())}
              className="border-gray-300 focus:border-[#2d6a4f] focus:ring-[#2d6a4f]"
            />
            <Button
              onClick={() => { if (url.trim()) { onAdd({ type: "url", value: url.trim() }); onClose(); } }}
              disabled={!url.trim()}
              className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white"
            >
              Agregar URL
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[#2d6a4f] hover:bg-[#f0faf5] transition-colors"
          >
            <Upload size={24} className="text-gray-400" />
            <p className="text-sm text-gray-500 text-center">Haz clic para seleccionar una imagen de tu computador</p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP hasta 10 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )}
      </div>
    </div>
  );
}


function ImageThumb({ src, onRemove }: { src: ImageSource; onRemove: () => void }) {
  const url = src.type === "url" ? src.value : src.preview;
  return (
    <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">

      <img src={url} alt="" className="w-full h-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={16} className="text-white" />
      </button>
    </div>
  );
}


function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-sm text-[#e07b39] hover:text-[#c4612a] font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={14} />
          {action.label}
        </button>
      )}
    </div>
  );
}


export default function CreateRecipePage() {
  const t = useTranslations("RecipeForm");
  const tAccount = useTranslations("Account");
  const router = useRouter();

  const UNIT_OPTIONS = [
    t("unitOther"), ...FIXED_UNITS, t("unitCup"), t("unitUnit"), t("unitPinch"), t("unitTaste"),
  ];

  const DIFFICULTY_LABELS: Record<CreateRecipeData["difficulty"], string> = {
    "Fácil":      t("difficultyEasy"),
    "Intermedio": t("difficultyMedium"),
    "Difícil":    t("difficultyHard"),
  };

  const PRESET_TAGS = [
    t("tagItalian"), t("tagMexican"), t("tagBreakfast"),
    t("tagDinner"),  t("tagHealthy"), t("tagDessert"),
  ];

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [cookTime, setCookTime] = useState(0);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [servings, setServings] = useState(1);
  const [difficulty, setDifficulty] = useState<CreateRecipeData["difficulty"]>("Fácil");

  const [mainPhoto, setMainPhoto] = useState<ImageSource | null>(null);
  const [gallery, setGallery] = useState<ImageSource[]>([]);
  const [showMainModal, setShowMainModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { id: crypto.randomUUID(), name: "", quantity: "", unit: "Otros" },
  ]);

  const [steps, setSteps] = useState<StepRow[]>([
    { id: crypto.randomUUID(), text: "", images: [] },
  ]);
  const [stepImageModalId, setStepImageModalId] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    setIsAuthenticated(!!user);
    if (user) {
      getUserTags()
        .then((tags) => setUserTags(tags ?? []))
        .catch((err) => {
          console.error("[create] error cargando tags del usuario:", err);
          setUserTags([]);
        });
    }
  }, []);

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{tAccount("notLoggedIn")}</CardTitle>
            <CardDescription>{tAccount("loginRequired")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>{tAccount("goToLogin")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  const resolveUrl = (src: ImageSource) => (src.type === "url" ? src.value : src.preview);

  const allImages = (): string[] => [
    ...(mainPhoto ? [resolveUrl(mainPhoto)] : []),
    ...gallery.map(resolveUrl),
  ];

  const serializeIngredients = (): string[] =>
    ingredients
      .filter((r) => r.name.trim())
      .map((r) => {
        const parts = [r.quantity.trim(), r.unit !== t("unitOther") ? r.unit : "", r.name.trim()].filter(Boolean);
        return parts.join(" ");
      });

  const allTags = Array.from(new Set([...PRESET_TAGS, ...userTags, ...customTags]));

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((tg) => tg !== tag) : [...prev, tag]
    );

  const handleAddNewTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (hasNumbers(tag)) {
      setError(t("newTagNoNumbers"));
      return;
    }
    if (!allTags.includes(tag)) setCustomTags((prev) => [...prev, tag]);
    if (!selectedTags.includes(tag)) setSelectedTags((prev) => [...prev, tag]);
    setNewTagInput("");
    setError("");
  };

  const updateIngredient = (id: string, field: keyof IngredientRow, val: string) =>
    setIngredients((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const removeIngredient = (id: string) =>
    setIngredients((prev) => prev.filter((r) => r.id !== id));
  const addIngredient = () =>
    setIngredients((prev) => [...prev, { id: crypto.randomUUID(), name: "", quantity: "", unit: t("unitOther") }]);


  const updateStep = (id: string, val: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text: val } : s)));
  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));
  const addStep = () =>
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), text: "", images: [] }]);
  const addStepImage = (stepId: string, img: ImageSource) =>
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, images: [...s.images, img] } : s));
  const removeStepImage = (stepId: string, imgIdx: number) =>
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, images: s.images.filter((_, i) => i !== imgIdx) } : s));


  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }

    if (category.trim() && hasNumbers(category)) {
      setError(t("categoryNoNumbers"));
      return;
    }

    const invalidIngredient = ingredients.find(
      (r) => r.name.trim() && hasNumbers(r.name)
    );
    if (invalidIngredient) {
      setError(t("ingredientNoNumbers", { name: invalidIngredient.name }));
      return;
    }

    const invalidQuantity = ingredients.find(
      (r) => r.name.trim() && r.quantity.trim() !== "" && !isValidQuantity(r.quantity.trim())
    );
    if (invalidQuantity) {
      setError(t("quantityInvalid", { name: invalidQuantity.name }));
      return;
    }

    const invalidTag = selectedTags.find(hasNumbers);
    if (invalidTag) {
      setError(t("tagNoNumbers", { tag: invalidTag }));
      return;
    }

    setIsLoading(true);
    try {
      const data: CreateRecipeData = {
        title: title.trim(),
        description: description.trim(),
        images: allImages(),
        category: category.trim() || "General",
        cookTime,
        calories,
        protein,
        servings,
        difficulty,
        tags: selectedTags,
        ingredients: serializeIngredients(),
        steps: steps.filter((s) => s.text.trim() !== "").map((s) => ({ text: s.text, images: s.images.map(resolveUrl) })),
      };
      const recipe = await createRecipe(data);
      toast.success(t("recipeCreated"));
      router.push(`/recetas/${recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setIsLoading(false);
    }
  };


  const inputCls = "border-gray-300 focus:border-[#2d6a4f] focus:ring-[#2d6a4f]";
  const selectCls =
    "h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f] bg-white";

  return (
    <>
      {showMainModal && (
        <ImageInputModal onAdd={(s) => setMainPhoto(s)} onClose={() => setShowMainModal(false)} />
      )}
      {showGalleryModal && (
        <ImageInputModal
          onAdd={(s) => setGallery((prev) => [...prev, s])}
          onClose={() => setShowGalleryModal(false)}
        />
      )}
      {stepImageModalId && (
        <ImageInputModal
          onAdd={(s) => addStepImage(stepImageModalId, s)}
          onClose={() => setStepImageModalId(null)}
        />
      )}

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#2d6a4f]">{t("createTitle")}</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-7">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t("recipeName")}
                </Label>
                <Input
                  placeholder={t("recipeNamePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">{t("recipeDescription")}</Label>
                <Textarea
                  placeholder={t("recipeDescriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block leading-tight">
                    {t("cookTimeMins")}
                  </Label>
                  <Input type="number" min={0} value={cookTime}
                    onChange={(e) => setCookTime(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">{t("calories")}</Label>
                  <Input type="number" min={0} value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">{t("proteinG")}</Label>
                  <Input type="number" min={0} value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">{t("categoryLabel")}</Label>
                  <Input
                    placeholder={t("categoryPlaceholder")}
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!hasNumbers(val)) setCategory(val);
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">{t("difficultyLabel")}</Label>
                  <select value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as CreateRecipeData["difficulty"])}
                    className={`w-full ${selectCls}`}>
                    {DIFFICULTY_VALUES.map((d) => (
                      <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowMainModal(true)}
                className="relative w-full flex-1 min-h-[220px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#2d6a4f] hover:bg-[#f0faf5] transition-colors overflow-hidden bg-gray-50"
              >
                {mainPhoto ? (
                  <img src={resolveUrl(mainPhoto)} alt="Foto principal"
                    className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-10 h-10 flex items-center justify-center text-gray-400">
                      <Upload size={28} />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{t("mainPhoto")}</span>
                  </>
                )}
              </button>
              {mainPhoto && (
                <button onClick={() => setMainPhoto(null)}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 self-start transition-colors">
                  <Trash2 size={12} /> {t("removePhoto")}
                </button>
              )}
            </div>
          </div>

          <div>
            <SectionHeader
              title={t("galleryTitle")}
              action={{ label: t("addGalleryImage"), onClick: () => setShowGalleryModal(true) }}
            />
            {gallery.length === 0 ? (
              <p className="text-sm text-gray-400 italic">{t("noGallery")}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {gallery.map((img, idx) => (
                  <ImageThumb key={idx} src={img}
                    onRemove={() => setGallery((prev) => prev.filter((_, i) => i !== idx))} />
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          <div>
            <SectionHeader
              title={t("ingredientsList")}
              action={{ label: t("addIngredientBtn"), onClick: addIngredient }}
            />
            <div className="space-y-2">
              {ingredients.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Input
                    placeholder={t("ingredientName")}
                    value={row.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!hasNumbers(val)) updateIngredient(row.id, "name", val);
                    }}
                    className={`flex-1 ${inputCls} text-sm`}
                  />
                  <Input
                    placeholder={t("quantityPlaceholder")}
                    value={row.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isValidQuantity(val)) updateIngredient(row.id, "quantity", val);
                    }}
                    className={`w-24 ${inputCls} text-sm`}
                    inputMode="numeric"
                  />
                  <select
                    value={row.unit}
                    onChange={(e) => updateIngredient(row.id, "unit", e.target.value)}
                    className={`w-28 ${selectCls} text-sm`}
                  >
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button onClick={() => removeIngredient(row.id)}
                    className="text-red-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <SectionHeader
              title={t("stepsTitle")}
              action={{ label: t("addStepBtn"), onClick: addStep }}
            />
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3">

                  <span className="mt-2.5 flex-shrink-0 w-6 h-6 rounded-full bg-[#2d6a4f] text-white text-xs flex items-center justify-center font-semibold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder={t("stepPlaceholder", { num: idx + 1 })}
                      value={step.text}
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      rows={2}
                      className={`${inputCls} resize-none text-sm`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {step.images.map((img, imgIdx) => (
                        <ImageThumb key={imgIdx} src={img}
                          onRemove={() => removeStepImage(step.id, imgIdx)} />
                      ))}
                      <button type="button" onClick={() => setStepImageModalId(step.id)}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#2d6a4f] hover:text-[#2d6a4f] hover:bg-[#f0faf5] transition-colors">
                        <ImageIcon size={16} />
                        <span className="text-[10px] font-medium">{t("stepPhotoBtn")}</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStep(step.id)}
                    className="mt-2.5 text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3">{t("tagsTitle")}</h2>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag) => (
                  <span key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-[#e07b39] text-white">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)}
                      className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <select
                value=""
                onChange={(e) => { if (e.target.value) toggleTag(e.target.value); }}
                className={`w-48 flex-shrink-0 ${selectCls} text-sm`}
              >
                <option value="" disabled>{t("addExisting")}</option>
                {allTags.filter((tg) => !selectedTags.includes(tg)).map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <Input
                placeholder={t("newTagPlaceholder")}
                value={newTagInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!hasNumbers(val)) setNewTagInput(val);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddNewTag(); } }}
                className={`flex-1 ${inputCls} text-sm`}
              />
              <Button type="button" onClick={handleAddNewTag} disabled={!newTagInput.trim()}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 text-sm whitespace-nowrap">
                {t("createTagBtn")}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              {t("cancelBtn")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !title.trim()}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-6 disabled:opacity-50"
            >
              {isLoading ? t("savingBtn") : t("saveBtn")}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}