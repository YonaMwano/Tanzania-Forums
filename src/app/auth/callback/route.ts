import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  // Server adapters can expose an internal loopback URL behind the public site.
  const origin = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    ? "https://lucent-elf-caf82b.netlify.app"
    : url.origin;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/";
  let next = "/";
  try {
    const destination = new URL(requestedNext, origin);
    if (destination.origin === origin) {
      next = `${destination.pathname}${destination.search}`;
    }
  } catch {
    // Invalid return paths land on the home page.
  }

  if (searchParams.has("error")) {
    return NextResponse.redirect(`${origin}/?auth_error=true`);
  }

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
