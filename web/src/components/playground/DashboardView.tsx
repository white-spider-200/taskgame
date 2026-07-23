import { fmtDur } from "@/lib/format";
import type { MemberStat } from "./types";

type Props = {
  doneTasksCount: number;
  runCount: number;
  revCount: number;
  teamAvg: string;
  donePct: string;
  memberStats: MemberStat[];
  fastest: MemberStat | undefined;
};

export function DashboardView({
  doneTasksCount,
  runCount,
  revCount,
  teamAvg,
  donePct,
  memberStats,
  fastest,
}: Props) {
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
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: "#2B2118",
            }}
          >
            📊 لوحة الإنجاز
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
            className="playground-stat-grid"
          >
            {[
              ["مهام منجزة", doneTasksCount, "#FF6B57"],
              ["قيد التنفيذ", runCount, "#1FB6A6"],
              ["بانتظار التقييم", revCount, "#8B5CF6"],
              ["متوسط التقييم", `${teamAvg} ★`, "#B87A00"],
            ].map(([label, val, color]) => (
              <div
                key={String(label)}
                style={{
                  background: "#FFF",
                  border: "2px solid #FFE3B3",
                  borderRadius: 18,
                  padding: "14px 18px",
                }}
              >
                <div
                  style={{ fontSize: 13, color: "#9A8A73", fontWeight: 600 }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: String(color) }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
            className="playground-dash-grid"
          >
            <div
              style={{
                background: "#FFF",
                border: "2px solid #FFE3B3",
                borderRadius: 18,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#2B2118",
                  marginBottom: 14,
                }}
              >
                من أنجز ماذا؟
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {memberStats.map((m) => (
                  <div
                    key={m.id}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: m.color,
                        color: "#FFF",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {m.initial}
                    </div>
                    <div
                      style={{
                        width: 64,
                        fontWeight: 700,
                        fontSize: 14.5,
                        color: "#2B2118",
                      }}
                    >
                      {m.name.split(" ")[0]}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 18,
                        background: "#FFEFD6",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: m.pct,
                          height: "100%",
                          background: m.color,
                          borderRadius: 999,
                          transition: "width .4s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 62,
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "#7A6A55",
                        textAlign: "left",
                      }}
                    >
                      {m.count} مهام
                    </div>
                    <div
                      style={{
                        width: 48,
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "#B87A00",
                      }}
                    >
                      {m.avg} ★
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: "#FFF",
                  border: "2px solid #FFE3B3",
                  borderRadius: 18,
                  padding: "18px 20px",
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
                  ⏱ أسرع منجز
                </div>
                {fastest ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        background: fastest.color,
                        color: "#FFF",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {fastest.initial}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: "#2B2118",
                        }}
                      >
                        {fastest.name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#9A8A73",
                          fontWeight: 500,
                        }}
                      >
                        متوسط{" "}
                        {fastest.avgTime !== Infinity
                          ? fmtDur(fastest.avgTime)
                          : "—"}{" "}
                        للمهمة
                      </div>
                    </div>
                    <div style={{ marginInlineStart: "auto", fontSize: 26 }}>
                      ⚡
                    </div>
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  background: "#2B2118",
                  borderRadius: 18,
                  padding: "18px 20px",
                  color: "#FFF",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#F2C94C",
                    marginBottom: 10,
                  }}
                >
                  🔥 إنجاز الفريق
                </div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <span
                    style={{ fontSize: 36, fontWeight: 800, color: "#F2C94C" }}
                  >
                    {donePct}
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      color: "#C9C0B4",
                      fontWeight: 500,
                    }}
                  >
                    من المهام اكتملت
                  </span>
                </div>
                <div
                  style={{
                    height: 12,
                    background: "#4A3D2E",
                    borderRadius: 999,
                    marginTop: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: donePct,
                      height: "100%",
                      background: "#F2C94C",
                      borderRadius: 999,
                      transition: "width .4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
}
