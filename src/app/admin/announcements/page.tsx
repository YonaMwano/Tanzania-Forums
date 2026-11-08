import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Announcements — Admin" };

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:users(handle, display_name)")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Announcements
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Site-wide banners and notices
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Create announcement
        </h2>
        <AnnouncementForm />
      </div>

      <div className="space-y-3">
        {announcements?.length ? (
          announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-stone-900 dark:text-stone-100">
                  {a.title}
                </h3>
                <Badge variant={a.is_active ? "success" : "secondary"}>
                  {a.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-stone-500">{a.body}</p>
              <div className="mt-2 text-xs text-stone-400">
                {formatRelativeTime(a.created_at)}
                {a.ends_at && ` · ends ${formatRelativeTime(a.ends_at)}`}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-stone-200 px-6 py-10 text-center text-sm text-stone-400 dark:border-stone-700">
            No announcements yet
          </div>
        )}
      </div>
    </div>
  );
}
