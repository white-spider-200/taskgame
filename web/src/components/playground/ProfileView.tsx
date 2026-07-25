"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAvatarAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { fmtDur, starsStr } from "@/lib/format";
import type { TaskDTO, TeamMember } from "@/lib/team";

type Props = {
  me: TeamMember;
  teamName: string;
  myPoints: number;
  myDoneTasks: TaskDTO[];
  myAvg: string;
  myTime: string;
};

export function ProfileView({
  me,
  teamName,
  myPoints,
  myDoneTasks,
  myAvg,
  myTime,
}: Props) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

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
          <div
            style={{
              background: "#2B2118",
              borderRadius: 22,
              padding: "22px 24px",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              gap: 16,
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
                marginBottom: 12,
              }}
            >
              🎖 الشارات
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[
                ["⚡", "#FFE9A8", "#F2C94C", "أسرع منجز", -5, false],
                ["🔥", "#E8FBF4", "#1FB6A6", "7 أيام متتالية", 4, false],
                ["🌟", "#F7F3FF", "#C9B8F5", "تقييم 5 نجوم ×10", -3, false],
                ["🏅", "#F0EDE6", "#C9C0B4", "100 مهمة", 0, true],
              ].map(([icon, bg, border, label, rot, locked]) => (
                <div
                  key={String(label)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    width: 76,
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 999,
                      background: String(bg),
                      border: locked
                        ? `2px dashed ${border}`
                        : `2px solid ${border}`,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 26,
                      transform: `rotate(${rot}deg)`,
                    }}
                  >
                    {icon}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: locked ? "#9A8A73" : "#7A6A55",
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
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
              {myDoneTasks.map((mt) => (
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
                  <span style={{ color: "#B87A00", letterSpacing: 1 }}>
                    {starsStr(Math.round(mt.stars || 0))}
                  </span>
                </div>
              ))}
              {myDoneTasks.length === 0 ? (
                <div style={{ color: "#9A8A73", fontWeight: 600 }}>
                  لا توجد مهام منجزة بعد
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
}
