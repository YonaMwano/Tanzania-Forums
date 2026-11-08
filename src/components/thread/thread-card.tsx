import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Thread, Category, User } from "@/types/database";

interface ThreadCardProps {
  thread: Thread & {
    author?: Pick<User, "handle" | "display_name" | "is_verified">;
    category?: Pick<Category, "slug" | "name_en" | "name_sw" | "color">;
  };
  showCategory?: boolean;
}

export function ThreadCard({ thread, showCategory = true }: ThreadCardProps) {
  return (
    <Link
      href={`/t/${thread.slug}`}
      className="group block rounded-xl border border-transparent px-4 py-3.5 transition-all hover:border-stone-200 hover:bg-stone-50 dark:hover:border-stone-700 dark:hover:bg-stone-800/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-stone-900 group-hover:text-brand-700 dark:text-stone-100 dark:group-hover:text-brand-400 sm:text-[15px]">
            {thread.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showCategory && thread.category && (
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={{
                  backgroundColor: `${thread.category.color}18`,
                  color: thread.category.color,
                }}
              >
                {thread.category.name_en}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {thread.language}
            </Badge>
            {thread.ai_summary && (
              <Badge variant="accent" className="gap-1 text-[10px]">
                <Sparkles className="h-3 w-3" />
                AI Summary
              </Badge>
            )}
            {thread.is_pinned && (
              <Badge variant="default" className="text-[10px]">
                Pinned
              </Badge>
            )}
          </div>

          {thread.author && (
            <p className="mt-2 text-xs text-stone-400">
              {thread.author.display_name || thread.author.handle}
              {thread.author.is_verified && (
                <span className="ml-1 text-accent-600">· verified</span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {thread.reply_count}
          </span>
          <span>{formatRelativeTime(thread.last_activity_at)}</span>
        </div>
      </div>
    </Link>
  );
}
