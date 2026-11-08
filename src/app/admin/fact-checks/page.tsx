import { createClient } from "@/lib/supabase/server";
import { FactCheckForm } from "@/components/admin/fact-check-form";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { FactCheck } from "@/types/database";

export const metadata = { title: "JamiiCheck — Admin" };

const verdictColors: Record<string, "success" | "danger" | "accent" | "secondary" | "default"> = {
  true: "success",
  false: "danger",
  misleading: "accent",
  unverified: "secondary",
  satire: "default",
};

export default async function AdminFactChecksPage() {
  const supabase = await createClient();

  const { data: factChecks } = await supabase
    .from("fact_checks")
    .select("*, author:users(handle, display_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          JamiiCheck
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Create and manage fact-checks
        </p>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Publish a fact-check
        </h2>
        <FactCheckForm />
      </div>

      {/* Existing */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Published ({factChecks?.length ?? 0})
        </h2>
        {(factChecks as FactCheck[] | null)?.length ? (
          (factChecks as FactCheck[]).map((fc) => (
            <div
              key={fc.id}
              className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={verdictColors[fc.verdict] || "secondary"} className="capitalize">
                  {fc.verdict}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  {fc.language}
                </Badge>
                <span className="text-xs text-stone-400">
                  {formatRelativeTime(fc.created_at)}
                </span>
              </div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100">
                {fc.claim}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                {fc.explanation}
              </p>
              {fc.sources?.length > 0 && (
                <div className="mt-2 text-xs text-stone-400">
                  {fc.sources.length} source{fc.sources.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-stone-200 px-6 py-10 text-center text-sm text-stone-400 dark:border-stone-700">
            No fact-checks published yet
          </div>
        )}
      </div>
    </div>
  );
}
