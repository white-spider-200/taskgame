"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { dateKey, dayLabel, fmtDur, starsStr } from "@/lib/format";
import type { TaskDTO, TeamMember } from "@/lib/team";

type Props = {
  tasks: TaskDTO[];
  memberMap: Map<string, TeamMember>;
};

type HistoryDay = {
  key: string;
  label: string;
  tasks: TaskDTO[];
  avgStars: string;
};

// Done tasks archive under the day they were finished; expired (unfinished)
// tasks archive under the day they were started, since they never got a completedAt.
function archiveDayKey(t: TaskDTO) {
  return dateKey(t.completedAt ?? t.startedAt);
}

export function HistoryView({ tasks, memberMap }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo<HistoryDay[]>(() => {
    const byDay = new Map<string, TaskDTO[]>();
    for (const t of tasks) {
      const key = archiveDayKey(t);
      const list = byDay.get(key) ?? [];
      list.push(t);
      byDay.set(key, list);
    }
    return [...byDay.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, tasks]) => {
        const rated = tasks.filter((t) => t.status === "done");
        return {
          key,
          label: dayLabel(key),
          tasks,
          avgStars: rated.length
            ? (
                rated.reduce((a, t) => a + (t.stars || 0), 0) / rated.length
              ).toFixed(1)
            : "—",
        };
      });
  }, [tasks]);

  const selectedDay = days.find((d) => d.key === selected) ?? null;

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        flex: 1,
      }}
    >
      {selectedDay ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                background: "#FFF",
                border: "2px solid #FFE3B3",
                borderRadius: 999,
                padding: "6px 14px",
                fontWeight: 700,
                fontSize: 13.5,
                color: "#7A6A55",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              → الأرشيف
            </button>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#2B2118",
              }}
            >
              📅 {selectedDay.label}
            </h2>
            <div
              style={{
                marginInlineStart: "auto",
                fontSize: 13.5,
                fontWeight: 700,
                color: "#B87A00",
              }}
            >
              متوسط اليوم {selectedDay.avgStars} ★
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedDay.tasks.map((t) => {
              const u = memberMap.get(t.ownerId);
              return (
                <div
                  key={t.id}
                  style={{
                    background: "#FFF",
                    border: "2px solid #FFE3B3",
                    borderRadius: 18,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <Avatar
                    url={u?.avatarUrl}
                    initial={u?.initial || "؟"}
                    color={u?.color || "#9A8A73"}
                    size={40}
                    style={{ fontSize: 16 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 16, color: "#2B2118" }}
                    >
                      {t.title}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#9A8A73", fontWeight: 500 }}
                    >
                      {u?.name ?? "؟"} · {fmtDur(t.elapsedMs || 0)}
                    </div>
                  </div>
                  {t.status === "expired" ? (
                    <div
                      style={{
                        background: "#F5EDE4",
                        border: "2px solid #E4D5C0",
                        color: "#8A7860",
                        fontWeight: 800,
                        fontSize: 13.5,
                        padding: "5px 12px",
                        borderRadius: 999,
                      }}
                    >
                      لم تكتمل
                    </div>
                  ) : (
                    <>
                      <div
                        style={{ fontSize: 17, letterSpacing: 2, color: "#B87A00" }}
                      >
                        {starsStr(Math.round(t.stars || 0))}
                      </div>
                      <div
                        style={{
                          background: "#FFE9A8",
                          border: "2px solid #F2C94C",
                          color: "#7A5A00",
                          fontWeight: 800,
                          fontSize: 13.5,
                          padding: "5px 12px",
                          borderRadius: 999,
                        }}
                      >
                        +{Math.round((t.stars || 0) * 2)} نقاط
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: "#2B2118",
            }}
          >
            🗂 الأرشيف
          </h2>
          <div
            style={{ fontSize: 14, color: "#9A8A73", fontWeight: 600, marginTop: -10 }}
          >
            كل يوم صفحة جديدة — المهام المنجزة أو التي لم تكتمل قبل منتصف الليل تُحفظ هنا
          </div>

          {days.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#9A8A73",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              لا يوجد عمل سابق بعد 🎈
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {days.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelected(d.key)}
                  style={{
                    textAlign: "start",
                    background: "#FFF",
                    border: "2px solid #FFE3B3",
                    borderRadius: 18,
                    padding: "16px 18px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#2B2118" }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#9A8A73", fontWeight: 600 }}>
                    {d.tasks.length === 1 ? "مهمة واحدة" : `${d.tasks.length} مهام`}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#B87A00" }}>
                    {d.avgStars} ★ متوسط
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
