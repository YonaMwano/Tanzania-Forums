"use client";

import { useState } from "react";
import { createFactCheck } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function FactCheckForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createFactCheck(formData);
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Fact-check published");
      e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
          Claim
        </label>
        <textarea
          name="claim"
          required
          rows={2}
          placeholder="The claim being checked..."
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Verdict
          </label>
          <select
            name="verdict"
            required
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
          >
            <option value="true">True</option>
            <option value="false">False</option>
            <option value="misleading">Misleading</option>
            <option value="unverified">Unverified</option>
            <option value="satire">Satire</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Language
          </label>
          <select
            name="language"
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
          Explanation
        </label>
        <textarea
          name="explanation"
          required
          rows={4}
          placeholder="Detailed explanation of the verdict..."
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
          Sources (one URL per line)
        </label>
        <textarea
          name="sources"
          rows={3}
          placeholder="https://example.com/source1&#10;https://example.com/source2"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Publishing..." : "Publish fact-check"}
        </Button>
        {message && <span className="text-xs text-stone-500">{message}</span>}
      </div>
    </form>
  );
}
