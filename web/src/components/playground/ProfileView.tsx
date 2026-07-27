"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateAvatarAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { computeBadges } from "@/lib/badges";
import { fmtDur, starsStr } from "@/lib/format";
import type { TaskDTO, TeamMember } from "@/lib/team";

type Props = {
  me: TeamMember;
  teamName: string;
  myPoints: number;
  myDoneTasks: TaskDTO[];
  myRecentTasks: TaskDTO[];
  myAvg: string;
  myTime: string;
};

export function ProfileView({
  me,
  teamName,
  myPoints,
  myDoneTasks,
  myRecentTasks,
  myAvg,
  myTime,
}: Props) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const badges = computeBadges(myDoneTasks);
  const earnedKey = badges
    .filter((b) => b.earned)
    .map((b) => b.id)
    .join(",");
  const [newlyEarned, setNewlyEarned] = useState<typeof badges>(() => {
    if (typeof window === "undefined") return [];
    const seen = new Set<string>(
      JSON.parse(localStorage.getItem(`badges-seen-${me.id}`) || "[]"),
    );
    return badges.filter((b) => b.earned && !seen.has(b.id));
  });

  useEffect(() => {
    localStorage.setItem(
      `badges-seen-${me.id}`,
      JSON.stringify(earnedKey ? earnedKey.split(",") : []),
    );
  }, [me.id, earnedKey]);

  function onFileChange(file: File | null) {
    if (!file) return;
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await updateAvatarAction(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (res?.ok) {
        setAvatarUrl(res.avatarUrl);
        router.refresh();
      }
    });
  }

  return (
        <div
          style={{
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            maxWidth: 680,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {newlyEarned.length ? (
            <div
              style={{
                position: "fixed",
                top: 20,
                insetInlineEnd: 20,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {newlyEarned.map((b) => (
                <div
                  key={b.id}
                  onClick={() =>
                    setNewlyEarned((cur) => cur.filter((x) => x.id !== b.id))
                  }
                  className="proof-card"
                  style={{
                    cursor: "pointer",
                    background: "#2B2118",
                    color: "#FFF",
                    borderRadius: 16,
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "0 8px 24px rgba(43,33,24,0.25)",
                    border: `2px solid ${b.border}`,
                  }}
                >
                  <span className="finish-cheer" style={{ fontSize: 26 }}>
                    {b.icon}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#F2C94C" }}>
                      شارة جديدة!
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div
            style={{
              background: "#2B2118",
              borderRadius: 22,
              padding: "22px 24px",
              color: "#FFF",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                left: -30,
                width: 120,
                height: 120,
                borderRadius: 999,
                background: "rgba(242,201,76,0.15)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label
                style={{
                  position: "relative",
                  cursor: "pointer",
                  display: "inline-block",
                }}
                title="تغيير الصورة الشخصية"
              >
                <Avatar
                  url={avatarUrl}
                  initial={me.initial}
                  color={me.color}
                  size={64}
                  style={{ fontSize: 26, border: "3px solid #F2C94C" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    insetInlineEnd: -2,
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: "#F2C94C",
                    color: "#4A3600",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    border: "2px solid #2B2118",
                  }}
                >
                  ✏️
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
              </label>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 21 }}>{me.name}</div>
                <div
                  style={{ fontSize: 13.5, color: "#C9C0B4", fontWeight: 500 }}
                >
                  {teamName}
                </div>
                {error ? (
                  <div
                    style={{ fontSize: 12.5, color: "#FF9F9F", fontWeight: 600, marginTop: 4 }}
                  >
                    {error}
                  </div>
                ) : null}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#F2C94C" }}>
                  {myPoints}
                </div>
                <div
                  style={{ fontSize: 12.5, color: "#C9C0B4", fontWeight: 600 }}
                >
                  ⭐ نقطة
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.12)",
                position: "relative",
              }}
            >
              {badges.map((b) => {
                const locked = !b.earned;
                return (
                  <div
                    key={b.id}
                    title={b.label}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      background: b.bg,
                      border: locked
                        ? `2px dashed ${b.border}`
                        : `2px solid ${b.border}`,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      opacity: locked ? 0.35 : 1,
                      transform: `rotate(${b.rot}deg)`,
                    }}
                  >
                    {b.icon}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {[
              [myDoneTasks.length, "مهمة منجزة", "#FF6B57"],
              [`${myAvg} ★`, "متوسط التقييم", "#B87A00"],
              [myTime, "متوسط الوقت", "#0E8A7D"],
            ].map(([val, label, color]) => (
              <div
                key={String(label)}
                style={{
                  background: "#FFF",
                  border: "2px solid #FFE3B3",
                  borderRadius: 16,
                  padding: "12px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: String(color) }}>
                  {val}
                </div>
                <div
                  style={{ fontSize: 12.5, color: "#9A8A73", fontWeight: 600 }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              background: "#FFF",
              border: "2px solid #FFE3B3",
              borderRadius: 18,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "#2B2118",
                marginBottom: 10,
              }}
            >
              آخر مهامي
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 14,
              }}
            >
              {myRecentTasks.map((mt) => (
                <div
                  key={mt.id}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ flex: 1, fontWeight: 600, color: "#2B2118" }}>
                    {mt.title}
                  </span>
                  <span style={{ color: "#9A8A73", fontWeight: 500 }}>
                    {fmtDur(mt.elapsedMs || 0)}
                  </span>
                  {mt.status === "review" ? (
                    <span
                      style={{
                        color: "#5B3FA8",
                        fontWeight: 700,
                        fontSize: 12.5,
                        background: "#F7F3FF",
                        border: "1px solid #C9B8F5",
                        borderRadius: 999,
                        padding: "2px 10px",
                      }}
                    >
                      بانتظار تقييم
                    </span>
                  ) : (
                    <span style={{ color: "#B87A00", letterSpacing: 1 }}>
                      {starsStr(Math.round(mt.stars || 0))}
                    </span>
                  )}
                </div>
              ))}
              {myRecentTasks.length === 0 ? (
                <div style={{ color: "#9A8A73", fontWeight: 600 }}>
                  لا توجد مهام منجزة بعد
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
}
