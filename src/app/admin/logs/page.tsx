import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Audit logs — Admin" };

export default async function AdminLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_log")
    .select("*, actor:users(handle, display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Audit logs
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Auth events, admin actions, moderation, and system changes
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 dark:border-stone-800 dark:bg-stone-800/50">
                <th className="px-4 py-3 font-medium text-stone-500">Time</th>
                <th className="px-4 py-3 font-medium text-stone-500">Actor</th>
                <th className="px-4 py-3 font-medium text-stone-500">Action</th>
                <th className="px-4 py-3 font-medium text-stone-500">Entity</th>
                <th className="px-4 py-3 font-medium text-stone-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                  <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                    {formatRelativeTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                    {(log.actor as { display_name?: string; handle?: string })?.display_name ||
                      (log.actor as { handle?: string })?.handle ||
                      "System"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {log.entity_type || "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-stone-400">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs?.length && (
          <p className="px-4 py-12 text-center text-sm text-stone-400">
            No audit events yet
          </p>
        )}
      </div>
    </div>
  );
}
