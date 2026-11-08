"use client";

import { useState } from "react";
import { createAnnouncement } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function AnnouncementForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createAnnouncement(formData);
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Announcement created");
      e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="title"
        required
        placeholder="Title"
        className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
      />
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Announcement body..."
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
      />
      <div>
        <label className="mb-1 block text-xs text-stone-500">
          End date (optional)
        </label>
        <input
          name="ends_at"
          type="datetime-local"
          className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create announcement"}
        </Button>
        {message && <span className="text-xs text-stone-500">{message}</span>}
      </div>
    </form>
  );
}
