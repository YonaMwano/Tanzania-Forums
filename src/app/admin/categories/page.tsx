import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/admin/category-form";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/database";

export const metadata = { title: "Categories — Admin" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Categories
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Create, edit, and reorder forum categories
        </p>
      </div>

      {/* Existing categories */}
      <div className="space-y-3">
        {(categories as Category[] | null)?.map((cat) => (
          <div
            key={cat.id}
            className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h3 className="font-semibold text-stone-900 dark:text-stone-50">
                    {cat.name_en}
                  </h3>
                  <span className="text-sm text-stone-400">/ {cat.name_sw}</span>
                </div>
                <p className="mt-1 text-sm text-stone-500">{cat.description_en}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">/{cat.slug}</Badge>
                  <Badge variant={cat.is_active ? "success" : "secondary"}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant={cat.ai_moderation_enabled ? "default" : "secondary"}>
                    AI mod {cat.ai_moderation_enabled ? "on" : "off"}
                  </Badge>
                  <span className="text-xs text-stone-400">
                    {cat.thread_count} threads · order {cat.sort_order}
                  </span>
                </div>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-brand-600">
                Edit
              </summary>
              <div className="mt-3">
                <CategoryForm category={cat} />
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Create new */}
      <div className="rounded-xl border border-dashed border-stone-300 p-6 dark:border-stone-700">
        <h2 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-50">
          Create category
        </h2>
        <CategoryForm />
      </div>
    </div>
  );
}
