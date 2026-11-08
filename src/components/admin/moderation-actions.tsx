"use client";

import { useState } from "react";
import { moderatePost, resolveReport } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function ModerationActions({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const act = async (action: "approve" | "hide" | "delete") => {
    setLoading(true);
    await moderatePost(postId, action);
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return <span className="text-xs text-emerald-600">Action applied</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="default" disabled={loading} onClick={() => act("approve")}>
        Approve
      </Button>
      <Button size="sm" variant="secondary" disabled={loading} onClick={() => act("hide")}>
        Hide
      </Button>
      <Button size="sm" variant="danger" disabled={loading} onClick={() => act("delete")}>
        Delete
      </Button>
    </div>
  );
}

export function ReportResolveActions({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const act = async (resolution: "resolved" | "dismissed") => {
    setLoading(true);
    await resolveReport(reportId, resolution);
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return <span className="text-xs text-emerald-600">Report closed</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="default" disabled={loading} onClick={() => act("resolved")}>
        Resolve
      </Button>
      <Button size="sm" variant="ghost" disabled={loading} onClick={() => act("dismissed")}>
        Dismiss
      </Button>
    </div>
  );
}
