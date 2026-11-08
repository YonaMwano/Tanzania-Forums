"use client";

import { useState } from "react";
import { updateSiteSetting } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface SettingsFormProps {
  siteName: string;
  tagline: string;
  defaultLanguage: string;
}

export function SettingsForm({
  siteName: initialName,
  tagline: initialTagline,
  defaultLanguage: initialLang,
}: SettingsFormProps) {
  const [siteName, setSiteName] = useState(initialName);
  const [tagline, setTagline] = useState(initialTagline);
  const [defaultLanguage, setDefaultLanguage] = useState(initialLang);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    await updateSiteSetting("site_name", siteName);
    await updateSiteSetting("site_tagline", tagline);
    await updateSiteSetting("default_language", defaultLanguage);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="mb-4 text-sm font-semibold text-stone-900 dark:text-stone-50">
        Site identity
      </h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Site name
          </label>
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="h-10 w-full max-w-md rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Tagline
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="h-10 w-full max-w-md rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Default language
          </label>
          <select
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value)}
            className="h-10 rounded-lg border border-stone-200 px-3 text-sm dark:border-stone-700 dark:bg-stone-800"
          >
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading} size="sm">
            {loading ? "Saving..." : "Save settings"}
          </Button>
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}
