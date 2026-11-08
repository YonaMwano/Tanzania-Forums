export type UserRole = "admin" | "moderator" | "fact_checker" | "member";
export type UserStatus = "active" | "suspended" | "banned";
export type ContentStatus = "published" | "hidden" | "deleted" | "pending";
export type LanguageCode = "en" | "sw";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type FactCheckVerdict = "true" | "false" | "misleading" | "unverified" | "satire";

export interface User {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  reputation: number;
  preferred_language: LanguageCode;
  is_verified: boolean;
  notification_prefs: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  privacy_settings: {
    show_email: boolean;
    show_activity: boolean;
  };
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_sw: string;
  description_en: string | null;
  description_sw: string | null;
  rules_en: string | null;
  rules_sw: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  thread_count: number;
  post_count: number;
  ai_moderation_enabled: boolean;
  ai_sensitivity: number;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  slug: string;
  language: LanguageCode;
  status: ContentStatus;
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  view_count: number;
  reply_count: number;
  reaction_count: number;
  last_activity_at: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  has_verified_sources: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined
  author?: User;
  category?: Category;
}

export interface Post {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  language: LanguageCode;
  status: ContentStatus;
  is_answer: boolean;
  reaction_count: number;
  reply_count: number;
  ai_flagged: boolean;
  ai_flag_reason: string | null;
  ai_flag_confidence: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  author?: User;
  replies?: Post[];
}

export interface FactCheck {
  id: string;
  claim: string;
  verdict: FactCheckVerdict;
  explanation: string;
  sources: { title: string; url: string }[];
  author_id: string;
  language: LanguageCode;
  status: ContentStatus;
  linked_thread_ids: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface Report {
  id: string;
  reporter_id: string;
  post_id: string | null;
  thread_id: string | null;
  user_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  priority: number;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}
