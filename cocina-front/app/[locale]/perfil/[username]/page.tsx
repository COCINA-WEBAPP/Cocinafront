"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Informacion } from "../../account/components/Informacion";
import { Favoritos } from "../../account/components/Favoritos";
import { RecetasCreadas } from "../../account/components/RecetasCreadas";
import { SeguidosySeguidores } from "../../account/components/SeguidosySeguidores";
import { getCurrentUser, getUserByUsername } from "@/lib/services/user";
import type { User as AppUser } from "@/lib/types/users";
import { useTranslations } from "next-intl";
import { PremiumBadge } from "@/components/PremiumBadge";

export default function PerfilUsuarioPage() {
	const t = useTranslations("Profile");
	const params = useParams();
	const usernameParam = params?.username;
	const username = useMemo(() => {
		if (Array.isArray(usernameParam)) return usernameParam[0];
		return usernameParam as string | undefined;
	}, [usernameParam]);

	const [profileUser, setProfileUser] = useState<AppUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false);
	const [followingDialogTab, setFollowingDialogTab] = useState<"followers" | "following">("followers");
	const [viewerUser, setViewerUser] = useState<AppUser | null>(null);

	useEffect(() => {
		setViewerUser(getCurrentUser());
	}, []);

	useEffect(() => {
		let isMounted = true;
		const loadUser = async () => {
			if (!username) {
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			const user = await getUserByUsername(username);
			if (isMounted) {
				setProfileUser(user ?? null);
				setIsLoading(false);
			}
		};

		loadUser();
		return () => {
			isMounted = false;
		};
	}, [username]);

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-16 flex items-center justify-center">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle>{t("loading")}</CardTitle>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (!profileUser) {
		return (
			<div className="container mx-auto px-4 py-16 flex items-center justify-center">
				<Card className="w-full max-w-md text-center">
					<CardHeader>
						<CardTitle>{t("userNotFound")}</CardTitle>
						<CardDescription>
							{t("userNotFoundDescription")}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="max-w-4xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl flex items-center gap-2 flex-wrap">
							<span>{t("profileOf", { name: profileUser.fullName })}</span>
							{profileUser.isPremium && <PremiumBadge />}
						</CardTitle>
						<CardDescription>
							{t("publicInfo")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="info" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="info">{t("info")}</TabsTrigger>
								<TabsTrigger value="favoritos">{t("favorites")}</TabsTrigger>
								<TabsTrigger value="recetas">{t("createdRecipes")}</TabsTrigger>
							</TabsList>

							<TabsContent value="info" className="mt-6">
								<Informacion
									user={profileUser}
									onFollowersClick={() => {
										setFollowingDialogTab("followers");
										setIsFollowingDialogOpen(true);
									}}
									onFollowingClick={() => {
										setFollowingDialogTab("following");
										setIsFollowingDialogOpen(true);
									}}
								/>
							</TabsContent>

							<TabsContent value="favoritos" className="mt-6">
								<Favoritos user={profileUser} />
							</TabsContent>

							<TabsContent value="recetas" className="mt-6">
								<RecetasCreadas user={profileUser} />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>

			<Dialog open={isFollowingDialogOpen} onOpenChange={setIsFollowingDialogOpen}>
				<DialogContent className="w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("followersAndFollowing")}</DialogTitle>
						<DialogDescription>
							{t("followersDescription")}
						</DialogDescription>
					</DialogHeader>
					<div className="mt-6">
						<SeguidosySeguidores
							user={profileUser}
							defaultTab={followingDialogTab}
							onUserSelect={() => setIsFollowingDialogOpen(false)}
							viewerUser={viewerUser}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
