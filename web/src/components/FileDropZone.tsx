"use client";

import { useEffect, useRef, useState } from "react";

export function FileDropZone({
  file,
  onFileChange,
  accept,
  label,
  accent,
  accentDeep,
  currentUrl,
  currentFileName,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
  label: string;
  accent: string;
  accentDeep: string;
  currentUrl?: string | null;
  currentFileName?: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const showUrl = previewUrl || currentUrl || null;
  const isVideo = file
    ? file.type.startsWith("video/")
    : /\.(mp4|webm|mov)$/i.test(showUrl || "");
  const fileLabel = file ? file.name : currentFileName;

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) onFileChange(f);
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const item = Array.from(items).find((i) => i.type.startsWith("image/"));
      const f = item?.getAsFile();
      if (f) {
        e.preventDefault();
        onFileChange(f);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFileChange]);

  return (
    <div
      className={`filedrop-zone${dragging ? " dragging" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      style={
        {
          "--accent": accent,
          "--accent-deep": accentDeep,
          cursor: "pointer",
          border: `2px dashed ${dragging ? accentDeep : accent}`,
          borderRadius: 14,
          padding: showUrl ? 10 : 20,
          textAlign: "center",
          background: dragging ? `${accent}22` : "#FFF",
        } as React.CSSProperties
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
      {showUrl ? (
        <div>
          {isVideo ? (
            <video
              src={showUrl}
              muted
              className="filedrop-media"
              style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 10 }}
            />
          ) : (
            <img
              src={showUrl}
              alt="معاينة"
              className="filedrop-media"
              style={{
                maxWidth: "100%",
                maxHeight: 260,
                borderRadius: 10,
                objectFit: "contain",
              }}
            />
          )}
          <div
            style={{
              fontSize: 12,
              color: accentDeep,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {fileLabel} — اضغط أو اسحب أو الصق (Ctrl+V) للاستبدال
          </div>
        </div>
      ) : (
        <div>
          <div style={{ color: accentDeep, fontWeight: 700, fontSize: 13.5 }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#9A8A73",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            اسحب صورة أو فيديو هنا، اضغط للاختيار، أو الصق (Ctrl+V)
          </div>
        </div>
      )}
    </div>
  );
}
