import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const destination = searchParams.get("next") ?? "/";
  const next = destination.startsWith("/") && !destination.startsWith("//") && !destination.includes("\\") ? destination : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this is the first admin (for onboarding redirect)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role, created_at")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          // Check if any other users exist — if not, this is bootstrap
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });

          if (count === 1) {
            return NextResponse.redirect(`${origin}/admin/onboarding`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=true`);
}
