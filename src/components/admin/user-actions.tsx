"use client";

import { useState } from "react";
import { updateUserRole, updateUserStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  currentStatus: string;
}

export function UserActions({ userId, currentRole, currentStatus }: UserActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleRole = async (role: string) => {
    setLoading(true);
    await updateUserRole(userId, role);
    setLoading(false);
  };

  const handleStatus = async (status: string) => {
    setLoading(true);
    await updateUserStatus(userId, status);
    setLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <select
        defaultValue={currentRole}
        disabled={loading}
        onChange={(e) => handleRole(e.target.value)}
        className="h-8 rounded-md border border-stone-200 bg-white px-2 text-xs dark:border-stone-700 dark:bg-stone-800"
      >
        <option value="member">Member</option>
        <option value="moderator">Moderator</option>
        <option value="fact_checker">Fact-checker</option>
        <option value="admin">Admin</option>
      </select>

      {currentStatus === "active" ? (
        <>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => handleStatus("suspended")}
            className="h-8 text-xs text-amber-600"
          >
            Suspend
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => handleStatus("banned")}
            className="h-8 text-xs text-red-600"
          >
            Ban
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => handleStatus("active")}
          className="h-8 text-xs text-emerald-600"
        >
          Reinstate
        </Button>
      )}
    </div>
  );
}
