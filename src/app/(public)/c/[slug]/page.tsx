import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/thread/thread-card";
import type { Thread } from "@/types/database";

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; language?: string }>;
}) {
  const { slug } = await params;
  const { sort, language } = await searchParams;
  const supabase = await createClient();
  const { data: category, error } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw new Error("Unable to load this category.");
  if (!category) notFound();
  let query = supabase.from("threads").select("*, author:users(handle, display_name, is_verified), category:categories(slug, name_en, name_sw, color)").eq("category_id", category.id).eq("status", "published");
  if (language === "en" || language === "sw") query = query.eq("language", language);
  const order = sort === "replies" ? "reply_count" : sort === "views" ? "view_count" : "last_activity_at";
  const { data: threads, error: threadError } = await query.order("is_pinned", { ascending: false }).order(order, { ascending: false }).limit(50);
  if (threadError) throw new Error("Unable to load discussions.");
  return <div className="mx-auto max-w-4xl px-4 py-8">
    <Link href="/" className="text-sm text-brand-600">Home</Link>
    <h1 className="mt-4 text-3xl font-bold">{category.name_en}</h1>
    <p className="mt-3 text-stone-500">{category.description_en}</p>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4">
      <form className="flex gap-3"><select aria-label="Sort discussions" name="sort" defaultValue={sort || "latest"} className="rounded-lg border p-2 dark:bg-stone-900"><option value="latest">Latest</option><option value="replies">Most replied</option><option value="views">Most viewed</option></select><select aria-label="Language" name="language" defaultValue={language || ""} className="rounded-lg border p-2 dark:bg-stone-900"><option value="">All languages</option><option value="en">English</option><option value="sw">Swahili</option></select><button className="text-brand-600">Apply</button></form>
      <Link href="/new" className="rounded-lg bg-brand-600 px-4 py-2 text-white">Start a discussion</Link>
    </div>
    <div className="divide-y divide-stone-200 dark:divide-stone-800">{threads?.length ? (threads as Thread[]).map(thread => <ThreadCard key={thread.id} thread={thread} />) : <p className="py-12 text-center text-stone-500">No discussions yet. Start the conversation.</p>}</div>
  </div>;
}
