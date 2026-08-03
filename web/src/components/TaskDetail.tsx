"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  deleteTaskAction,
  editSubmissionAction,
  finishTaskAction,
  rateTaskAction,
} from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { ExcelPreview } from "@/components/ExcelPreview";
import { PdfPreview } from "@/components/PdfPreview";
import { FileDropZone } from "@/components/FileDropZone";
import { linkifyText } from "@/components/Linkify";
import { SubmissionText } from "@/components/SubmissionText";
import { TextFormatPicker } from "@/components/TextFormatPicker";
import type { SubmissionTextFormat } from "@/lib/code";
import {
  CATEGORY_ICONS,
  RATING_LABELS,
  fmtDur,
  fmtTimer,
  starsStr,
} from "@/lib/format";
import { playNotificationSound, playToastSound, type ToastSoundType } from "@/lib/sound";
import type { TeamPayload } from "@/lib/team";
import { Toast } from "./playground/Toast";

const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf,.xlsx,.xls,.csv,.pdf";

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
  const [proofFormat, setProofFormat] = useState<SubmissionTextFormat>("auto");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editFormat, setEditFormat] = useState<SubmissionTextFormat>("auto");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<{ url: string; kind: "image" | "video" } | null>(
    null,
  );
  const [removeFileIds, setRemoveFileIds] = useState<string[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const myId = data.me.id;
    const justSubmitted = initial.tasks.some((t) => {
      if (t.ownerId === myId) return false;
      const prev = data.tasks.find((p) => p.id === t.id);
      return prev?.status === "running" && t.status === "review";
    });
    if (justSubmitted) playNotificationSound();
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

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  void tick;

  function showToast(msg: string, sound: ToastSoundType = "success") {
    setToast(msg);
    playToastSound(sound);
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
    if (!text && proofFiles.length === 0) {
      showToast("أرفق نصًا أو صورة كإثبات للعمل", "error");
      return;
    }
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("text", text);
    fd.set("textFormat", proofFormat);
    for (const f of proofFiles) fd.append("files", f);

    startTransition(async () => {
      const res = await finishTaskAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
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
      showToast("🎉 أُنهيت المهمة — بانتظار تقييم زميل", "finished");
      router.refresh();
    });
  }

  function onDelete() {
    if (!window.confirm("هل تريد حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteTaskAction(taskId);
      if (res?.error) {
        showToast(res.error, "error");
        return;
      }
      router.push(`/t/${teamId}`);
      router.refresh();
    });
  }

  function openEditForm() {
    setEditText(task?.submission?.text ?? "");
    setEditFormat(task?.submission?.textFormat ?? "auto");
    setEditFiles([]);
    setRemoveFileIds([]);
    setEditing(true);
  }

  function onEditSubmit() {
    const text = editText.trim();
    const remainingExisting = (task?.submission?.files ?? []).filter(
      (f) => !removeFileIds.includes(f.id),
    );
    if (!text && editFiles.length === 0 && remainingExisting.length === 0) {
      showToast("أرفق نصًا أو صورة كإثبات للعمل", "error");
      return;
    }
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("text", text);
    fd.set("textFormat", editFormat);
    for (const f of editFiles) fd.append("files", f);
    if (removeFileIds.length) fd.set("removeFileIds", removeFileIds.join(","));

    startTransition(async () => {
      const res = await editSubmissionAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
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
      showToast("اختر عدد النجوم أولًا ⭐", "error");
      return;
    }
    startTransition(async () => {
      const res = await rateTaskAction(taskId, stars);
      if (!res || !("ok" in res) || !res.ok) {
        showToast(res?.error || "تعذّر إرسال التقييم", "error");
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
      showToast(`⭐ تم إرسال تقييمك (${stars} نجوم)`, "rated");
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
          className="proof-card"
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
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Avatar
              url={owner?.avatarUrl}
              initial={owner?.initial || "؟"}
              color={owner?.color || "#9A8A73"}
              size={48}
              style={{ fontSize: 18 }}
            />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div
                dir="auto"
                style={{
                  fontWeight: 800,
                  fontSize: 21,
                  color: "#2B2118",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
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
            {task.status === "running" && isMine ? (
              <button
                type="button"
                onClick={onDelete}
                className="btn-anim"
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
                className="badge-pulse"
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
            <div
              style={{
                fontSize: 15,
                color: "#7A6A55",
                fontWeight: 500,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                maxHeight: 260,
                overflowY: "auto",
                overflowX: "auto",
                paddingInlineEnd: 4,
              }}
            >
              {linkifyText(task.desc)}
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
              className="proof-card"
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
                dir="auto"
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
              <TextFormatPicker value={proofFormat} onChange={setProofFormat} accent="#1FB6A6" />
              <FileDropZone
                files={proofFiles}
                onFilesChange={setProofFiles}
                accept={FILE_ACCEPT}
                label="تحميل صور أو فيديوهات إثبات"
                accent="#1FB6A6"
                accentDeep="#0E8A7D"
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={onFinishSubmit}
                  className="btn-anim"
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
              className="proof-card"
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
                    className="btn-anim"
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
                        maxHeight: 400,
                        overflowY: "auto",
                        overflowX: "auto",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        paddingInlineEnd: 4,
                      }}
                    >
                      <SubmissionText
                        text={task.submission.text}
                        format={task.submission.textFormat}
                      />
                    </div>
                  ) : null}
                  {task.submission.files.some((f) => f.kind === "spreadsheet") ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {task.submission.files
                        .filter((f) => f.kind === "spreadsheet")
                        .map((f) => (
                          <ExcelPreview key={f.id} url={f.url} name={f.name} />
                        ))}
                    </div>
                  ) : null}
                  {task.submission.files.some((f) => f.kind === "doc") ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {task.submission.files
                        .filter((f) => f.kind === "doc")
                        .map((f) => (
                          <PdfPreview key={f.id} url={f.url} name={f.name} />
                        ))}
                    </div>
                  ) : null}
                  {task.submission.files.some((f) => f.kind === "image" || f.kind === "video") ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {task.submission.files
                        .filter((f) => f.kind === "image" || f.kind === "video")
                        .map((f, i) =>
                        f.kind === "video" ? (
                          <div
                            key={f.id}
                            style={{ position: "relative", animationDelay: `${i * 0.05}s` }}
                            className="thumb-pop"
                          >
                            <video
                              src={f.url}
                              controls
                              style={{
                                width: "100%",
                                maxHeight: 260,
                                borderRadius: 12,
                                border: "1px solid #FFE3B3",
                                background: "#FFF",
                                display: "block",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setLightbox({ url: f.url, kind: "video" })}
                              aria-label="تكبير الفيديو"
                              style={{
                                position: "absolute",
                                top: 8,
                                insetInlineStart: 8,
                                background: "rgba(43,33,24,0.65)",
                                color: "#FFF",
                                border: "none",
                                borderRadius: 8,
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "zoom-in",
                                fontSize: 14,
                              }}
                            >
                              ⛶
                            </button>
                          </div>
                        ) : (
                          <img
                            key={f.id}
                            src={f.url}
                            alt="إثبات المهمة"
                            onClick={() => setLightbox({ url: f.url, kind: "image" })}
                            className="thumb-pop"
                            style={{
                              width: "100%",
                              maxHeight: 260,
                              borderRadius: 12,
                              objectFit: "contain",
                              border: "1px solid #FFE3B3",
                              background: "#FFF",
                              animationDelay: `${i * 0.05}s`,
                              cursor: "zoom-in",
                            }}
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea
                    dir="auto"
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
                  <TextFormatPicker value={editFormat} onChange={setEditFormat} accent="#F2C94C" />
                  <FileDropZone
                    files={editFiles}
                    onFilesChange={setEditFiles}
                    accept={FILE_ACCEPT}
                    label="إضافة صور أو فيديوهات"
                    accent="#F2C94C"
                    accentDeep="#B87A00"
                    existingFiles={task.submission.files.filter(
                      (f) => !removeFileIds.includes(f.id),
                    )}
                    onRemoveExisting={(id) =>
                      setRemoveFileIds((ids) => [...ids, id])
                    }
                  />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="btn-anim"
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
                      className="btn-anim"
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
                    className="star-anim"
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
                className="btn-anim"
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

      {lightbox ? (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,14,8,0.88)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="إغلاق"
            style={{
              position: "absolute",
              top: 18,
              insetInlineEnd: 22,
              background: "rgba(255,255,255,0.15)",
              color: "#FFF",
              border: "none",
              borderRadius: 999,
              width: 38,
              height: 38,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          {lightbox.kind === "video" ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                borderRadius: 12,
                background: "#000",
              }}
            />
          ) : (
            <img
              src={lightbox.url}
              alt="إثبات المهمة مكبّر"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                borderRadius: 12,
                objectFit: "contain",
                cursor: "default",
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
