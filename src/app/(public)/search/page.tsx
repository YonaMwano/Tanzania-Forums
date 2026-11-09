import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/thread/thread-card";
import { Search } from "lucide-react";
import type { Thread } from "@/types/database";

interface Props {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

type SearchPost = {
  id: string;
  body: string;
  thread_id: string;
  created_at: string;
  author?: { handle: string; display_name: string | null } | null;
  thread?: { title: string; slug: string } | null;
};

type SearchUser = {
  id: string;
  handle: string;
  display_name: string | null;
  reputation: number;
  is_verified: boolean;
};

export const metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", tab = "threads" } = await searchParams;
  const query = q.trim();
  const supabase = await createClient();

  let threads: Thread[] = [];
  let posts: SearchPost[] = [];
  let users: SearchUser[] = [];

  if (query.length >= 2) {
    if (tab === "threads" || tab === "all") {
      const { data } = await supabase
        .from("threads")
        .select(
          "*, author:users(handle, display_name, is_verified), category:categories(slug, name_en, name_sw, color)"
        )
        .eq("status", "published")
        .ilike("title", `%${query}%`)
        .order("last_activity_at", { ascending: false })
        .limit(20);
      threads = (data as unknown as Thread[]) || [];
    }

    if (tab === "posts" || tab === "all") {
      const { data } = await supabase
        .from("posts")
        .select(
          "id, body, thread_id, created_at, author:users(handle, display_name), thread:threads(title, slug)"
        )
        .eq("status", "published")
        .ilike("body", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      posts = (data as unknown as SearchPost[]) || [];
    }

    if (tab === "users" || tab === "all") {
      const { data } = await supabase
        .from("users")
        .select("id, handle, display_name, reputation, is_verified")
        .eq("status", "active")
        .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order("reputation", { ascending: false })
        .limit(20);
      users = (data as SearchUser[]) || [];
    }
  }

  const tabs = [
    { id: "threads", label: "Threads" },
    { id: "posts", label: "Posts" },
    { id: "users", label: "Users" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-stone-900 dark:text-stone-50">
        Search
      </h1>

      <form className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search discussions, posts, people..."
          autoFocus
          className="h-12 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-900"
        />
      </form>

      {query.length >= 2 && (
        <>
          <div className="mb-6 flex gap-1 border-b border-stone-200 dark:border-stone-800">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/search?q=${encodeURIComponent(query)}&tab=${t.id}`}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                    : "border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {tab === "threads" && (
            <div className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
              {threads.length > 0 ? (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {threads.map((thread) => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))}
                </div>
              ) : (
                <Empty query={query} type="threads" />
              )}
            </div>
          )}

          {tab === "posts" && (
            <div className="space-y-3">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/t/${post.thread?.slug ?? ""}#post-${post.id}`}
                    className="block rounded-xl border border-stone-200 bg-white p-4 transition hover:border-brand-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-brand-700"
                  >
                    <p className="line-clamp-3 text-sm text-stone-700 dark:text-stone-300">
                      {post.body}
                    </p>
                    <div className="mt-2 text-xs text-stone-400">
                      in{" "}
                      <span className="font-medium text-stone-600 dark:text-stone-300">
                        {post.thread?.title}
                      </span>
                      {" · "}
                      {post.author?.display_name || post.author?.handle}
                    </div>
                  </Link>
                ))
              ) : (
                <Empty query={query} type="posts" />
              )}
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-2">
              {users.length > 0 ? (
                users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/u/${u.handle}`}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 transition hover:border-brand-300 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {(u.display_name?.[0] || u.handle[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {u.display_name || u.handle}
                        {u.is_verified && (
                          <span className="ml-1.5 text-[10px] text-accent-600">verified</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">
                        @{u.handle} · {u.reputation} reputation
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Empty query={query} type="users" />
              )}
            </div>
          )}
        </>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-center text-sm text-stone-400">
          Type at least 2 characters to search.
        </p>
      )}

      {!query && (
        <p className="text-center text-sm text-stone-400">
          Search for discussions, posts, or people across Tanzania Forums.
        </p>
      )}
    </div>
  );
}

function Empty({ query, type }: { query: string; type: string }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-stone-400">
      No {type} found for &ldquo;{query}&rdquo;
    </div>
  );
}
