"use client";

import { useState } from "react";
import { updateSiteSetting } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface AISettingsFormProps {
  moderationEnabled: boolean;
  summaryThreshold: number;
}

export function AISettingsForm({
  moderationEnabled: initialMod,
  summaryThreshold: initialThreshold,
}: AISettingsFormProps) {
  const [moderationEnabled, setModerationEnabled] = useState(initialMod);
  const [summaryThreshold, setSummaryThreshold] = useState(initialThreshold);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    await updateSiteSetting("ai_moderation_enabled", moderationEnabled);
    await updateSiteSetting("ai_summary_threshold", summaryThreshold);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-50">
        Settings
      </h2>

      <div className="space-y-5">
        <label className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              AI content moderation
            </p>
            <p className="text-xs text-stone-400">
              Automatically flag posts for hate speech, spam, and misinformation
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={moderationEnabled}
            onClick={() => setModerationEnabled(!moderationEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              moderationEnabled ? "bg-brand-600" : "bg-stone-300 dark:bg-stone-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                moderationEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </label>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-800 dark:text-stone-200">
            Auto-summary threshold (replies)
          </label>
          <input
            type="number"
            min={5}
            max={100}
            value={summaryThreshold}
            onChange={(e) => setSummaryThreshold(Number(e.target.value))}
            className="h-10 w-32 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
          />
          <p className="mt-1 text-xs text-stone-400">
            Generate an AI summary automatically after this many replies
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading} size="sm">
            {loading ? "Saving..." : "Save settings"}
          </Button>
          {saved && (
            <span className="text-xs text-emerald-600">Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
