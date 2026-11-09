import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=required");
  const { data: profile } = await supabase.from("users").select("handle").eq("id", user.id).maybeSingle();
  if (profile?.handle) redirect(`/u/${profile.handle}`);
  return <div className="mx-auto max-w-4xl px-4 py-12"><h1 className="text-2xl font-bold">Your account</h1><p className="mt-4 text-stone-500">Your profile is not available yet. Please sign out and sign in again.</p></div>;
}
