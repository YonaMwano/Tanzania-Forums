import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThreadCard } from "@/components/thread/thread-card";
import type { Thread } from "@/types/database";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: profile, error } = await supabase.from("users").select("id, handle, display_name, bio, reputation, created_at, privacy_settings").eq("handle", handle).maybeSingle();
  if (error) throw new Error("Unable to load this profile.");
  if (!profile) notFound();
  const showActivity = profile.privacy_settings?.show_activity !== false;
  const { data: threads } = showActivity ? await supabase.from("threads").select("*, author:users(handle, display_name, is_verified), category:categories(slug, name_en, name_sw, color)").eq("author_id", profile.id).eq("status", "published").order("created_at", { ascending: false }).limit(50) : { data: null };
  return <div className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-3xl font-bold">{profile.display_name || profile.handle}</h1><p className="mt-2 text-stone-500">@{profile.handle} · {profile.reputation} reputation</p><p className="mt-6 whitespace-pre-wrap">{profile.bio}</p><h2 className="mt-10 text-xl font-semibold">Discussions</h2>{!showActivity ? <p className="py-6 text-stone-500">This member keeps their activity private.</p> : threads?.length ? (threads as Thread[]).map(thread => <ThreadCard key={thread.id} thread={thread} />) : <p className="py-6 text-stone-500">No public discussions yet.</p>}</div>;
}
