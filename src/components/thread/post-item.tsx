"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Flag } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { toggleReaction } from "@/actions/threads";
import { AuthModal } from "@/components/auth/auth-modal";
import { useUser } from "@/hooks/use-user";
import type { Post, User } from "@/types/database";

interface PostItemProps {
  post: Post & {
    author?: Pick<
      User,
      "id" | "handle" | "display_name" | "avatar_url" | "is_verified" | "reputation"
    >;
  };
  isOP?: boolean;
  depth?: number;
  currentUserId?: string | null;
  onReply?: (postId: string) => void;
}

export function PostItem({
  post,
  isOP = false,
  depth = 0,
  currentUserId,
  onReply,
}: PostItemProps) {
  const { user } = useUser();
  const effectiveUserId = user?.id ?? currentUserId ?? null;

  const [liked, setLiked] = useState(false);
  const [reactionCount, setReactionCount] = useState(post.reaction_count || 0);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const author = post.author;
  const maxDepth = 4;
  const indent = Math.min(depth, maxDepth) * 16;

  const handleLike = async () => {
    if (!effectiveUserId) {
      setAuthOpen(true);
      return;
    }
    setLoading(true);
    const result = await toggleReaction(post.id);
    setLoading(false);
    if (result.success) {
      setLiked(result.added ?? false);
      setReactionCount((c) => (result.added ? c + 1 : Math.max(0, c - 1)));
    } else if (result.error) {
      setAuthOpen(true);
    }
  };

  const handleReplyClick = () => {
    if (!effectiveUserId) {
      setAuthOpen(true);
      return;
    }
    onReply?.(post.id);
  };

  return (
    <>
      <article
        className="group relative border-b border-stone-100 py-5 last:border-0 dark:border-stone-800/60"
        style={{ paddingLeft: depth > 0 ? `${indent}px` : undefined }}
        id={`post-${post.id}`}
      >
        {depth > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-stone-200 dark:bg-stone-700"
            style={{ left: `${indent - 12}px` }}
          />
        )}

        <div className="flex gap-3">
          <Link
            href={author ? `/u/${author.handle}` : "#"}
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
          >
            {author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (author?.display_name?.[0] || author?.handle?.[0] || "?").toUpperCase()
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                href={author ? `/u/${author.handle}` : "#"}
                className="text-sm font-semibold text-stone-900 hover:text-brand-600 dark:text-stone-100 dark:hover:text-brand-400"
              >
                {author?.display_name || author?.handle || "Unknown"}
              </Link>
              {author?.is_verified && (
                <span className="text-[10px] font-medium text-accent-600">verified</span>
              )}
              {isOP && (
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  OP
                </span>
              )}
              <span className="text-xs text-stone-400">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>

            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {post.body}
            </div>

            <div className="mt-3 flex items-center gap-1">
              <button
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  liked
                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                {reactionCount > 0 && reactionCount}
              </button>

              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>

              <button
                onClick={() => {
                  if (!effectiveUserId) setAuthOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        message="Sign in with Google to react or reply."
      />
    </>
  );
}
