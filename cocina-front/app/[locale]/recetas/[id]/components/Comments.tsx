// components/Comments.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import type { Recipe } from "@/lib/types/recipes";
import { getCurrentUser } from "@/lib/services/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarSrc, getDisplayNameFromRef, getInitials, resolveRecipeUser } from "@/lib/services/recipe-user";
import { useTranslations } from "next-intl";

type Comment = NonNullable<Recipe["comments"]>[number];

interface CommentsProps {
  initialComments?: Comment[];
  onChange?: (comments: Comment[]) => void; 
}

export const Comments: React.FC<CommentsProps> = ({ initialComments = [], onChange }) => {
  const t = useTranslations("Comments");
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(() => initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const requireLogin = () => {
    if (getCurrentUser()) return true;
    toast.error(t("loginRequired"));
    router.push("/login");
    return false;
  };

  const notifyChange = (next: Comment[]) => {
    setComments(next);
    if (onChange) onChange(next);
  };

  const addComment = () => {
    if (!requireLogin()) return;
    const text = newCommentText.trim();
    if (!text) return toast.error(t("emptyCommentError"));
    const sessionUser = getCurrentUser();
    const newC: Comment = {
      user: sessionUser
        ? { username: sessionUser.username, fullName: sessionUser.fullName }
        : { username: "maria_user", fullName: "María García" },
      comment: text,
      likeCount: 0,
      dislikeCount: 0,
      date: new Date().toISOString().slice(0, 10),
      answers: [],
    };
    notifyChange([newC, ...comments]);
    setNewCommentText("");
    toast.success(t("commentPublished"));
  };

  const toggleLike = (index: number) => {
    const copy = [...comments];
    copy[index] = { ...copy[index], likeCount: copy[index].likeCount + 1 };
    notifyChange(copy);
  };

  const toggleDislike = (index: number) => {
    const copy = [...comments];
    copy[index] = { ...copy[index], dislikeCount: copy[index].dislikeCount + 1 };
    notifyChange(copy);
  };

  const startReply = (index: number) => {
    if (!requireLogin()) return;
    setReplyingTo(index);
    setReplyText("");
  };

  const submitReply = (index: number) => {
    if (!requireLogin()) return;
    const text = replyText.trim();
    if (!text) return toast.error(t("emptyReplyError"));
    const sessionUser = getCurrentUser();
    const copy = [...comments];
    const answer = {
      user: sessionUser
        ? { username: sessionUser.username, fullName: sessionUser.fullName }
        : { username: "maria_user", fullName: "María García" },
      comment: text,
      date: new Date().toISOString().slice(0, 10),
    };
    copy[index] = { ...copy[index], answers: [...copy[index].answers, answer] };
    notifyChange(copy);
    setReplyingTo(null);
    setReplyText("");
    toast.success(t("replyPublished"));
  };

  return (
    <div className="space-y-4">
 
      <div className="rounded-lg border bg-card p-4">
        <h4 className="font-semibold mb-2">{t("writeComment")}</h4>
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={t("sharePlaceholder")}
          className="w-full resize-none rounded-md border border-border bg-color-input p-3 text-sm"
          rows={3}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={addComment}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
          >
            {t("publish")}
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-3 text-muted-foreground">{t("noComments")}</p>
          <p className="mb-4 text-sm">{t("beFirst")}</p>
          <div className="flex justify-center">
            <button
              onClick={() => {
                const el = document.querySelector<HTMLTextAreaElement>("textarea");
                el?.focus();
              }}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
            >
              {t("writeCommentBtn")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={i} className="rounded-lg border p-4">
              {(() => {
                const resolvedCommentUser = resolveRecipeUser(c.user);
                return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarImage
                      src={getAvatarSrc(getDisplayNameFromRef(c.user), resolvedCommentUser?.avatar)}
                      alt={getDisplayNameFromRef(c.user)}
                    />
                    <AvatarFallback>{getInitials(getDisplayNameFromRef(c.user))}</AvatarFallback>
                  </Avatar>
                  <div>
                    {resolvedCommentUser ? (
                      <Link href={`/perfil/${resolvedCommentUser.username}`} className="font-semibold hover:underline">
                        {resolvedCommentUser.fullName}
                      </Link>
                    ) : (
                      <p className="font-semibold">{getDisplayNameFromRef(c.user)}</p>
                    )}
                  <p className="text-xs text-muted-foreground">{c.date}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex gap-3">
                  <button onClick={() => toggleLike(i)} aria-label={t("like")}>
                    👍 {c.likeCount}
                  </button>
                  <button onClick={() => toggleDislike(i)} aria-label={t("dislike")}>
                    👎 {c.dislikeCount}
                  </button>
                  <button onClick={() => startReply(i)} aria-label={t("reply")}>
                    {t("reply")}
                  </button>
                </div>
              </div>
                );
              })()}

              <p className="mt-3 text-sm">{c.comment}</p>

              {c.answers.length > 0 && (
                <div className="mt-4 ml-4 space-y-3 border-l-2 border-muted pl-4">
                  {c.answers.map((a, ai) => (
                    <div key={ai} className="rounded-lg bg-muted p-3">
                      {(() => {
                        const resolvedAnswerUser = resolveRecipeUser(a.user);
                        return (
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage
                              src={getAvatarSrc(getDisplayNameFromRef(a.user), resolvedAnswerUser?.avatar)}
                              alt={getDisplayNameFromRef(a.user)}
                            />
                            <AvatarFallback>{getInitials(getDisplayNameFromRef(a.user))}</AvatarFallback>
                          </Avatar>
                          {resolvedAnswerUser ? (
                            <Link href={`/perfil/${resolvedAnswerUser.username}`} className="text-sm font-semibold hover:underline">
                              {resolvedAnswerUser.fullName}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold">{getDisplayNameFromRef(a.user)}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                      </div>
                        );
                      })()}
                      <p className="text-sm">{a.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === i && (
                <div className="mt-3 ml-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-border bg-color-input p-2 text-sm"
                    placeholder={t("writeReplyPlaceholder")}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => submitReply(i)}
                      className="rounded-md bg-primary px-3 py-1 text-primary-foreground text-sm"
                    >
                      {t("reply")}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      className="rounded-md border border-border px-3 py-1 text-sm"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
