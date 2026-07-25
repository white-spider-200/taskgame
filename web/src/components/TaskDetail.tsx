"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  editSubmissionAction,
  finishTaskAction,
  rateTaskAction,
} from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import {
  CATEGORY_ICONS,
  RATING_LABELS,
  fmtDur,
  fmtTimer,
  starsStr,
} from "@/lib/format";
import type { TeamPayload } from "@/lib/team";
import { Toast } from "./playground/Toast";

const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

export function TaskDetail({
  teamId,
  initial,
  taskId,
}: {
  teamId: string;
  initial: TeamPayload;
  taskId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  const [proofText, setProofText] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  void tick;

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  }

  const me = data.me;
  const task = data.tasks.find((t) => t.id === taskId);
  const memberMap = new Map(data.members.map((u) => [u.id, u]));

  if (!task) {
    return (
      <div dir="rtl" style={{ padding: 32 }}>
        <p>المهمة غير موجودة.</p>
        <Link href={`/t/${teamId}`}>العودة للمهام</Link>
      </div>
    );
  }

  const owner = memberMap.get(task.ownerId);
  const isMine = task.ownerId === me.id;
  const canRate = !isMine && task.status !== "running";
  const needsMyRating = canRate && task.myRating == null;

  function onFinishSubmit() {
    const text = proofText.trim();
    if (!text && !proofFile) {
      showToast("أرفق نصًا أو صورة كإثبات للعمل");
      return;
    }
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("text", text);
    if (proofFile) fd.set("file", proofFile);

    startTransition(async () => {
      const res = await finishTaskAction(fd);
      if (res?.error) {
        showToast(res.error);
        return;
      }
      if (!res || !("ok" in res) || !res.ok) return;
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "review",
                elapsedMs: res.elapsedMs,
                submission: res.submission,
              }
            : t,
        ),
      }));
      showToast("🎉 أُنهيت المهمة — بانتظار تقييم زميل");
      router.refresh();
    });
  }

  function openEditForm() {
    setEditText(task?.submission?.text ?? "");
    setEditFile(null);
    setEditing(true);
  }

  function onEditSubmit() {
    const text = editText.trim();
    if (!text && !editFile && !task?.submission?.fileUrl) {
      showToast("أرفق نصًا أو صورة كإثبات للعمل");
      return;
    }
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("text", text);
    if (editFile) fd.set("file", editFile);

    startTransition(async () => {
      const res = await editSubmissionAction(fd);
      if (res?.error) {
        showToast(res.error);
        return;
      }
      if (!res || !("ok" in res) || !res.ok) return;
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId ? { ...t, submission: res.submission } : t,
        ),
      }));
      setEditing(false);
      showToast("✏️ تم تحديث إثبات المهمة");
      router.refresh();
    });
  }

  function onRate() {
    const stars = rating ?? task?.myRating ?? 0;
    if (!stars) {
      showToast("اختر عدد النجوم أولًا ⭐");
      return;
    }
    startTransition(async () => {
      const res = await rateTaskAction(taskId, stars);
      if (!res || !("ok" in res) || !res.ok) {
        showToast(res?.error || "تعذّر إرسال التقييم");
        return;
      }
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "done",
                stars: res.stars,
                ratingsCount: res.count,
                myRating: stars,
              }
            : t,
        ),
      }));
      showToast(`⭐ تم إرسال تقييمك (${stars} نجوم)`);
      router.refresh();
    });
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#FFF7EC",
        padding: "24px 32px",
      }}
    >
      <Toast message={toast} />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href={`/t/${teamId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#7A6A55",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            marginBottom: 18,
          }}
        >
          → العودة للمهام
        </Link>

        <div
          style={{
            background: "#FFF",
            border: "2px solid #FFE3B3",
            borderRadius: 20,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar
              url={owner?.avatarUrl}
              initial={owner?.initial || "؟"}
              color={owner?.color || "#9A8A73"}
              size={48}
              style={{ fontSize: 18 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 21, color: "#2B2118" }}>
                {task.title}
              </div>
              <div style={{ fontSize: 13.5, color: "#9A8A73", fontWeight: 600 }}>
                {CATEGORY_ICONS[task.category] || ""} {task.category} ·{" "}
                {owner?.name ?? "؟"}
              </div>
            </div>
            {task.status === "running" ? (
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
                ⏱ {fmtTimer(Date.now() - new Date(task.startedAt).getTime())}
              </div>
            ) : null}
            {task.status === "done" ? (
              <div style={{ textAlign: "left" }}>
                <div
                  style={{ fontSize: 20, letterSpacing: 2, color: "#B87A00" }}
                >
                  {starsStr(Math.round(task.stars || 0))}
                </div>
                <div
                  style={{ fontSize: 12.5, fontWeight: 600, color: "#9A8A73" }}
                >
                  {(task.stars || 0).toFixed(1)} ·{" "}
                  {task.ratingsCount === 1
                    ? "تقييم واحد"
                    : `${task.ratingsCount} تقييمات`}{" "}
                  · +{Math.round((task.stars || 0) * 2)} نقاط
                </div>
              </div>
            ) : null}
            {task.status === "review" ? (
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

          {task.desc ? (
            <div style={{ fontSize: 15, color: "#7A6A55", fontWeight: 500 }}>
              {task.desc}
            </div>
          ) : null}

          {task.status !== "running" ? (
            <div style={{ fontSize: 13.5, color: "#9A8A73", fontWeight: 600 }}>
              أُنجزت في {fmtDur(task.elapsedMs || 0)}
            </div>
          ) : null}

          {/* Owner: submit proof to finish the task */}
          {task.status === "running" && isMine ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "#F0FBFA",
                border: "2px solid #1FB6A6",
                borderRadius: 14,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0E8A7D" }}>
                أرفق إثبات العمل (نص و/أو صورة أو فيديو)
              </div>
              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="ماذا أنجزت؟ اكتب وصفًا مختصرًا..."
                rows={4}
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "2px solid #B8E8E0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontFamily: "inherit",
                  fontSize: 14,
                  color: "#2B2118",
                  background: "#FFF",
                }}
              />
              <label
                style={{
                  display: "inline-block",
                  background: "#1FB6A6",
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: 13.5,
                  padding: "8px 20px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  border: "none",
                  boxShadow: "0 2px 0 #148F82",
                  width: "fit-content",
                }}
                tabIndex={0}
              >
                <input
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                تحميل صورة أو فيديو إثبات
              </label>
              {proofFile ? (
                <div style={{ fontSize: 12.5, color: "#0E8A7D", fontWeight: 600 }}>
                  {proofFile.name}
                </div>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={onFinishSubmit}
                  style={{
                    background: "#1FB6A6",
                    color: "#FFF",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "9px 20px",
                    borderRadius: 999,
                    boxShadow: "0 3px 0 #148F82",
                    cursor: "pointer",
                    border: "none",
                    fontFamily: "inherit",
                  }}
                >
                  إرسال وإنهاء
                </button>
              </div>
            </div>
          ) : null}

          {/* Submission read view + owner edit */}
          {task.submission && (task.status === "review" || task.status === "done") ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "#FFFBF3",
                border: "2px solid #FFE3B3",
                borderRadius: 14,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#9A8A73", flex: 1 }}>
                  إثبات الإنجاز
                </div>
                {isMine && !editing ? (
                  <button
                    type="button"
                    onClick={openEditForm}
                    style={{
                      background: "#FFF",
                      color: "#B87A00",
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: "5px 14px",
                      borderRadius: 999,
                      border: "2px solid #F2C94C",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    تعديل ✏️
                  </button>
                ) : null}
              </div>

              {!editing ? (
                <>
                  {task.submission.text ? (
                    <div
                      style={{
                        fontSize: 15,
                        color: "#2B2118",
                        fontWeight: 500,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {task.submission.text}
                    </div>
                  ) : null}
                  {task.submission.fileUrl ? (
                    /\.(mp4|webm|mov)$/i.test(task.submission.fileUrl) ? (
                      <video
                        src={task.submission.fileUrl}
                        controls
                        style={{
                          maxWidth: "100%",
                          maxHeight: 420,
                          borderRadius: 12,
                          border: "1px solid #FFE3B3",
                          background: "#FFF",
                        }}
                      />
                    ) : (
                      <img
                        src={task.submission.fileUrl}
                        alt="إثبات المهمة"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 420,
                          borderRadius: 12,
                          objectFit: "contain",
                          border: "1px solid #FFE3B3",
                          background: "#FFF",
                        }}
                      />
                    )
                  ) : null}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="ماذا أنجزت؟ اكتب وصفًا مختصرًا..."
                    rows={4}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      border: "2px solid #FFE3B3",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontFamily: "inherit",
                      fontSize: 14,
                      color: "#2B2118",
                      background: "#FFF",
                    }}
                  />
                  <label
                    style={{
                      display: "inline-block",
                      background: "#F2C94C",
                      color: "#4A3600",
                      fontWeight: 700,
                      fontSize: 13.5,
                      padding: "8px 20px",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      border: "none",
                      boxShadow: "0 2px 0 #B8930E",
                      width: "fit-content",
                    }}
                    tabIndex={0}
                  >
                    <input
                      type="file"
                      accept={FILE_ACCEPT}
                      onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                      style={{ display: "none" }}
                    />
                    استبدال الصورة أو الفيديو
                  </label>
                  {editFile ? (
                    <div style={{ fontSize: 12.5, color: "#B87A00", fontWeight: 600 }}>
                      {editFile.name}
                    </div>
                  ) : task.submission.fileName ? (
                    <div style={{ fontSize: 12.5, color: "#9A8A73", fontWeight: 600 }}>
                      الملف الحالي: {task.submission.fileName}
                    </div>
                  ) : null}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      style={{
                        background: "#FFF",
                        color: "#7A6A55",
                        fontWeight: 700,
                        fontSize: 13.5,
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: "2px solid #E4DCCB",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={onEditSubmit}
                      style={{
                        background: "#F2C94C",
                        color: "#4A3600",
                        fontWeight: 700,
                        fontSize: 13.5,
                        padding: "8px 18px",
                        borderRadius: 999,
                        boxShadow: "0 3px 0 #B8930E",
                        cursor: "pointer",
                        border: "none",
                        fontFamily: "inherit",
                      }}
                    >
                      حفظ التعديل
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Peer rating */}
          {canRate ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#F7F3FF",
                borderRadius: 14,
                padding: "12px 18px",
                flexWrap: "wrap",
                border: needsMyRating ? "2px solid #C9B8F5" : "none",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14.5, color: "#5B3FA8" }}>
                {task.myRating == null ? "قيّم العمل:" : "تعديل تقييمك:"}
              </div>
              <div style={{ display: "flex", gap: 4, fontSize: 28, lineHeight: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    onClick={() => setRating(i)}
                    style={{
                      cursor: "pointer",
                      color:
                        i <= (rating ?? task.myRating ?? 0)
                          ? "#F2C94C"
                          : "#E4DCCB",
                      userSelect: "none",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#8B5CF6" }}>
                {RATING_LABELS[rating ?? task.myRating ?? 0]}
              </div>
              <button
                type="button"
                onClick={onRate}
                style={{
                  marginInlineStart: "auto",
                  background: rating ?? task.myRating ? "#8B5CF6" : "#C9B8F5",
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: 13.5,
                  padding: "8px 18px",
                  borderRadius: 999,
                  boxShadow: "0 3px 0 #6D42C9",
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                {task.myRating == null ? "إرسال التقييم" : "تحديث التقييم"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
