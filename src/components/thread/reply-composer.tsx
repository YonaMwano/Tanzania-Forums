"use client";

import { useState, useRef, useEffect } from "react";
import { createReply } from "@/actions/threads";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useLanguage } from "@/components/providers/language-provider";
import { LogIn, Send } from "lucide-react";

interface ReplyComposerProps {
  threadId: string;
  parentId?: string | null;
  currentUserId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ReplyComposer({
  threadId,
  parentId = null,
  currentUserId,
  onSuccess,
  onCancel,
  autoFocus = false,
}: ReplyComposerProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (autoFocus && currentUserId) {
      textareaRef.current?.focus();
    }
  }, [autoFocus, currentUserId]);

  if (!currentUserId) {
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-900/50">
          <div className="pointer-events-none select-none p-4 opacity-40">
            <div className="h-20 rounded-lg bg-stone-200 dark:bg-stone-700" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm dark:bg-stone-950/80">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {t(
                "Sign in with Google to join the discussion",
                "Ingia na Google kujiunga na majadiliano"
              )}
            </p>
            <Button onClick={() => setAuthOpen(true)} className="gap-2">
              <LogIn className="h-4 w-4" />
              {t("Continue with Google", "Endelea na Google")}
            </Button>
          </div>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("body", body.trim());
    formData.set("thread_id", threadId);
    formData.set("language", language);
    if (parentId) formData.set("parent_id", parentId);

    const result = await createReply(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setBody("");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("Write your reply...", "Andika jibu lako...")}
        rows={3}
        className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800 dark:focus:border-brand-400"
        disabled={loading}
      />

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-stone-400">
          {parentId
            ? t("Replying to a comment", "Unajibu maoni")
            : t("Replying to thread", "Unajibu uzi")}
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t("Cancel", "Ghairi")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading || !body.trim()} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {loading ? t("Posting...", "Inachapisha...") : t("Reply", "Jibu")}
          </Button>
        </div>
      </div>
    </form>
  );
}
