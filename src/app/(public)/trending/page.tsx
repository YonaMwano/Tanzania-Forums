import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/thread/thread-card";
import { TrendingUp } from "lucide-react";
import type { Thread } from "@/types/database";

export const metadata = {
  title: "Trending",
};

export default async function TrendingPage() {
  const supabase = await createClient();

  // Simple trending: high engagement in last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: threads } = await supabase
    .from("threads")
    .select(
      "*, author:users(handle, display_name, is_verified), category:categories(slug, name_en, name_sw, color)"
    )
    .eq("status", "published")
    .gte("last_activity_at", weekAgo.toISOString())
    .order("reply_count", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-brand-600" />
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Trending this week
        </h1>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        {(threads as Thread[] | null)?.length ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {(threads as Thread[]).map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-stone-400">
            No trending discussions yet. Check back soon.
          </div>
        )}
      </div>
    </div>
  );
}
