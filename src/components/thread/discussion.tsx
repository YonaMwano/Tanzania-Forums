"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostItem } from "./post-item";
import { ReplyComposer } from "./reply-composer";
import type { Post } from "@/types/database";

export function Discussion({ posts, threadId, authorId, currentUserId, locked }: {
  posts: Post[]; threadId: string; authorId: string; currentUserId?: string; locked: boolean;
}) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const router = useRouter();
  return <>
    {posts.map(post => <div key={post.id}>
      <PostItem post={post} isOP={post.author_id === authorId} depth={post.parent_id ? 1 : 0} currentUserId={currentUserId} onReply={locked ? undefined : setReplyTo} />
      {post.parent_id && <a href={`#post-${post.parent_id}`} className="text-xs text-brand-600">View parent reply</a>}
      {!locked && replyTo === post.id && <ReplyComposer threadId={threadId} parentId={post.id} currentUserId={currentUserId} autoFocus onCancel={() => setReplyTo(null)} onSuccess={() => { setReplyTo(null); router.refresh(); }} />}
    </div>)}
    <div className="mt-8">{locked ? <p className="text-stone-500">This discussion is locked for new replies.</p> : <ReplyComposer threadId={threadId} currentUserId={currentUserId} onSuccess={() => router.refresh()} />}</div>
  </>;
}
