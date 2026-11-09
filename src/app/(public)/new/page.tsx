"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createThread } from "@/actions/threads";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useLanguage } from "@/components/providers/language-provider";
import { useUser } from "@/hooks/use-user";
import type { Category } from "@/types/database";

function NewThreadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("category");
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useUser();

  const [authOpen, setAuthOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setAuthOpen(true);
    }
  }, [authLoading, user]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) {
          setCategories(data as Category[]);
          if (preselected) {
            const match = (data as Category[]).find((c) => c.slug === preselected);
            if (match) setCategoryId(match.id);
          }
        }
      });
  }, [preselected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("body", body);
    formData.set("category_id", categoryId);
    formData.set("language", language);

    const result = await createThread(formData);
    setLoading(false);

    if (result.error) {
      if (
        result.error.toLowerCase().includes("signed in") ||
        result.error.toLowerCase().includes("sign in")
      ) {
        setAuthOpen(true);
      }
      setError(result.error);
      return;
    }

    if (result.slug) {
      router.push(`/t/${result.slug}`);
      router.refresh();
    }
  };

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold text-stone-900 dark:text-stone-50">
          {t("Start a discussion", "Anzisha majadiliano")}
        </h1>
        <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
          {t(
            "Share your thoughts with the community. Be respectful and follow the category guidelines.",
            "Shiriki mawazo yako na jamii. Kuwa na heshima na fuata miongozo ya kategoria."
          )}
        </p>

        {authLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                {t("Category", "Kategoria")}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-900"
              >
                <option value="">{t("Select a category", "Chagua kategoria")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                {t("Title", "Kichwa")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={5}
                maxLength={200}
                placeholder={t("What do you want to discuss?", "Unataka kujadili nini?")}
                className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                {t("Your post", "Chapisho lako")}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                minLength={10}
                rows={8}
                placeholder={t(
                  "Share the details, context, or question...",
                  "Shiriki maelezo, muktadha, au swali..."
                )}
                className="w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-900"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                {t("Cancel", "Ghairi")}
              </Button>
              <Button type="submit" disabled={loading || !user}>
                {loading
                  ? t("Publishing...", "Inachapisha...")
                  : t("Publish discussion", "Chapisha majadiliano")}
              </Button>
            </div>
          </form>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          if (!user) router.push("/");
        }}
        message={t(
          "Sign in with Google to start a discussion.",
          "Ingia na Google kuanza majadiliano."
        )}
      />
    </>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-stone-400">Loading...</div>}>
      <NewThreadForm />
    </Suspense>
  );
}
