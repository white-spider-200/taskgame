"use client";

import { useEffect, useRef, useState } from "react";

export const MAX_IMAGES_PER_SUBMISSION = 5;
export const MAX_VIDEOS_PER_SUBMISSION = 3;
export const MAX_SPREADSHEETS_PER_SUBMISSION = 3;
export const MAX_DOCS_PER_SUBMISSION = 3;

const SPREADSHEET_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];
const SPREADSHEET_EXTENSIONS = ["xlsx", "xls", "csv"];

function isSpreadsheetFile(file: File): boolean {
  if (SPREADSHEET_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (file.type === "" || file.type === "application/octet-stream") && SPREADSHEET_EXTENSIONS.includes(ext);
}

function isDocFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (file.type === "" || file.type === "application/octet-stream") && ext === "pdf";
}

const COMPRESS_ABOVE_BYTES = 2 * 1024 * 1024;
const COMPRESS_MAX_DIMENSION = 1920;
const COMPRESS_QUALITY = 0.82;

// Phone-camera photos routinely exceed the server's upload cap, so large
// images are downscaled/re-encoded client-side before they ever reach it.
async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size <= COMPRESS_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

export type ExistingFile = {
  id: string;
  url: string;
  name: string;
  kind: "image" | "video" | "spreadsheet" | "doc";
};

export function FileDropZone({
  files,
  onFilesChange,
  existingFiles = [],
  onRemoveExisting,
  accept,
  label,
  accent,
  accentDeep,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingFiles?: ExistingFile[];
  onRemoveExisting?: (id: string) => void;
  accept: string;
  label: string;
  accent: string;
  accentDeep: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<
    { url: string; isVideo: boolean; isSpreadsheet: boolean; isDoc: boolean }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((f) => ({
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith("video/"),
      isSpreadsheet: isSpreadsheetFile(f),
      isDoc: isDocFile(f),
    }));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u.url));
  }, [files]);

  const imageCount =
    existingFiles.filter((f) => f.kind === "image").length +
    files.filter((f) => f.type.startsWith("image/")).length;
  const videoCount =
    existingFiles.filter((f) => f.kind === "video").length +
    files.filter((f) => f.type.startsWith("video/")).length;
  const spreadsheetCount =
    existingFiles.filter((f) => f.kind === "spreadsheet").length +
    files.filter((f) => isSpreadsheetFile(f)).length;
  const docCount =
    existingFiles.filter((f) => f.kind === "doc").length +
    files.filter((f) => isDocFile(f)).length;

  async function addFiles(newFiles: FileList | File[] | null) {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    const merged = [...files];
    let imgCount = imageCount;
    let vidCount = videoCount;
    let sheetCount = spreadsheetCount;
    let pdfCount = docCount;
    for (const f of incoming) {
      const isVideo = f.type.startsWith("video/");
      const isSheet = isSpreadsheetFile(f);
      const isDoc = isDocFile(f);
      if (isDoc) {
        if (pdfCount >= MAX_DOCS_PER_SUBMISSION) continue;
        pdfCount++;
        merged.push(f);
      } else if (isSheet) {
        if (sheetCount >= MAX_SPREADSHEETS_PER_SUBMISSION) continue;
        sheetCount++;
        merged.push(f);
      } else if (isVideo) {
        if (vidCount >= MAX_VIDEOS_PER_SUBMISSION) continue;
        vidCount++;
        merged.push(f);
      } else {
        if (imgCount >= MAX_IMAGES_PER_SUBMISSION) continue;
        imgCount++;
        merged.push(await compressImage(f));
      }
    }
    onFilesChange(merged);
  }

  function removeAt(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted = Array.from(items)
        .filter((i) => i.type.startsWith("image/") || i.type.startsWith("video/"))
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);
      if (pasted.length) {
        e.preventDefault();
        addFiles(pasted);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [files, imageCount, videoCount]);

  const atLimit =
    imageCount >= MAX_IMAGES_PER_SUBMISSION &&
    videoCount >= MAX_VIDEOS_PER_SUBMISSION &&
    spreadsheetCount >= MAX_SPREADSHEETS_PER_SUBMISSION &&
    docCount >= MAX_DOCS_PER_SUBMISSION;
  const thumbs = [
    ...existingFiles.map((f) => ({
      key: f.id,
      url: f.url,
      isVideo: f.kind === "video",
      isSpreadsheet: f.kind === "spreadsheet",
      isDoc: f.kind === "doc",
      name: f.name,
      onRemove: onRemoveExisting ? () => onRemoveExisting(f.id) : undefined,
    })),
    ...previews.map((p, i) => ({
      key: `new-${i}`,
      url: p.url,
      isVideo: p.isVideo,
      isSpreadsheet: p.isSpreadsheet,
      isDoc: p.isDoc,
      name: files[i]?.name ?? "",
      onRemove: () => removeAt(i),
    })),
  ];

  return (
    <div>
      <div
        className={`filedrop-zone${dragging ? " dragging" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!atLimit) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !atLimit) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!atLimit) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        style={
          {
            "--accent": accent,
            "--accent-deep": accentDeep,
            cursor: atLimit ? "default" : "pointer",
            border: `2px dashed ${dragging ? accentDeep : accent}`,
            borderRadius: 14,
            padding: 20,
            textAlign: "center",
            background: dragging ? `${accent}22` : "#FFF",
            opacity: atLimit ? 0.6 : 1,
          } as React.CSSProperties
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
        <div style={{ color: accentDeep, fontWeight: 700, fontSize: 13.5 }}>
          {atLimit ? "بلغت الحد الأقصى للملفات" : label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#9A8A73",
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          اسحب أو اضغط أو الصق (Ctrl+V) — حتى {MAX_IMAGES_PER_SUBMISSION} صور و
          {" "}
          {MAX_VIDEOS_PER_SUBMISSION} فيديوهات و {MAX_SPREADSHEETS_PER_SUBMISSION} ملفات إكسل و{" "}
          {MAX_DOCS_PER_SUBMISSION} ملفات PDF
        </div>
        <div style={{ fontSize: 11.5, color: "#B8A98F", fontWeight: 600, marginTop: 2 }}>
          {imageCount}/{MAX_IMAGES_PER_SUBMISSION} صور · {videoCount}/{MAX_VIDEOS_PER_SUBMISSION} فيديو ·{" "}
          {spreadsheetCount}/{MAX_SPREADSHEETS_PER_SUBMISSION} إكسل · {docCount}/
          {MAX_DOCS_PER_SUBMISSION} PDF
        </div>
      </div>

      {thumbs.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 8,
            marginTop: 10,
          }}
        >
          {thumbs.map((t, i) => (
            <div
              key={t.key}
              className="thumb-pop"
              style={{
                position: "relative",
                border: `1px solid ${accent}`,
                borderRadius: 10,
                overflow: "hidden",
                background: "#FFF",
                aspectRatio: "1 / 1",
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {t.isDoc ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 6,
                    background: "#FDF2F2",
                  }}
                >
                  <span style={{ fontSize: 26 }}>📄</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#B4342F",
                      fontWeight: 600,
                      textAlign: "center",
                      wordBreak: "break-all",
                      lineHeight: 1.2,
                    }}
                  >
                    {t.name}
                  </span>
                </div>
              ) : t.isSpreadsheet ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 6,
                    background: "#F3FBF4",
                  }}
                >
                  <span style={{ fontSize: 26 }}>📊</span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#2B7A4B",
                      fontWeight: 600,
                      textAlign: "center",
                      wordBreak: "break-all",
                      lineHeight: 1.2,
                    }}
                  >
                    {t.name}
                  </span>
                </div>
              ) : t.isVideo ? (
                <video
                  src={t.url}
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={t.url}
                  alt={t.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              {t.onRemove ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    t.onRemove?.();
                  }}
                  className="btn-anim"
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "#FFF",
                    fontSize: 13,
                    lineHeight: "22px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  aria-label="إزالة الملف"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
