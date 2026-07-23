"use client";

import { useActionState } from "react";
import { createTeamAction, joinTeamAction } from "@/app/actions";

type Result = { error: string } | void;

async function createBound(_p: Result, fd: FormData): Promise<Result> {
  return createTeamAction(fd);
}

async function joinBound(_p: Result, fd: FormData): Promise<Result> {
  return joinTeamAction(fd);
}

export function TeamForms() {
  const [createState, createAction, createPending] = useActionState(createBound, undefined);
  const [joinState, joinAction, joinPending] = useActionState(joinBound, undefined);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
      className="playground-dash-grid"
    >
      <form
        action={createAction}
        style={{
          background: "#FFF",
          border: "2px solid #FFE3B3",
          borderRadius: 18,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 17, color: "#2B2118" }}>إنشاء فريق</div>
        <input
          name="name"
          required
          placeholder="مثال: فريق التسويق"
          style={{
            fontSize: 15,
            fontWeight: 600,
            background: "#FFF7EC",
            border: "2px solid #FFE3B3",
            borderRadius: 14,
            padding: "12px 14px",
            outline: "none",
          }}
        />
        {createState?.error ? (
          <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 13 }}>{createState.error}</div>
        ) : null}
        <button
          type="submit"
          disabled={createPending}
          style={{
            background: "#FF6B57",
            color: "#FFF",
            fontWeight: 800,
            padding: 12,
            borderRadius: 999,
            border: "none",
            boxShadow: "0 3px 0 #E04B38",
            cursor: "pointer",
          }}
        >
          {createPending ? "..." : "إنشاء"}
        </button>
      </form>

      <form
        action={joinAction}
        style={{
          background: "#FFF",
          border: "2px solid #FFE3B3",
          borderRadius: 18,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 17, color: "#2B2118" }}>الانضمام برمز</div>
        <input
          name="code"
          required
          placeholder="مثال: MARKETING"
          style={{
            fontSize: 15,
            fontWeight: 600,
            background: "#FFF7EC",
            border: "2px solid #FFE3B3",
            borderRadius: 14,
            padding: "12px 14px",
            outline: "none",
          }}
        />
        {joinState?.error ? (
          <div style={{ color: "#FF6B57", fontWeight: 700, fontSize: 13 }}>{joinState.error}</div>
        ) : null}
        <button
          type="submit"
          disabled={joinPending}
          style={{
            background: "#1FB6A6",
            color: "#FFF",
            fontWeight: 800,
            padding: 12,
            borderRadius: 999,
            border: "none",
            boxShadow: "0 3px 0 #148F82",
            cursor: "pointer",
          }}
        >
          {joinPending ? "..." : "انضمام"}
        </button>
      </form>
    </div>
  );
}
