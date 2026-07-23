import { logoutAction } from "@/app/actions";
import type { View } from "./types";

type Props = {
  teamName: string;
  myPoints: number;
  me: { initial: string; color: string };
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
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "#FF6B57",
              display: "grid",
              placeItems: "center",
              color: "#FFF",
              fontWeight: 800,
              fontSize: 20,
              transform: "rotate(-6deg)",
              boxShadow: "0 3px 0 #E04B38",
            }}
          >
            م
          </div>
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
              width: 36,
              height: 36,
              borderRadius: 999,
              background: me.color,
              color: "#FFF",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              fontFamily: "inherit",
            }}
          >
            {me.initial}
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
