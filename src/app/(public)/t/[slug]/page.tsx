import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SummaryCard } from "@/components/thread/summary-card";
import { ThreadActions } from "@/components/thread/thread-actions";
import { Discussion } from "@/components/thread/discussion";
import type { Post } from "@/types/database";

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: thread, error } = await supabase.from("threads").select("*, category:categories(slug, name_en)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error("Unable to load this discussion.");
  if (!thread) notFound();
  const [{ data: posts, error: postError }, { data: { user } }] = await Promise.all([
    supabase.from("posts").select("*, author:users(id, handle, display_name, avatar_url, is_verified, reputation)").eq("thread_id", thread.id).eq("status", "published").order("created_at"),
    supabase.auth.getUser(),
  ]);
  if (postError) throw new Error("Unable to load replies.");
  return <div className="mx-auto max-w-4xl px-4 py-8">
    <Link href={thread.category ? `/c/${thread.category.slug}` : "/"} className="text-sm text-brand-600">{thread.category?.name_en || "Home"}</Link>
    <h1 className="mt-4 text-3xl font-bold">{thread.title}</h1>
    <p className="mt-3 text-sm text-stone-500">{thread.reply_count} replies</p>
    <ThreadActions threadId={thread.id} slug={thread.slug} />
    <div className="mt-6"><SummaryCard threadId={thread.id} summary={thread.ai_summary} canGenerate={!!user} /></div>
    <Discussion posts={(posts || []) as Post[]} threadId={thread.id} authorId={thread.author_id} currentUserId={user?.id} locked={thread.is_locked} />
  </div>;
}
