import { logoutAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import type { View } from "./types";

type Props = {
  teamName: string;
  myPoints: number;
  me: { initial: string; color: string; avatarUrl?: string | null };
  view: View;
  onViewChange: (view: View) => void;
};

export function PlaygroundNav({
  teamName,
  myPoints,
  me,
  view,
  onViewChange,
}: Props) {
  function tabStyle(v: View) {
    const on = view === v;
    return {
      background: on ? "#2B2118" : "transparent",
      color: on ? "#FFFFFF" : "#7A6A55",
    };
  }

  return (
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "14px 32px",
          background: "#FFFFFF",
          borderBottom: "3px solid #FFE3B3",
          position: "sticky",
          top: 0,
          zIndex: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={38} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: "#2B2118" }}>
              ملعب المهام
            </div>
            <div style={{ fontSize: 12, color: "#9A8A73", fontWeight: 600 }}>
              {teamName}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            fontWeight: 600,
            fontSize: 15,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              ["tasks", "المهام"],
              ["dash", "لوحة الإنجاز"],
              ["leaders", "المتصدرون"],
              ["history", "الأرشيف"],
              ["report", "التقرير الأسبوعي"],
              ["profile", "ملفي"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                cursor: "pointer",
                border: "none",
                fontFamily: "inherit",
                ...tabStyle(v),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            marginInlineStart: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#FFE9A8",
              border: "2px solid #F2C94C",
              borderRadius: 999,
              padding: "5px 14px",
              fontWeight: 800,
              color: "#7A5A00",
              fontSize: 15,
            }}
          >
            ⭐ {myPoints} نقطة
          </div>
          <button
            type="button"
            onClick={() => onViewChange("profile")}
            style={{
              cursor: "pointer",
              border: "none",
              padding: 0,
              background: "transparent",
              fontFamily: "inherit",
            }}
          >
            <Avatar
              url={me.avatarUrl}
              initial={me.initial}
              color={me.color}
              size={36}
            />
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "2px solid #FFE3B3",
                borderRadius: 999,
                padding: "5px 12px",
                color: "#7A6A55",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              خروج
            </button>
          </form>
        </div>
      </div>

  );
}
