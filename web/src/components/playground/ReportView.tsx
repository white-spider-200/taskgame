"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { linkifyText } from "@/components/Linkify";
import { fmtDur, starsStr, weekKey, weekLabel } from "@/lib/format";
import type { TaskDTO, TeamMember } from "@/lib/team";
import { buildWeeklyReportDocx } from "@/lib/weeklyDocx";

type Props = {
  teamName: string;
  tasks: TaskDTO[];
  members: TeamMember[];
};

type MemberWeekStat = TeamMember & {
  done: number;
  expired: number;
  avgStars: string;
  points: number;
  totalTime: number;
  tasks: TaskDTO[];
};

// Done tasks land in the week they finished; expired (unfinished) tasks land
// in the week they were started, mirroring HistoryView's archiveDayKey logic.
function weekKeyForTask(t: TaskDTO) {
  return weekKey(t.completedAt ?? t.startedAt);
}

function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function taskDetailText(t: TaskDTO, index: number) {
  const date = t.completedAt
    ? new Date(t.completedAt).toLocaleDateString("ar", {
        day: "numeric",
        month: "long",
      })
    : "—";
  const stars = t.stars ? `${starsStr(Math.round(t.stars))} (${t.stars.toFixed(1)})` : "—";
  const filesNote = t.submission?.files.length
    ? `مرفقات: ${t.submission.files.map((f) => f.name).join("، ")}`
    : "لا مرفقات";
  return `${index}. ${t.title}
   التصنيف: ${t.category} | التقييم: ${stars} | الوقت: ${fmtDur(t.elapsedMs || 0)} | التاريخ: ${date}
   الوصف: ${t.desc || "—"}
   الإنجاز: ${t.submission?.text || "—"}
   ${filesNote}`;
}

function buildEmployeeMessage(
  m: MemberWeekStat,
  teamName: string,
  weekLbl: string,
) {
  const subject = `تقرير الأداء الأسبوعي — ${m.name} — ${weekLbl}`;
  const summary = `مرحبًا،

فيما يلي تقرير الأداء الأسبوعي لـ ${m.name} في فريق ${teamName}.
الأسبوع: ${weekLbl}

✅ المهام المنجزة: ${m.done}
⏳ المهام غير المكتملة: ${m.expired}
⭐ متوسط التقييم: ${m.avgStars}
🏆 النقاط المكتسبة: ${m.points}
🕒 إجمالي وقت العمل: ${fmtDur(m.totalTime)}`;
  const taskList = m.tasks.length
    ? m.tasks.map((t, i) => taskDetailText(t, i + 1)).join("\n\n")
    : "لا توجد مهام منجزة هذا الأسبوع.";
  const body = `${summary}

📋 تفاصيل المهام:

${taskList}

تم إنشاء هذا التقرير تلقائيًا بواسطة ملعب المهام.`;
  return { subject, summary, body };
}

export function ReportView({ teamName, tasks, members }: Props) {
  const currentWeekKey = weekKey(new Date().toISOString());

  const weekKeys = useMemo(() => {
    const keys = new Set<string>([currentWeekKey]);
    for (const t of tasks) keys.add(weekKeyForTask(t));
    return [...keys].sort((a, b) => (a < b ? 1 : -1));
  }, [tasks, currentWeekKey]);

  const [selected, setSelected] = useState(currentWeekKey);
  const selectedKey = weekKeys.includes(selected) ? selected : currentWeekKey;

  const [composeId, setComposeId] = useState<string | null>(null);
  const [bossEmail, setBossEmail] = useState<Record<string, string>>({});
  const [printOnlyId, setPrintOnlyId] = useState<string | null>(null);
  const [printPending, setPrintPending] = useState(false);
  const [docxBusyId, setDocxBusyId] = useState<string | null>(null);

  useEffect(() => {
    function reset() {
      setPrintOnlyId(null);
      setPrintPending(false);
    }
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  // Wait until the print-only sheet is committed (and proof images have
  // settled) before opening the dialog — a lone rAF races React's render.
  useEffect(() => {
    if (!printPending || !printOnlyId) return;
    let cancelled = false;

    async function runPrint() {
      const root = document.querySelector(".print-only");
      if (root) {
        const imgs = Array.from(root.querySelectorAll("img"));
        await Promise.race([
          Promise.all(
            imgs.map(
              (img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise<void>((resolve) => {
                      img.addEventListener("load", () => resolve(), { once: true });
                      img.addEventListener("error", () => resolve(), { once: true });
                    }),
            ),
          ),
          new Promise<void>((resolve) => setTimeout(resolve, 2000)),
        ]);
      }
      if (cancelled) return;
      setPrintPending(false);
      window.print();
    }

    const id = requestAnimationFrame(() => {
      void runPrint();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [printPending, printOnlyId]);

  const weekTasks = useMemo(
    () => tasks.filter((t) => weekKeyForTask(t) === selectedKey),
    [tasks, selectedKey],
  );

  const doneWeekTasks = weekTasks.filter((t) => t.status === "done");
  const expiredWeekTasks = weekTasks.filter((t) => t.status === "expired");

  const memberStats = useMemo<MemberWeekStat[]>(() => {
    return members
      .map((m) => {
        const mine = doneWeekTasks
          .filter((t) => t.ownerId === m.id)
          .sort((a, b) => ((a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1));
        const mineExpired = expiredWeekTasks.filter((t) => t.ownerId === m.id);
        const points = mine.reduce(
          (a, t) => a + (t.stars ? Math.round(t.stars * 2) : 0),
          0,
        );
        return {
          ...m,
          done: mine.length,
          expired: mineExpired.length,
          avgStars: mine.length
            ? (mine.reduce((a, t) => a + (t.stars || 0), 0) / mine.length).toFixed(1)
            : "—",
          points,
          totalTime: mine.reduce((a, t) => a + (t.elapsedMs || 0), 0),
          tasks: mine,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [members, doneWeekTasks, expiredWeekTasks]);

  const teamTotals = {
    done: doneWeekTasks.length,
    expired: expiredWeekTasks.length,
    points: memberStats.reduce((a, m) => a + m.points, 0),
    avgStars: doneWeekTasks.length
      ? (
          doneWeekTasks.reduce((a, t) => a + (t.stars || 0), 0) /
          doneWeekTasks.length
        ).toFixed(1)
      : "—",
  };

  function downloadCSV() {
    const header = ["العضو", "مهام منجزة", "مهام لم تكتمل", "متوسط النجوم", "النقاط", "الوقت الإجمالي"];
    const rows = memberStats.map((m) => [
      m.name,
      m.done,
      m.expired,
      m.avgStars,
      m.points,
      fmtDur(m.totalTime),
    ]);
    rows.push(["الإجمالي", teamTotals.done, teamTotals.expired, teamTotals.avgStars, teamTotals.points, ""]);
    const csv =
      "﻿" +
      [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-${teamName}-${selectedKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadMemberTxt(m: MemberWeekStat) {
    const { subject, body } = buildEmployeeMessage(m, teamName, weekLabel(selectedKey));
    const blob = new Blob(["﻿" + subject + "\n\n" + body], {
      type: "text/plain;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-${m.name}-${selectedKey}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printMemberPdf(m: MemberWeekStat) {
    setPrintOnlyId(m.id);
    setPrintPending(true);
  }

  async function downloadMemberDocx(m: MemberWeekStat) {
    if (docxBusyId) return;
    setDocxBusyId(m.id);
    try {
      const blob = await buildWeeklyReportDocx(m, teamName, weekLabel(selectedKey));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `تقرير-${m.name}-${selectedKey}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDocxBusyId(null);
    }
  }

  function mailtoHref(m: MemberWeekStat) {
    const { subject, body } = buildEmployeeMessage(m, teamName, weekLabel(selectedKey));
    const to = encodeURIComponent(bossEmail[m.id] || "");
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const printTarget = printOnlyId ? memberStats.find((m) => m.id === printOnlyId) : null;

  return (
    <>
    <div
      className={printOnlyId ? "no-print" : undefined}
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#2B2118" }}>
          📊 التقرير الأسبوعي
        </h2>
        <select
          value={selectedKey}
          onChange={(e) => setSelected(e.target.value)}
          className="no-print"
          style={{
            marginInlineStart: 8,
            background: "#FFF",
            border: "2px solid #FFE3B3",
            borderRadius: 999,
            padding: "6px 14px",
            fontWeight: 700,
            fontSize: 13.5,
            color: "#7A6A55",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {weekKeys.map((k) => (
            <option key={k} value={k}>
              {weekLabel(k)}
              {k === currentWeekKey ? " (الحالي)" : ""}
            </option>
          ))}
        </select>
        <div className="no-print" style={{ marginInlineStart: "auto", display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={downloadCSV}
            className="btn-anim"
            style={{
              background: "#1FB6A6",
              color: "#FFF",
              border: "none",
              borderRadius: 999,
              padding: "8px 16px",
              fontWeight: 800,
              fontSize: 13.5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ⬇ تصدير CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-anim"
            style={{
              background: "#FFF",
              color: "#7A6A55",
              border: "2px solid #FFE3B3",
              borderRadius: 999,
              padding: "8px 16px",
              fontWeight: 800,
              fontSize: 13.5,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🖨 طباعة / PDF
          </button>
        </div>
      </div>

      <div style={{ fontSize: 14, color: "#9A8A73", fontWeight: 600, marginTop: -10 }}>
        {weekLabel(selectedKey)} · {teamName}
      </div>

      <div
        className="playground-stat-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}
      >
        {[
          ["مهام منجزة", teamTotals.done],
          ["لم تكتمل", teamTotals.expired],
          ["متوسط النجوم", `${teamTotals.avgStars} ★`],
          ["إجمالي النقاط", teamTotals.points],
        ].map(([label, value]) => (
          <div
            key={label as string}
            style={{
              background: "#FFF",
              border: "2px solid #FFE3B3",
              borderRadius: 18,
              padding: "16px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2B2118" }}>{value}</div>
            <div style={{ fontSize: 12.5, color: "#9A8A73", fontWeight: 700, marginTop: 4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {memberStats.every((m) => m.done === 0 && m.expired === 0) ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#9A8A73",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          لا توجد بيانات لهذا الأسبوع 🎈
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {memberStats.map((m) => (
            <div
              key={m.id}
              style={{
                background: "#FFF",
                border: "2px solid #FFE3B3",
                borderRadius: 18,
                padding: "14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <Avatar url={m.avatarUrl} initial={m.initial} color={m.color} size={40} style={{ fontSize: 16 }} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#2B2118" }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: "#9A8A73", fontWeight: 500 }}>
                    {m.done} منجزة · {m.expired} لم تكتمل · {m.avgStars} ★ · {fmtDur(m.totalTime)}
                  </div>
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
                  +{m.points} نقاط
                </div>
                <button
                  type="button"
                  onClick={() => setComposeId(composeId === m.id ? null : m.id)}
                  className="btn-anim no-print"
                  style={{
                    background: composeId === m.id ? "#2B2118" : "#FFF",
                    color: composeId === m.id ? "#FFF" : "#7A6A55",
                    border: "2px solid #FFE3B3",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ✉️ تقرير للبريد
                </button>
              </div>

              {composeId === m.id ? (
                <div
                  className="no-print"
                  style={{
                    background: "#FFF7EC",
                    border: "2px dashed #FFE3B3",
                    borderRadius: 14,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <input
                    type="email"
                    placeholder="بريد المدير (اختياري)"
                    value={bossEmail[m.id] || ""}
                    onChange={(e) =>
                      setBossEmail((b) => ({ ...b, [m.id]: e.target.value }))
                    }
                    style={{
                      border: "2px solid #FFE3B3",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontSize: 14,
                      fontFamily: "inherit",
                      background: "#FFF",
                    }}
                  />
                  <textarea
                    readOnly
                    dir="rtl"
                    value={buildEmployeeMessage(m, teamName, weekLabel(selectedKey)).body}
                    rows={8}
                    style={{
                      border: "2px solid #FFE3B3",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                      resize: "vertical",
                      color: "#2B2118",
                      background: "#FFF",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href={mailtoHref(m)}
                      className="btn-anim"
                      style={{
                        background: "#1FB6A6",
                        color: "#FFF",
                        border: "none",
                        borderRadius: 999,
                        padding: "7px 14px",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      📧 فتح في تطبيق البريد
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadMemberTxt(m)}
                      className="btn-anim"
                      style={{
                        background: "#FFF",
                        color: "#7A6A55",
                        border: "2px solid #FFE3B3",
                        borderRadius: 999,
                        padding: "7px 14px",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ⬇ TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => printMemberPdf(m)}
                      className="btn-anim"
                      style={{
                        background: "#FFF",
                        color: "#7A6A55",
                        border: "2px solid #FFE3B3",
                        borderRadius: 999,
                        padding: "7px 14px",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      🖨 PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadMemberDocx(m)}
                      disabled={docxBusyId === m.id}
                      className="btn-anim"
                      style={{
                        background: "#FFF",
                        color: "#7A6A55",
                        border: "2px solid #FFE3B3",
                        borderRadius: 999,
                        padding: "7px 14px",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: docxBusyId === m.id ? "wait" : "pointer",
                        fontFamily: "inherit",
                        opacity: docxBusyId === m.id ? 0.7 : 1,
                      }}
                    >
                      {docxBusyId === m.id ? "… جاري التجهيز" : "📄 Word"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>

    {printTarget ? (
      <div className="print-only" dir="rtl" style={{ padding: 40, fontSize: 15, color: "#2B2118" }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>
          {buildEmployeeMessage(printTarget, teamName, weekLabel(selectedKey)).subject}
        </h1>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          {buildEmployeeMessage(printTarget, teamName, weekLabel(selectedKey)).summary}
        </pre>

        <h2 style={{ fontSize: 18, marginTop: 24, marginBottom: 8 }}>📋 تفاصيل المهام</h2>
        {printTarget.tasks.length === 0 ? (
          <p>لا توجد مهام منجزة هذا الأسبوع.</p>
        ) : (
          printTarget.tasks.map((t, i) => (
            <div
              key={t.id}
              style={{
                breakInside: "avoid",
                borderTop: "1px solid #DDD",
                padding: "14px 0",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {i + 1}. {t.title}
              </div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
                {t.category} · {t.stars ? `${starsStr(Math.round(t.stars))} (${t.stars.toFixed(1)})` : "—"} ·{" "}
                {fmtDur(t.elapsedMs || 0)} ·{" "}
                {t.completedAt
                  ? new Date(t.completedAt).toLocaleDateString("ar", { day: "numeric", month: "long" })
                  : "—"}
              </div>
              {t.desc ? (
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                  الوصف: {linkifyText(t.desc)}
                </div>
              ) : null}
              {t.submission?.text ? (
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                  الإنجاز: {linkifyText(t.submission.text)}
                </div>
              ) : null}
              {t.submission?.files.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {t.submission.files.map((f) =>
                    f.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={f.id}
                        src={f.url}
                        alt={f.name}
                        style={{
                          maxWidth: 180,
                          maxHeight: 180,
                          borderRadius: 8,
                          border: "1px solid #DDD",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        key={f.id}
                        style={{
                          fontSize: 12.5,
                          color: "#555",
                          border: "1px solid #DDD",
                          borderRadius: 8,
                          padding: "6px 10px",
                        }}
                      >
                        {f.kind === "spreadsheet" ? "📊" : f.kind === "doc" ? "📄" : "🎥"} {f.name}
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    ) : null}
    </>
  );
}
