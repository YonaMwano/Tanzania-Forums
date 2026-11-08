import Link from "next/link";
import { MessageSquare, Users, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/thread/thread-card";
import type { Category, Thread } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: latestThreads }, { data: trendingThreads }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("threads")
        .select(
          "*, author:users(handle, display_name, is_verified), category:categories(slug, name_en, name_sw, color)"
        )
        .eq("status", "published")
        .order("last_activity_at", { ascending: false })
        .limit(8),
      supabase
        .from("threads")
        .select(
          "*, author:users(handle, display_name, is_verified), category:categories(slug, name_en, name_sw, color)"
        )
        .eq("status", "published")
        .order("reply_count", { ascending: false })
        .limit(6),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-10 text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl lg:text-5xl">
          Tanzania&apos;s open forum for{" "}
          <span className="text-brand-600 dark:text-brand-400">ideas, truth,</span>{" "}
          and community.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-500 dark:text-stone-400">
          Read freely. Sign in with Google to join the conversation.
        </p>
      </section>

      {/* Bento Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trending */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Trending Discussions
            </h2>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {(trendingThreads as Thread[] | null)?.length ? (
              (trendingThreads as Thread[]).map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))
            ) : (
              <EmptyState message="No discussions yet. Be the first to start one!" />
            )}
          </div>
        </section>

        {/* Categories */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Categories
            </h2>
          </div>
          <div className="space-y-2">
            {(categories as Category[] | null)?.map((cat) => (
              <Link
                key={cat.id}
                href={`/c/${cat.slug}`}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {cat.name_en}
                  </span>
                </div>
                <span className="text-xs text-stone-400">{cat.thread_count}</span>
              </Link>
            )) || <EmptyState message="Categories loading..." />}
          </div>
        </section>

        {/* Latest */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Latest Discussions
            </h2>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {(latestThreads as Thread[] | null)?.length ? (
              (latestThreads as Thread[]).map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))
            ) : (
              <EmptyState message="No discussions yet." />
            )}
          </div>
        </section>

        {/* Stats / CTA */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                JamiiCheck
              </h2>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Community-powered fact-checking for claims circulating in Tanzania.
            </p>
            <Link
              href="/c/jamiicheck"
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Browse fact-checks &rarr;
            </Link>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-800 dark:bg-brand-950/30">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                Join the community
              </h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Sign in with Google to start discussions, reply, and earn reputation.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-700">
      {message}
    </div>
  );
}
