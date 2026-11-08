import { createClient } from "@/lib/supabase/server";
import { AISettingsForm } from "@/components/admin/ai-settings-form";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "AI / Groq — Admin" };

export default async function AdminAIPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: usage }, { count: totalCalls }] =
    await Promise.all([
      supabase.from("site_settings").select("key, value"),
      supabase
        .from("ai_usage_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("ai_usage_log").select("*", { count: "exact", head: true }),
    ]);

  const settingsMap: Record<string, unknown> = {};
  settings?.forEach((s) => {
    try {
      settingsMap[s.key] = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
    } catch {
      settingsMap[s.key] = s.value;
    }
  });

  const successCount = usage?.filter((u) => u.success).length ?? 0;
  const errorCount = usage?.filter((u) => !u.success).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          AI / Groq controls
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Moderation thresholds, summary settings, and usage
        </p>
      </div>

      {/* Usage stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm text-stone-500">Total AI calls</p>
          <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-50">
            {totalCalls ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm text-stone-500">Recent success</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{successCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm text-stone-500">Recent errors</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{errorCount}</p>
        </div>
      </div>

      {/* Settings form */}
      <AISettingsForm
        moderationEnabled={settingsMap.ai_moderation_enabled !== false}
        summaryThreshold={Number(settingsMap.ai_summary_threshold) || 20}
      />

      {/* Model info */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Model configuration
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">Model</dt>
            <dd className="font-mono text-stone-800 dark:text-stone-200">
              openai/gpt-oss-120b
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Provider</dt>
            <dd className="text-stone-800 dark:text-stone-200">Groq</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">Features</dt>
            <dd className="text-stone-800 dark:text-stone-200">
              Summaries, content moderation
            </dd>
          </div>
        </dl>
      </div>

      {/* Recent usage */}
      <div className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="border-b border-stone-100 px-5 py-3 dark:border-stone-800">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            Recent AI calls
          </h2>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {usage?.length ? (
            usage.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {u.request_type}
                  </span>
                  <span className="ml-2 font-mono text-xs text-stone-400">
                    {u.model}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <span className={u.success ? "text-emerald-600" : "text-red-600"}>
                    {u.success ? "OK" : "Error"}
                  </span>
                  {u.latency_ms && <span>{u.latency_ms}ms</span>}
                  <span>{formatRelativeTime(u.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-sm text-stone-400">
              No AI usage logged yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
