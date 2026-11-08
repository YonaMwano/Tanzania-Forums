import { createClient } from "@/lib/supabase/server";
import { UserActions } from "@/components/admin/user-actions";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { User } from "@/types/database";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const roleVariant: Record<string, "default" | "secondary" | "accent" | "danger" | "success"> = {
    admin: "danger",
    moderator: "default",
    fact_checker: "success",
    member: "secondary",
  };

  const statusVariant: Record<string, "success" | "accent" | "danger"> = {
    active: "success",
    suspended: "accent",
    banned: "danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Users</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage roles, status, and reputation
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 dark:border-stone-800 dark:bg-stone-800/50">
                <th className="px-4 py-3 font-medium text-stone-500">User</th>
                <th className="px-4 py-3 font-medium text-stone-500">Role</th>
                <th className="px-4 py-3 font-medium text-stone-500">Status</th>
                <th className="px-4 py-3 font-medium text-stone-500">Reputation</th>
                <th className="px-4 py-3 font-medium text-stone-500">Joined</th>
                <th className="px-4 py-3 font-medium text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {(users as User[] | null)?.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      {u.display_name || u.handle}
                    </div>
                    <div className="text-xs text-stone-400">@{u.handle}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[u.role] || "secondary"} className="capitalize">
                      {u.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[u.status] || "secondary"} className="capitalize">
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                    {u.reputation}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {formatRelativeTime(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <UserActions userId={u.id} currentRole={u.role} currentStatus={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users?.length && (
          <p className="px-4 py-12 text-center text-sm text-stone-400">No users yet</p>
        )}
      </div>
    </div>
  );
}
