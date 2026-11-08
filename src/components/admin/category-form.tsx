"use client";

import { useState } from "react";
import { updateCategory } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/database";

export function CategoryForm({ category }: { category?: Category }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    if (category) formData.set("id", category.id);

    const result = await updateCategory(formData);
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Saved");
      if (!category) e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input
        name="name_en"
        defaultValue={category?.name_en}
        required
        placeholder="Name (English)"
        className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
      />
      <input
        name="name_sw"
        defaultValue={category?.name_sw}
        placeholder="Name (Swahili)"
        className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
      />
      <input
        name="description_en"
        defaultValue={category?.description_en || ""}
        placeholder="Description (English)"
        className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
      />
      <input
        name="description_sw"
        defaultValue={category?.description_sw || ""}
        placeholder="Description (Swahili)"
        className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
      />
      <input
        name="rules_en"
        defaultValue={category?.rules_en || ""}
        placeholder="Rules"
        className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
      />
      <input
        name="sort_order"
        type="number"
        defaultValue={category?.sort_order ?? 0}
        placeholder="Sort order"
        className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
      />
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={category?.is_active !== false}
            className="rounded"
          />
          Active
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="ai_moderation_enabled"
            value="true"
            defaultChecked={category?.ai_moderation_enabled !== false}
            className="rounded"
          />
          AI moderation
        </label>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving..." : category ? "Update" : "Create"}
        </Button>
        {message && (
          <span className="text-xs text-stone-500">{message}</span>
        )}
      </div>
    </form>
  );
}
