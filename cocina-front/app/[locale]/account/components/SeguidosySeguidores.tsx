"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser, getUserFollowers, getUserFollowing } from "@/lib/services/user";
import type { User as AppUser } from "@/lib/types/users";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SeguidosySeguidoresProps {
  user?: AppUser;
  defaultTab?: "followers" | "following";
  onUserSelect?: () => void;
  viewerUser?: AppUser | null;
}

export function SeguidosySeguidores({
  user: passedUser,
  defaultTab = "followers",
  onUserSelect,
  viewerUser,
}: SeguidosySeguidoresProps) {
  const t = useTranslations("FollowersFollowing");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(passedUser || null);
  const [followingUsers, setFollowingUsers] = useState<AppUser[]>([]);
  const [followersUsers, setFollowersUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const user = passedUser ?? getCurrentUser();
    setCurrentUser(user);
    if (!user) return;

    Promise.all([getUserFollowing(user.id), getUserFollowers(user.id)])
      .then(([following, followers]) => {
        setFollowingUsers(following);
        setFollowersUsers(followers);
      })
      .catch((err) => {
        console.error("[SeguidosySeguidores] error cargando seguidores/seguidos:", err);
        setFollowingUsers([]);
        setFollowersUsers([]);
      });
  }, [passedUser]);

  if (!currentUser) return null;

  const renderUser = (user: AppUser) => {
    const isSelf = viewerUser?.id === user.id;
    const href = isSelf ? "/account" : `/perfil/${user.username}`;
    return (
      <Link
        key={user.id}
        href={href}
        onClick={onUserSelect}
        className="flex items-center gap-3 rounded-lg p-2 hover:bg-orange-50 transition"
      >
        <img
          src={user.avatar || "https://i.pravatar.cc/150?img=3"}
          alt={user.fullName}
          className="h-10 w-10 rounded-full object-cover border"
        />
        <div>
          <p className="font-medium">{user.fullName}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </Link>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following">
              {t("following")} ({followingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="followers">
              {t("followers")} ({followersUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4 space-y-3">
            {followingUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noFollowing")}</p>
            ) : (
              followingUsers.map(renderUser)
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4 space-y-3">
            {followersUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noFollowers")}</p>
            ) : (
              followersUsers.map(renderUser)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
