"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") throw new Error("Forbidden");
  return { supabase, user };
}

export async function updateUserRole(userId: string, role: string) {
  const { supabase, user } = await requireAdmin();

  const allowed = ["admin", "moderator", "fact_checker", "member"];
  if (!allowed.includes(role)) return { error: "Invalid role" };

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "update_user_role",
    entity_type: "user",
    entity_id: userId,
    metadata: { role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserStatus(userId: string, status: string) {
  const { supabase, user } = await requireAdmin();

  const allowed = ["active", "suspended", "banned"];
  if (!allowed.includes(status)) return { error: "Invalid status" };

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: `user_${status}`,
    entity_type: "user",
    entity_id: userId,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function moderatePost(
  postId: string,
  action: "approve" | "hide" | "delete",
  reason?: string
) {
  const { supabase, user } = await requireAdmin();

  const statusMap = {
    approve: "published",
    hide: "hidden",
    delete: "deleted",
  } as const;

  const { error } = await supabase
    .from("posts")
    .update({
      status: statusMap[action],
      ai_flagged: action === "approve" ? false : undefined,
    })
    .eq("id", postId);

  if (error) return { error: error.message };

  await supabase.from("moderation_log").insert({
    actor_id: user.id,
    action,
    target_type: "post",
    target_id: postId,
    reason: reason || null,
  });

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: `moderate_post_${action}`,
    entity_type: "post",
    entity_id: postId,
    metadata: { reason },
  });

  revalidatePath("/admin/moderation");
  return { success: true };
}

export async function resolveReport(
  reportId: string,
  resolution: "resolved" | "dismissed",
  note?: string
) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("reports")
    .update({
      status: resolution,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      resolution_note: note || null,
    })
    .eq("id", reportId);

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: `report_${resolution}`,
    entity_type: "report",
    entity_id: reportId,
  });

  revalidatePath("/admin/moderation");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const id = formData.get("id") as string;
  const name_en = formData.get("name_en") as string;
  const name_sw = formData.get("name_sw") as string;
  const description_en = formData.get("description_en") as string;
  const description_sw = formData.get("description_sw") as string;
  const rules_en = formData.get("rules_en") as string;
  const is_active = formData.get("is_active") === "true";
  const ai_moderation_enabled = formData.get("ai_moderation_enabled") === "true";
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (id) {
    const { error } = await supabase
      .from("categories")
      .update({
        name_en,
        name_sw,
        description_en,
        description_sw,
        rules_en,
        is_active,
        ai_moderation_enabled,
        sort_order,
      })
      .eq("id", id);

    if (error) return { error: error.message };
  } else {
    const slug = name_en
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .slice(0, 40);

    const { error } = await supabase.from("categories").insert({
      slug,
      name_en,
      name_sw: name_sw || name_en,
      description_en,
      description_sw,
      rules_en,
      is_active,
      ai_moderation_enabled,
      sort_order,
    });

    if (error) return { error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: id ? "update_category" : "create_category",
    entity_type: "category",
    entity_id: id || null,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true };
}

export async function createFactCheck(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const claim = formData.get("claim") as string;
  const verdict = formData.get("verdict") as string;
  const explanation = formData.get("explanation") as string;
  const sourcesRaw = formData.get("sources") as string;
  const language = (formData.get("language") as string) || "en";

  if (!claim || !verdict || !explanation) {
    return { error: "Claim, verdict, and explanation are required." };
  }

  let sources: { title: string; url: string }[] = [];
  try {
    sources = sourcesRaw ? JSON.parse(sourcesRaw) : [];
  } catch {
    sources = sourcesRaw
      ? sourcesRaw.split("\n").filter(Boolean).map((u) => ({ title: u, url: u }))
      : [];
  }

  const { error } = await supabase.from("fact_checks").insert({
    claim,
    verdict,
    explanation,
    sources,
    author_id: user.id,
    language,
    status: "published",
    published_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "publish_fact_check",
    entity_type: "fact_check",
  });

  revalidatePath("/admin/fact-checks");
  revalidatePath("/c/jamiicheck");
  return { success: true };
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const endsAt = formData.get("ends_at") as string;

  if (!title || !body) return { error: "Title and body required." };

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    author_id: user.id,
    is_active: true,
    ends_at: endsAt || null,
  });

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "create_announcement",
    entity_type: "announcement",
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true };
}

export async function updateSiteSetting(key: string, value: unknown) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase.from("site_settings").upsert({
    key,
    value: JSON.parse(JSON.stringify(value)),
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  });

  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "update_setting",
    entity_type: "site_settings",
    metadata: { key, value },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/ai");
  return { success: true };
}

export async function completeOnboarding(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const siteName = formData.get("site_name") as string;
  const tagline = formData.get("tagline") as string;
  const defaultLanguage = formData.get("default_language") as string;

  await supabase.from("site_settings").upsert([
    { key: "site_name", value: JSON.stringify(siteName), updated_by: user.id },
    { key: "site_tagline", value: JSON.stringify(tagline), updated_by: user.id },
    { key: "default_language", value: JSON.stringify(defaultLanguage), updated_by: user.id },
    { key: "onboarding_complete", value: "true", updated_by: user.id },
  ]);

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "complete_onboarding",
    entity_type: "site_settings",
  });

  revalidatePath("/admin");
  return { success: true };
}
