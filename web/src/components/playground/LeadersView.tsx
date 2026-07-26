import { Avatar } from "@/components/Avatar";
import type { EmployeeOfMonth, LeaderRow, MemberStat } from "./types";

type Props = {
  p1: MemberStat | undefined;
  p2: MemberStat | undefined;
  p3: MemberStat | undefined;
  leaderRows: LeaderRow[];
  employeeOfMonth: EmployeeOfMonth | undefined;
};

export function LeadersView({
  p1,
  p2,
  p3,
  leaderRows,
  employeeOfMonth,
}: Props) {
  return (
        <div
          style={{
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
            maxWidth: 680,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: "#2B2118",
              }}
            >
              🏆 المتصدرون
            </h2>
            <div
              style={{
                fontSize: 13.5,
                color: "#9A8A73",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              يتجدد كل يوم — نجوم اليوم فقط
            </div>
          </div>

          {employeeOfMonth ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "linear-gradient(90deg, #FFF3D6, #FFE9A8)",
                border: "2px solid #F2C94C",
                borderRadius: 18,
                padding: "14px 18px",
              }}
            >
              <div style={{ fontSize: 28 }}>🏅</div>
              <Avatar
                url={employeeOfMonth.avatarUrl}
                initial={employeeOfMonth.initial}
                color={employeeOfMonth.color}
                size={44}
                style={{ fontSize: 17, border: "3px solid #FFF" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#2B2118" }}>
                  موظف الشهر · {employeeOfMonth.name}
                </div>
                <div style={{ fontSize: 13, color: "#7A5A00", fontWeight: 600 }}>
                  {employeeOfMonth.monthLabel} · {employeeOfMonth.tasks} مهمة ·{" "}
                  {employeeOfMonth.pts} نقطة
                </div>
              </div>
            </div>
          ) : null}

          {p1 && p2 && p3 ? (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 14,
                paddingTop: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Avatar
                  url={p3.avatarUrl}
                  initial={p3.initial}
                  color={p3.color}
                  size={52}
                  style={{ fontSize: 20, border: "3px solid #FFF" }}
                />
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2B2118" }}>
                  {p3.name.split(" ")[0]}
                </div>
                <div
                  style={{
                    width: 90,
                    height: 64,
                    background: "#E8C39A",
                    borderRadius: "14px 14px 0 0",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: 20,
                    color: "#7A5A2E",
                  }}
                >
                  3
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 26 }}>👑</div>
                <Avatar
                  url={p1.avatarUrl}
                  initial={p1.initial}
                  color={p1.color}
                  size={60}
                  style={{
                    fontSize: 23,
                    border: "3px solid #F2C94C",
                    boxShadow: "0 0 0 3px #FFF",
                  }}
                />
                <div
                  style={{ fontWeight: 800, fontSize: 15, color: "#2B2118" }}
                >
                  {p1.name.split(" ")[0]} · {p1.pts} ⭐
                </div>
                <div
                  style={{
                    width: 100,
                    height: 96,
                    background: "#F2C94C",
                    borderRadius: "14px 14px 0 0",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: 26,
                    color: "#7A5A00",
                  }}
                >
                  1
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Avatar
                  url={p2.avatarUrl}
                  initial={p2.initial}
                  color={p2.color}
                  size={52}
                  style={{ fontSize: 20, border: "3px solid #FFF" }}
                />
                <div style={{ fontWeight: 700, fontSize: 14, color: "#2B2118" }}>
                  {p2.name.split(" ")[0]}
                </div>
                <div
                  style={{
                    width: 90,
                    height: 78,
                    background: "#D6D1C7",
                    borderRadius: "14px 14px 0 0",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: 20,
                    color: "#6B6558",
                  }}
                >
                  2
                </div>
              </div>
            </div>
          ) : null}
          <div
            style={{
              background: "#FFF",
              border: "2px solid #FFE3B3",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {leaderRows.map((l) => (
              <div
                key={l.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 18px",
                  borderBottom: "1px solid #FFF3DE",
                  background: l.bg,
                }}
              >
                <div
                  style={{
                    width: 26,
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#9A8A73",
                  }}
                >
                  {l.rank}
                </div>
                <Avatar
                  url={l.avatarUrl}
                  initial={l.initial}
                  color={l.color}
                  size={36}
                  style={{ fontSize: 15 }}
                />
                <div
                  style={{
                    flex: 1,
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#2B2118",
                  }}
                >
                  {l.name}
                </div>
                <div
                  style={{ fontSize: 13, color: "#9A8A73", fontWeight: 600 }}
                >
                  {l.tasks} مهمة · {l.avg} ★
                </div>
                <div
                  style={{
                    background: "#FFE9A8",
                    border: "2px solid #F2C94C",
                    color: "#7A5A00",
                    fontWeight: 800,
                    fontSize: 13.5,
                    padding: "4px 12px",
                    borderRadius: 999,
                  }}
                >
                  {l.pts} ⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      );
}
