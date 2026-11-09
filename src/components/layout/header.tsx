"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Globe,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { href: "/", labelEn: "Home", labelSw: "Nyumbani" },
  { href: "/c/siasa", labelEn: "Politics", labelSw: "Siasa" },
  { href: "/c/uhusiano-mapenzi", labelEn: "Relationships", labelSw: "Uhusiano" },
  { href: "/c/uchumi-biashara", labelEn: "Business", labelSw: "Biashara" },
  { href: "/c/tech-gadgets", labelEn: "Tech", labelSw: "Teknolojia" },
  { href: "/c/jamiicheck", labelEn: "JamiiCheck", labelSw: "JamiiCheck" },
  { href: "/trending", labelEn: "Trending", labelSw: "Zinazovuma" },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "required") setAuthOpen(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/80 backdrop-blur-xl dark:border-stone-800/80 dark:bg-stone-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="hidden font-semibold text-stone-900 dark:text-stone-50 sm:block">
              Tanzania Forums
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                {language === "sw" ? item.labelSw : item.labelEn}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:max-w-xs lg:max-w-sm">
            <form
              action="/search"
              className="relative hidden w-full sm:block"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search discussions...", "Tafuta majadiliano...")}
                className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-brand-400"
              />
            </form>

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "sw" : "en")}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              title={t("Switch language", "Badilisha lugha")}
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{language}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              title={t("Toggle theme", "Badilisha mandhari")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/settings"
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                >
                  {user.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user.user_metadata?.full_name?.[0] || "U").toUpperCase()
                  )}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden sm:inline-flex">
                  {t("Sign out", "Toka")}
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen(true)} className="gap-1.5">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Sign in", "Ingia")}</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden dark:text-stone-400 dark:hover:bg-stone-800"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-950 lg:hidden">
            <form action="/search" className="relative mb-3 sm:hidden">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                name="q"
                placeholder={t("Search...", "Tafuta...")}
                className="h-10 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none dark:border-stone-700 dark:bg-stone-900"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  {language === "sw" ? item.labelSw : item.labelEn}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
