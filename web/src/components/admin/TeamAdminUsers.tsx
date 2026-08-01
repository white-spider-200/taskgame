"use client";

import { useState, useTransition } from "react";
import { blockMemberAction, unblockMemberAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import type { AdminMemberDTO } from "@/lib/admin";

export function TeamAdminUsers({
  teamId,
  initial,
}: {
  teamId: string;
  initial: AdminMemberDTO[];
}) {
  const [members, setMembers] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function toggleBlock(memberId: string, blocked: boolean) {
    setError("");
    setBusyId(memberId);
    startTransition(async () => {
      const action = blocked ? unblockMemberAction : blockMemberAction;
      const res = await action(teamId, memberId);
      if (res?.error) {
        setError(res.error);
      } else {
        setMembers((list) =>
          list.map((m) => (m.id === memberId ? { ...m, blocked: !blocked } : m)),
        );
      }
      setBusyId(null);
    });
  }

  return (
    <section>
      {error ? (
        <div
          style={{
            background: "#FFE9E5",
            border: "2px solid #FF6B57",
            color: "#B3301E",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 16,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>
        الأعضاء ({members.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {members.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#FFFFFF",
              border: "2px solid #FFE3B3",
              borderRadius: 14,
              padding: "12px 16px",
              opacity: m.blocked ? 0.6 : 1,
              flexWrap: "wrap",
            }}
          >
            <Avatar url={m.avatarUrl} initial={m.initial} color={m.color} size={40} />
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {m.name}
                {m.role === "owner" ? (
                  <span
                    style={{
                      marginInlineStart: 8,
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#7A5A00",
                      background: "#FFE9A8",
                      border: "1px solid #F2C94C",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    مالك
                  </span>
                ) : null}
                {m.blocked ? (
                  <span
                    style={{
                      marginInlineStart: 8,
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#B3301E",
                      background: "#FFE9E5",
                      border: "1px solid #FF6B57",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    محظور
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 12, color: "#9A8A73" }}>{m.email}</div>
            </div>

            <div style={{ display: "flex", gap: 18, fontSize: 13, color: "#7A6A55" }}>
              <div>
                <b>{m.basePoints}</b> نقطة أساس
              </div>
              <div>
                <b>{m.tasksCompleted}</b> مهمة مكتملة
              </div>
              <div>
                متوسط التقييم:{" "}
                <b>
                  {m.avgRatingReceived != null ? m.avgRatingReceived.toFixed(1) : "—"}
                </b>
              </div>
            </div>

            {m.role !== "owner" ? (
              <button
                type="button"
                disabled={pending && busyId === m.id}
                onClick={() => toggleBlock(m.id, m.blocked)}
                style={{
                  marginInlineStart: "auto",
                  cursor: "pointer",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: "#FFFFFF",
                  background: m.blocked ? "#1FB6A6" : "#FF6B57",
                  opacity: pending && busyId === m.id ? 0.6 : 1,
                }}
              >
                {m.blocked ? "إلغاء الحظر" : "حظر وإزالة من الفريق"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
