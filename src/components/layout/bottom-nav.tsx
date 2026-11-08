"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Search, PlusCircle, User } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  const items = [
    { href: "/", icon: Home, label: t("Home", "Nyumbani") },
    { href: "/trending", icon: TrendingUp, label: t("Trending", "Zinazovuma") },
    { href: "#new", icon: PlusCircle, label: t("New", "Mpya"), action: "new" },
    { href: "/search", icon: Search, label: t("Search", "Tafuta") },
    { href: user ? "/settings" : "#auth", icon: User, label: t("You", "Wewe"), action: user ? undefined : "auth" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/90 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90 lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {items.map((item) => {
            const isActive = item.href !== "#new" && item.href !== "#auth" && pathname === item.href;
            const Icon = item.icon;

            if (item.action === "new" || item.action === "auth") {
              return (
                <button
                  key={item.label}
                  onClick={() => setAuthOpen(true)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-stone-500 dark:text-stone-400"
                >
                  <Icon className={cn("h-5 w-5", item.action === "new" && "text-brand-600 dark:text-brand-400")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1",
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-stone-500 dark:text-stone-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        message={t(
          "Sign in with Google to start a discussion.",
          "Ingia na Google kuanza majadiliano."
        )}
      />
    </>
  );
}
