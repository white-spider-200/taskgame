"use client";

import { useState } from "react";

// PDFs are rendered by the browser's own viewer via <object>. Mobile browsers
// often refuse to embed, so the download/open link is always shown.
export function PdfPreview({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid #FFE3B3",
        borderRadius: 12,
        background: "#FFF",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "#FDF2F2",
          borderBottom: open ? "1px solid #FFE3B3" : "none",
        }}
      >
        <span style={{ fontSize: 18 }}>📄</span>
        <span
          style={{
            flex: 1,
            fontSize: 12.5,
            fontWeight: 700,
            color: "#B4342F",
            wordBreak: "break-all",
            minWidth: 0,
          }}
        >
          {name}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-anim"
          style={{
            border: "1px solid #FFD9A8",
            background: "#FFF",
            color: "#8A6A3A",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {open ? "إخفاء" : "معاينة"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            border: "1px solid #FFD9A8",
            background: "#FFF",
            color: "#8A6A3A",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 11.5,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          فتح
        </a>
      </div>
      {open ? (
        <object data={url} type="application/pdf" style={{ width: "100%", height: 420, display: "block" }}>
          <div style={{ padding: 12, fontSize: 12.5, color: "#9A8A73" }}>
            لا يمكن عرض الملف هنا —{" "}
            <a href={url} target="_blank" rel="noreferrer" style={{ color: "#B4342F" }}>
              افتح PDF في تبويب جديد
            </a>
          </div>
        </object>
      ) : null}
    </div>
  );
}
