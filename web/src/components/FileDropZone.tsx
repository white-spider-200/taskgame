"use client";

import { useEffect, useRef, useState } from "react";

export const MAX_IMAGES_PER_SUBMISSION = 5;
export const MAX_VIDEOS_PER_SUBMISSION = 3;

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
  kind: "image" | "video";
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
  const [previews, setPreviews] = useState<{ url: string; isVideo: boolean }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((f) => ({
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith("video/"),
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

  async function addFiles(newFiles: FileList | File[] | null) {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    const merged = [...files];
    let imgCount = imageCount;
    let vidCount = videoCount;
    for (const f of incoming) {
      const isVideo = f.type.startsWith("video/");
      if (isVideo) {
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
    imageCount >= MAX_IMAGES_PER_SUBMISSION && videoCount >= MAX_VIDEOS_PER_SUBMISSION;
  const thumbs = [
    ...existingFiles.map((f) => ({
      key: f.id,
      url: f.url,
      isVideo: f.kind === "video",
      name: f.name,
      onRemove: onRemoveExisting ? () => onRemoveExisting(f.id) : undefined,
    })),
    ...previews.map((p, i) => ({
      key: `new-${i}`,
      url: p.url,
      isVideo: p.isVideo,
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
          {MAX_VIDEOS_PER_SUBMISSION} فيديوهات
        </div>
        <div style={{ fontSize: 11.5, color: "#B8A98F", fontWeight: 600, marginTop: 2 }}>
          {imageCount}/{MAX_IMAGES_PER_SUBMISSION} صور · {videoCount}/{MAX_VIDEOS_PER_SUBMISSION} فيديو
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
              {t.isVideo ? (
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
