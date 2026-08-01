import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ExcelPreview } from "@/components/ExcelPreview";
import { linkifyText } from "@/components/Linkify";
import { SubmissionText } from "@/components/SubmissionText";
import {
  RATING_LABELS,
  fmtTimer,
  starsStr,
} from "@/lib/format";
import type { TaskDTO, TeamMember } from "@/lib/team";
import type { Filter, MiniLeader } from "./types";

type Props = {
  teamId: string;
  tasks: TaskDTO[];
  visibleTasks: TaskDTO[];
  doneTasks: TaskDTO[];
  donePct: string;
  inviteCode: string;
  me: TeamMember;
  memberMap: Map<string, TeamMember>;
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  onOpenModal: () => void;
  miniLeaders: MiniLeader[];
  taskMeta: (t: TaskDTO) => string;
  ratings: Record<string, number>;
  onSetRating: (taskId: string, stars: number) => void;
  onRate: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TasksView({
  teamId,
  tasks,
  visibleTasks,
  doneTasks,
  donePct,
  inviteCode,
  me,
  memberMap,
  filter,
  onFilterChange,
  onOpenModal,
  miniLeaders,
  taskMeta,
  ratings,
  onSetRating,
  onRate,
  onDelete,
}: Props) {
  function filterStyle(f: Filter) {
    const on = filter === f;
    return {
      background: on ? "#2B2118" : "#FFFFFF",
      color: on ? "#FFFFFF" : "#7A6A55",
      border: `2px solid ${on ? "#2B2118" : "#FFE3B3"}`,
    };
  }

  return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 24,
            padding: "24px 32px",
            flex: 1,
            alignItems: "start",
          }}
          className="playground-tasks-grid"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
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
                مهام الفريق
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  marginInlineStart: 8,
                  flexWrap: "wrap",
                }}
              >
                {(
                  [
                    ["run", "قيد التنفيذ"],
                    ["rev", "للتقييم"],
                    ["done", "منجزة"],
                  ] as const
                ).map(([f, label]) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onFilterChange(f)}
                    style={{
                      padding: "5px 13px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      ...filterStyle(f),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onOpenModal}
                style={{
                  marginInlineStart: "auto",
                  background: "#FF6B57",
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "9px 20px",
                  borderRadius: 999,
                  boxShadow: "0 3px 0 #E04B38",
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                + مهمة جديدة
              </button>
            </div>

            {visibleTasks.map((t) => {
              const u = memberMap.get(t.ownerId);
              const isMine = t.ownerId === me.id;
              const canRate = !isMine && t.status !== "running";
              const needsMyRating = canRate && t.myRating == null;
              const border = needsMyRating ? "#C9B8F5" : "#FFE3B3";
              return (
                <div
                  key={t.id}
                  className="task-card"
                  style={{
                    background: "#FFF",
                    border: `2px solid ${border}`,
                    borderRadius: 18,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    position: "relative",
                    animation: "pop .25s ease",
                  }}
                >
                  {needsMyRating ? (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        insetInlineStart: 18,
                        background: "#8B5CF6",
                        color: "#FFF",
                        fontWeight: 700,
                        fontSize: 12.5,
                        padding: "3px 12px",
                        borderRadius: 999,
                        transform: "rotate(-2deg)",
                      }}
                    >
                      بانتظار تقييمك!
                    </div>
                  ) : null}

                  <div
                    style={{
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
                      size={44}
                      style={{ fontSize: 17 }}
                    />
                    <Link
                      href={`/t/${teamId}/task/${t.id}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        flex: 1,
                        minWidth: 180,
                        textDecoration: "none",
                      }}
                    >
                      <div
                        dir="auto"
                        style={{
                          fontWeight: 700,
                          fontSize: 17,
                          color: "#2B2118",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {t.title}
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          color: "#9A8A73",
                          fontWeight: 500,
                        }}
                      >
                        {taskMeta(t)}
                      </div>
                    </Link>

                    {t.status === "running" ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#E8FBF4",
                          border: "2px solid #1FB6A6",
                          borderRadius: 12,
                          padding: "7px 14px",
                          fontWeight: 800,
                          color: "#0E8A7D",
                          fontSize: 16,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ⏱{" "}
                        {fmtTimer(Date.now() - new Date(t.startedAt).getTime())}
                      </div>
                    ) : null}

                    {t.status === "running" && isMine ? (
                      <Link
                        href={`/t/${teamId}/task/${t.id}`}
                        style={{
                          background: "#1FB6A6",
                          color: "#FFF",
                          fontWeight: 700,
                          fontSize: 14,
                          padding: "8px 16px",
                          borderRadius: 999,
                          boxShadow: "0 3px 0 #148F82",
                          cursor: "pointer",
                          border: "none",
                          fontFamily: "inherit",
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        إنهاء ✓
                      </Link>
                    ) : null}

                    {t.status === "running" && isMine ? (
                      <button
                        type="button"
                        onClick={() => onDelete(t.id)}
                        style={{
                          background: "#FFF",
                          color: "#E0473C",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: "7px 14px",
                          borderRadius: 999,
                          border: "2px solid #FFC9C2",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        حذف 🗑
                      </button>
                    ) : null}

                    {t.status === "done" ? (
                      <>
                        <div
                          style={{
                            fontSize: 18,
                            letterSpacing: 2,
                            color: "#B87A00",
                          }}
                        >
                          {starsStr(Math.round(t.stars || 0))}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "#9A8A73",
                          }}
                        >
                          {(t.stars || 0).toFixed(1)} ·{" "}
                          {t.ratingsCount === 1
                            ? "تقييم واحد"
                            : `${t.ratingsCount} تقييمات`}
                        </div>
                        <div
                          style={{
                            background: "#FFE9A8",
                            border: "2px solid #F2C94C",
                            color: "#7A5A00",
                            fontWeight: 800,
                            fontSize: 14.5,
                            padding: "6px 14px",
                            borderRadius: 999,
                          }}
                        >
                          +{Math.round((t.stars || 0) * 2)} نقاط
                        </div>
                      </>
                    ) : null}

                    {t.status === "review" && isMine ? (
                      <div
                        style={{
                          background: "#F7F3FF",
                          border: "2px solid #C9B8F5",
                          color: "#5B3FA8",
                          fontWeight: 700,
                          fontSize: 12.5,
                          padding: "5px 13px",
                          borderRadius: 999,
                        }}
                      >
                        بانتظار تقييم زميل
                      </div>
                    ) : null}
                  </div>

                  {t.desc ? (
                    <div
                      style={{
                        fontSize: 14,
                        color: "#7A6A55",
                        fontWeight: 500,
                        marginInlineStart: 58,
                        marginTop: -6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        maxHeight: 96,
                        overflowY: "auto",
                        overflowX: "auto",
                        paddingInlineEnd: 4,
                      }}
                    >
                      {linkifyText(t.desc)}
                    </div>
                  ) : null}

                  {t.submission &&
                  (t.status === "review" || t.status === "done") ? (
                    <div
                      style={{
                        marginInlineStart: 58,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        background: "#FFFBF3",
                        border: "2px solid #FFE3B3",
                        borderRadius: 14,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#9A8A73",
                            flex: 1,
                          }}
                        >
                          إثبات الإنجاز
                        </div>
                        {isMine ? (
                          <Link
                            href={`/t/${teamId}/task/${t.id}`}
                            style={{
                              background: "#FFF",
                              color: "#B87A00",
                              fontWeight: 700,
                              fontSize: 12.5,
                              padding: "4px 12px",
                              borderRadius: 999,
                              border: "2px solid #F2C94C",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textDecoration: "none",
                            }}
                          >
                            تعديل ✏️
                          </Link>
                        ) : null}
                      </div>
                      {t.submission.text ? (
                        <div
                          style={{
                            maxHeight: 220,
                            overflowY: "auto",
                            overflowX: "auto",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            paddingInlineEnd: 4,
                          }}
                        >
                          <SubmissionText text={t.submission.text} format={t.submission.textFormat} />
                        </div>
                      ) : null}
                      {t.submission.files.some((f) => f.kind === "spreadsheet") ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {t.submission.files
                            .filter((f) => f.kind === "spreadsheet")
                            .map((f) => (
                              <ExcelPreview key={f.id} url={f.url} name={f.name} />
                            ))}
                        </div>
                      ) : null}
                      {t.submission.files.some((f) => f.kind !== "spreadsheet") ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                            gap: 8,
                          }}
                        >
                          {t.submission.files
                            .filter((f) => f.kind !== "spreadsheet")
                            .map((f) =>
                            f.kind === "video" ? (
                              <video
                                key={f.id}
                                src={f.url}
                                controls
                                style={{
                                  width: "100%",
                                  maxHeight: 220,
                                  borderRadius: 12,
                                  border: "1px solid #FFE3B3",
                                  background: "#FFF",
                                }}
                              />
                            ) : (
                              <img
                                key={f.id}
                                src={f.url}
                                alt="إثبات المهمة"
                                style={{
                                  width: "100%",
                                  maxHeight: 220,
                                  borderRadius: 12,
                                  objectFit: "contain",
                                  border: "1px solid #FFE3B3",
                                  background: "#FFF",
                                }}
                              />
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {canRate ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "#F7F3FF",
                        borderRadius: 14,
                        padding: "10px 16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14.5,
                          color: "#5B3FA8",
                        }}
                      >
                        {t.myRating == null ? "قيّم العمل:" : "تعديل تقييمك:"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          fontSize: 26,
                          lineHeight: 1,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            onClick={() =>
                              onSetRating(t.id, i)
                            }
                            style={{
                              cursor: "pointer",
                              color:
                                i <= (ratings[t.id] ?? t.myRating ?? 0)
                                  ? "#F2C94C"
                                  : "#E4DCCB",
                              userSelect: "none",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#8B5CF6",
                        }}
                      >
                        {RATING_LABELS[ratings[t.id] ?? t.myRating ?? 0]}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRate(t.id)}
                        style={{
                          marginInlineStart: "auto",
                          background:
                            ratings[t.id] ?? t.myRating
                              ? "#8B5CF6"
                              : "#C9B8F5",
                          color: "#FFF",
                          fontWeight: 700,
                          fontSize: 13.5,
                          padding: "7px 16px",
                          borderRadius: 999,
                          boxShadow: "0 3px 0 #6D42C9",
                          cursor: "pointer",
                          border: "none",
                          fontFamily: "inherit",
                        }}
                      >
                        {t.myRating == null ? "إرسال التقييم" : "تحديث التقييم"}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {visibleTasks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#9A8A73",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                لا توجد مهام هنا 🎈
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#2B2118",
                borderRadius: 18,
                padding: 18,
                color: "#FFF",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#F2C94C",
                  marginBottom: 12,
                }}
              >
                🏆 المتصدرون
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 14.5,
                }}
              >
                {miniLeaders.map((l) => (
                  <div
                    key={l.rank}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontWeight: 800, color: l.rankColor }}>
                      {l.rank}
                    </span>
                    <span style={{ flex: 1, fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: l.rankColor, fontWeight: 700 }}>
                      {l.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                background: "#FFF",
                border: "2px solid #FFE3B3",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2B2118",
                  marginBottom: 10,
                }}
              >
                إنجاز الفريق
              </div>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: 6 }}
              >
                <span
                  style={{ fontSize: 34, fontWeight: 800, color: "#FF6B57" }}
                >
                  {doneTasks.length}
                </span>
                <span
                  style={{ fontSize: 14, color: "#9A8A73", fontWeight: 600 }}
                >
                  من {tasks.length} مهمة
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  background: "#FFEFD6",
                  borderRadius: 999,
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: donePct,
                    height: "100%",
                    background: "#FF6B57",
                    borderRadius: 999,
                    transition: "width .4s ease",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                background: "#FFF",
                border: "2px solid #FFE3B3",
                borderRadius: 18,
                padding: 14,
                fontSize: 12.5,
                color: "#9A8A73",
                fontWeight: 600,
              }}
            >
              رمز الدعوة:{" "}
              <span style={{ color: "#2B2118", fontWeight: 800 }}>
                {inviteCode}
              </span>
            </div>
          </div>
        </div>
      );
}
