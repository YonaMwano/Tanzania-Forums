"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles } from "lucide-react";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("Tanzania Forums");
  const [tagline, setTagline] = useState(
    "Tanzania's open forum for ideas, truth, and community."
  );
  const [defaultLanguage, setDefaultLanguage] = useState("en");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("site_name", siteName);
    formData.set("tagline", tagline);
    formData.set("default_language", defaultLanguage);

    const result = await completeOnboarding(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40">
            <Shield className="h-7 w-7 text-brand-600" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
            Welcome, Admin
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            You are the first user and have been promoted to Admin. Configure your
            forum to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Forum name
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              required
              className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Default language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>

          <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div className="text-sm text-stone-600 dark:text-stone-400">
                <p className="font-medium text-stone-800 dark:text-stone-200">
                  Groq AI is connected
                </p>
                <p className="mt-1">
                  Content moderation and thread summaries are ready. You can adjust
                  sensitivity thresholds later in AI settings.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Saving..." : "Go to Admin Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
