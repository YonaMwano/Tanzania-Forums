"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthModal({ open, onClose, message }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const supabase = createClient();

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        },
      });
      if (error) {
        console.error("Auth error:", error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-stone-200 bg-white p-8 shadow-xl dark:border-stone-700 dark:bg-stone-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40">
            <svg
              className="h-8 w-8 text-brand-600 dark:text-brand-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
            {t("Join Tanzania Forums", "Jiunge na Tanzania Forums")}
          </h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            {message ||
              t(
                "Continue with Google to post, reply, and participate.",
                "Endelea na Google kuchapisha, kujibu, na kushiriki."
              )}
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full gap-3"
          size="lg"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {t("Continue with Google", "Endelea na Google")}
        </Button>

        <p className="mt-4 text-center text-xs text-stone-400">
          {t(
            "By continuing you agree to our guidelines and privacy policy.",
            "Kwa kuendelea unakubali miongozo na sera yetu ya faragha."
          )}
        </p>
      </div>
    </div>
  );
}
