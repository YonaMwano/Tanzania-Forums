import { createClient } from "@/lib/supabase/server";
import {
  ModerationActions,
  ReportResolveActions,
} from "@/components/admin/moderation-actions";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Moderation — Admin" };

export default async function AdminModerationPage() {
  const supabase = await createClient();

  const [{ data: flaggedRaw }, { data: reportsRaw }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, body, ai_flag_reason, ai_flag_confidence, status, created_at, author:users(handle, display_name), thread:threads(title, slug)"
      )
      .eq("ai_flagged", true)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("reports")
      .select(
        "id, reason, details, status, priority, created_at, reporter:users!reporter_id(handle), post:posts(id, body), thread:threads(title, slug)"
      )
      .in("status", ["open", "reviewing"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  type FlaggedPost = {
    id: string;
    body: string;
    ai_flag_reason: string | null;
    ai_flag_confidence: number | null;
    status: string;
    created_at: string;
    author?: { handle?: string; display_name?: string } | null;
    thread?: { title?: string; slug?: string } | null;
  };

  type OpenReport = {
    id: string;
    reason: string;
    details: string | null;
    status: string;
    priority: number;
    created_at: string;
    post?: { id?: string; body?: string } | null;
  };

  const flaggedPosts = flaggedRaw as unknown as FlaggedPost[] | null;
  const openReports = reportsRaw as unknown as OpenReport[] | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Content moderation
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Review AI-flagged posts and user reports
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
          AI-flagged queue ({flaggedPosts?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {flaggedPosts?.length ? (
            flaggedPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="danger">{post.ai_flag_reason || "flagged"}</Badge>
                  <span className="text-xs text-stone-400">
                    {Math.round((post.ai_flag_confidence || 0) * 100)}% confidence
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {post.status}
                  </Badge>
                  <span className="text-xs text-stone-400">
                    {formatRelativeTime(post.created_at)}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm text-stone-700 dark:text-stone-300">
                  {post.body}
                </p>
                <div className="mt-2 text-xs text-stone-400">
                  by {post.author?.display_name || post.author?.handle} in{" "}
                  <span className="font-medium">{post.thread?.title}</span>
                </div>
                <div className="mt-3">
                  <ModerationActions postId={post.id} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 px-6 py-10 text-center text-sm text-stone-400 dark:border-stone-700">
              No AI-flagged content pending review
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-stone-700 dark:text-stone-300">
          Open reports ({openReports?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {openReports?.length ? (
            openReports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{report.reason}</Badge>
                  <span className="text-xs text-stone-400">
                    priority {report.priority}
                  </span>
                  <span className="text-xs text-stone-400">
                    {formatRelativeTime(report.created_at)}
                  </span>
                </div>
                {report.details && (
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {report.details}
                  </p>
                )}
                {report.post?.body && (
                  <p className="mt-2 line-clamp-2 rounded-lg bg-stone-50 p-2 text-xs text-stone-500 dark:bg-stone-800">
                    {report.post.body}
                  </p>
                )}
                <div className="mt-3">
                  <ReportResolveActions reportId={report.id} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 px-6 py-10 text-center text-sm text-stone-400 dark:border-stone-700">
              No open reports
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
