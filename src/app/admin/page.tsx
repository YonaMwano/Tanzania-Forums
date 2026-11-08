import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  MessageSquare,
  Flag,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: newToday },
    { count: totalThreads },
    { count: postsToday },
    { count: openReports },
    { count: aiFlags },
    { count: factChecks },
    { data: recentReports },
    { data: recentFlags },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase.from("threads").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("ai_flagged", true)
      .eq("status", "pending"),
    supabase
      .from("fact_checks")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("reports")
      .select("id, reason, created_at, status")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id, ai_flag_reason, ai_flag_confidence, created_at, body")
      .eq("ai_flagged", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const kpis = [
    { label: "Total users", value: totalUsers ?? 0, icon: Users, href: "/admin/users" },
    { label: "New today", value: newToday ?? 0, icon: Users, href: "/admin/users" },
    { label: "Active threads", value: totalThreads ?? 0, icon: MessageSquare, href: "/" },
    { label: "Posts today", value: postsToday ?? 0, icon: MessageSquare, href: "/" },
    { label: "Open reports", value: openReports ?? 0, icon: Flag, href: "/admin/moderation", alert: (openReports ?? 0) > 0 },
    { label: "AI flags", value: aiFlags ?? 0, icon: AlertTriangle, href: "/admin/moderation", alert: (aiFlags ?? 0) > 0 },
    { label: "Fact-checks", value: factChecks ?? 0, icon: ShieldCheck, href: "/admin/fact-checks" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">System overview and quick actions</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`rounded-xl border bg-white p-5 transition hover:border-brand-300 dark:bg-stone-900 dark:hover:border-brand-700 ${
                kpi.alert
                  ? "border-amber-300 dark:border-amber-700"
                  : "border-stone-200 dark:border-stone-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 dark:text-stone-400">{kpi.label}</span>
                <Icon className={`h-4 w-4 ${kpi.alert ? "text-amber-500" : "text-stone-400"}`} />
              </div>
              <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-50">
                {kpi.value}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction href="/admin/moderation" label="Review flagged content" icon={Shield} />
        <QuickAction href="/admin/fact-checks" label="Publish fact-check" icon={ShieldCheck} />
        <QuickAction href="/admin/announcements" label="Broadcast announcement" icon={Sparkles} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open reports */}
        <section className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Open reports
            </h2>
            <Link href="/admin/moderation" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentReports?.length ? (
              recentReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-stone-700 dark:text-stone-300">{r.reason}</span>
                  <span className="text-xs text-stone-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-400">No open reports</p>
            )}
          </div>
        </section>

        {/* AI flags */}
        <section className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3 dark:border-stone-800">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              Recent AI flags
            </h2>
            <Link href="/admin/moderation" className="text-xs text-brand-600 hover:underline">
              Review queue
            </Link>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentFlags?.length ? (
              recentFlags.map((f) => (
                <div key={f.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {f.ai_flag_reason || "flagged"}
                    </span>
                    <span className="text-xs text-stone-400">
                      {Math.round((f.ai_flag_confidence || 0) * 100)}% conf.
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-stone-400">{f.body}</p>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-400">No AI flags</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 transition hover:border-brand-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-brand-700"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-brand-600" />
        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-stone-400" />
    </Link>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
