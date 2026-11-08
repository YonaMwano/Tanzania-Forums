"use client";

import { useState } from "react";
import { Share2, Bookmark, Flag } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";

interface ThreadActionsProps {
  threadId: string;
  slug: string;
}

export function ThreadActions({ threadId, slug }: ThreadActionsProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/t/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
        return;
      } catch {
        // fall through
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAuthOpen(true);
      return;
    }

    if (bookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("thread_id", threadId);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        thread_id: threadId,
      });
      setBookmarked(true);
    }
  };

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <Share2 className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Share"}
        </button>
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
            bookmarked
              ? "bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400"
              : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
          {bookmarked ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => setAuthOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
        >
          <Flag className="h-3.5 w-3.5" />
          Report
        </button>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
