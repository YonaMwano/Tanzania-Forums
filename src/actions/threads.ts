"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { moderateContent, generateThreadSummary } from "@/lib/ai/groq";

export async function createThread(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a discussion." };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const categoryId = formData.get("category_id") as string;
  const language = (formData.get("language") as string) || "en";

  if (!title || title.length < 5) {
    return { error: "Title must be at least 5 characters." };
  }
  if (!body || body.length < 10) {
    return { error: "Post body must be at least 10 characters." };
  }
  if (!categoryId) {
    return { error: "Please select a category." };
  }

  // AI moderation
  const mod = await moderateContent(`${title}\n\n${body}`);
  if (mod.flagged && mod.confidence > 0.8) {
    return {
      error: `Content flagged for review (${mod.reason}). Please revise and try again.`,
    };
  }

  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({
      category_id: categoryId,
      author_id: user.id,
      title,
      slug,
      language,
      status: mod.flagged ? "pending" : "published",
    })
    .select("id, slug")
    .single();

  if (threadError || !thread) {
    console.error(threadError);
    return { error: "Failed to create discussion. Please try again." };
  }

  const { error: postError } = await supabase.from("posts").insert({
    thread_id: thread.id,
    author_id: user.id,
    body,
    language,
    status: mod.flagged ? "pending" : "published",
    ai_flagged: mod.flagged,
    ai_flag_reason: mod.reason,
    ai_flag_confidence: mod.confidence,
  });

  if (postError) {
    console.error(postError);
    // clean up thread
    await supabase.from("threads").delete().eq("id", thread.id);
    return { error: "Failed to create the first post." };
  }

  revalidatePath("/");
  revalidatePath("/c/[slug]", "page");
  return { success: true, slug: thread.slug };
}

export async function createReply(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to reply." };
  }

  const body = (formData.get("body") as string)?.trim();
  const threadId = formData.get("thread_id") as string;
  const parentId = (formData.get("parent_id") as string) || null;
  const language = (formData.get("language") as string) || "en";

  if (!body || body.length < 2) {
    return { error: "Reply cannot be empty." };
  }
  if (!threadId) {
    return { error: "Missing thread." };
  }

  // Check thread is not locked
  const { data: thread } = await supabase
    .from("threads")
    .select("id, is_locked, slug, title, reply_count, ai_summary")
    .eq("id", threadId)
    .single();

  if (!thread) return { error: "Thread not found." };
  if (thread.is_locked) return { error: "This discussion is locked." };

  const mod = await moderateContent(body);

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      thread_id: threadId,
      author_id: user.id,
      parent_id: parentId,
      body,
      language,
      status: mod.flagged && mod.confidence > 0.85 ? "pending" : "published",
      ai_flagged: mod.flagged,
      ai_flag_reason: mod.reason,
      ai_flag_confidence: mod.confidence,
    })
    .select("id")
    .single();

  if (error || !post) {
    console.error(error);
    return { error: "Failed to post reply." };
  }

  // Auto-generate summary after threshold
  const newCount = (thread.reply_count || 0) + 1;
  if (newCount >= 20 && !thread.ai_summary) {
    // fire and forget summary generation
    generateAndSaveSummary(threadId, thread.title).catch(console.error);
  }

  revalidatePath(`/t/${thread.slug}`);
  return { success: true, postId: post.id };
}

async function generateAndSaveSummary(threadId: string, title: string) {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("body, author:users(handle, display_name)")
    .eq("thread_id", threadId)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(40);

  if (!posts?.length) return;

  const formatted = posts.map((p) => {
    const author = p.author as unknown as
      | { display_name?: string; handle?: string }
      | null;
    return {
      body: p.body,
      author: author?.display_name || author?.handle || "User",
    };
  });

  const summary = await generateThreadSummary(title, formatted);

  await supabase
    .from("threads")
    .update({
      ai_summary: summary,
      ai_summary_generated_at: new Date().toISOString(),
    })
    .eq("id", threadId);

  // log usage
  await supabase.from("ai_usage_log").insert({
    request_type: "summary",
    model: "openai/gpt-oss-120b",
    success: true,
    metadata: { thread_id: threadId },
  });
}

export async function toggleReaction(postId: string, reactionType = "like") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in required." };

  // Check existing
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
    // decrement
    await supabase.rpc("decrement_reaction_count", { post_id: postId }).maybeSingle();
    // fallback manual
    const { data: post } = await supabase
      .from("posts")
      .select("reaction_count")
      .eq("id", postId)
      .single();
    if (post) {
      await supabase
        .from("posts")
        .update({ reaction_count: Math.max(0, (post.reaction_count || 0) - 1) })
        .eq("id", postId);
    }
    return { success: true, added: false };
  }

  await supabase.from("reactions").insert({
    user_id: user.id,
    post_id: postId,
    reaction_type: reactionType,
  });

  const { data: post } = await supabase
    .from("posts")
    .select("reaction_count")
    .eq("id", postId)
    .single();
  if (post) {
    await supabase
      .from("posts")
      .update({ reaction_count: (post.reaction_count || 0) + 1 })
      .eq("id", postId);
  }

  return { success: true, added: true };
}

export async function generateSummaryAction(threadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in required." };

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, slug")
    .eq("id", threadId)
    .single();

  if (!thread) return { error: "Thread not found." };

  await generateAndSaveSummary(thread.id, thread.title);
  revalidatePath(`/t/${thread.slug}`);
  return { success: true };
}
