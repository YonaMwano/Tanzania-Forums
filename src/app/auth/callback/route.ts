import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });

          if (count === 1) {
            return NextResponse.redirect(`${origin}/admin/onboarding`);
          }
        }
      }

      const redirectPath = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(new URL(redirectPath, origin));
    }
  }

  return NextResponse.redirect(new URL("/?auth_error=true", origin));
}
