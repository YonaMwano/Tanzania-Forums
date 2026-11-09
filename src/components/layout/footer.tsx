"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-semibold text-stone-900 dark:text-stone-50">
                Tanzania Forums
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t(
                "Tanzania's open forum for ideas, truth, and community.",
                "Jukwaa la wazi la Tanzania kwa mawazo, ukweli, na jamii."
              )}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-50">
              {t("Community", "Jamii")}
            </h3>
            <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
              <li>
                <Link href="/c/jamiicheck" className="hover:text-brand-600 dark:hover:text-brand-400">
                  JamiiCheck
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-brand-600 dark:hover:text-brand-400">
                  {t("Trending", "Zinazovuma")}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 border-t border-stone-200 pt-6 text-center text-sm text-stone-400 dark:border-stone-800">
          &copy; {new Date().getFullYear()} Tanzania Forums.{" "}
          {t("All rights reserved.", "Haki zote zimehifadhiwa.")}
        </div>
      </div>
    </footer>
  );
}
