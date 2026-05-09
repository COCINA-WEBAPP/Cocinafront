"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "../Explorar/components/RecipeCard";
import { getCurrentUser } from "@/lib/services/user";
import { getAllRecipes } from "@/lib/services/recipe";
import type { Recipe } from "@/lib/types/recipes";
import type { User as AppUser } from "@/lib/types/users";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function GuardadosPage() {
	const t = useTranslations("Saved");
	const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
	const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
	const router = useRouter();

	useEffect(() => {
		const user = getCurrentUser();
		setCurrentUser(user);
		if (!user) return;

		getAllRecipes()
			.then((all) => setSavedRecipes(all.filter((r) => user.savedRecipes.includes(r.id))))
			.catch((err) => {
				console.error("[guardados] error cargando recetas guardadas:", err);
				setSavedRecipes([]);
			});
	}, []);

	const refreshSaved = () => {
		const user = getCurrentUser();
		if (!user) return;
		setCurrentUser({ ...user });
		getAllRecipes()
			.then((all) => setSavedRecipes(all.filter((r) => user.savedRecipes.includes(r.id))))
			.catch((err) => {
				console.error("[guardados] error refrescando recetas guardadas:", err);
			});
	};

	if (!currentUser) {
		return (
			<div className="container mx-auto px-4 py-16 flex items-center justify-center">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle>{t("notLoggedIn")}</CardTitle>
						<CardDescription>{t("loginRequired")}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => router.push("/login?tab=login")}>
							{t("goToLogin")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="max-w-5xl mx-auto space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">{t("title")}</CardTitle>
						<CardDescription>{t("description")}</CardDescription>
					</CardHeader>
					<CardContent>
						{savedRecipes.length === 0 ? (
							<p className="text-sm text-muted-foreground">{t("noSaved")}</p>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{savedRecipes.map((recipe) => (
									<RecipeCard
										key={recipe.id}
										recipe={recipe}
										onFavoriteChange={refreshSaved}
									/>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
