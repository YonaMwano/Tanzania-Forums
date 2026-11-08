import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value");

  const map: Record<string, unknown> = {};
  settings?.forEach((s) => {
    try {
      map[s.key] = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
    } catch {
      map[s.key] = s.value;
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Site settings
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Identity, defaults, and configuration
        </p>
      </div>

      <SettingsForm
        siteName={String(map.site_name || "Tanzania Forums")}
        tagline={String(
          map.site_tagline ||
            "Tanzania's open forum for ideas, truth, and community."
        )}
        defaultLanguage={String(map.default_language || "en")}
      />

      <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Security notes
        </h2>
        <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
          <li>Authentication is Google OAuth only (enforced).</li>
          <li>Admin routes are protected by role-based middleware.</li>
          <li>All admin actions are recorded in the audit log.</li>
          <li>API keys (Groq, Supabase) are stored as environment variables and never exposed to the client.</li>
          <li>First Google sign-in is automatically promoted to Admin (one-time bootstrap).</li>
        </ul>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Environment
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">Supabase URL</dt>
            <dd className="font-mono text-xs text-stone-700 dark:text-stone-300">
              {process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40)}...
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Groq API</dt>
            <dd className="text-stone-700 dark:text-stone-300">
              {process.env.GROQ_API_KEY ? "Configured" : "Missing"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Site URL</dt>
            <dd className="text-stone-700 dark:text-stone-300">
              {process.env.NEXT_PUBLIC_SITE_URL || "Not set"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
