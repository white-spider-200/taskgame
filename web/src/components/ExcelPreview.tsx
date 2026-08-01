"use client";

import { useEffect, useId, useState } from "react";

const MAX_ROWS = 200;
const MAX_COLS = 40;

type SheetHtml = { name: string; html: string; truncated: boolean };

export function ExcelPreview({ url, name }: { url: string; name: string }) {
  const tableId = useId().replace(/:/g, "");
  const [sheets, setSheets] = useState<SheetHtml[] | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSheets(null);
    setError(null);
    setActiveSheet(0);

    (async () => {
      try {
        const [XLSX, res] = await Promise.all([import("xlsx"), fetch(url)]);
        if (!res.ok) throw new Error("تعذّر تحميل الملف");
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        const parsed: SheetHtml[] = workbook.SheetNames.map((sheetName, i) => {
          const sheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
          const clampedEndRow = Math.min(range.e.r, range.s.r + MAX_ROWS - 1);
          const clampedEndCol = Math.min(range.e.c, range.s.c + MAX_COLS - 1);
          const truncated = clampedEndRow < range.e.r || clampedEndCol < range.e.c;
          const clamped = {
            ...sheet,
            "!ref": XLSX.utils.encode_range({
              s: range.s,
              e: { r: clampedEndRow, c: clampedEndCol },
            }),
          };
          const html = XLSX.utils.sheet_to_html(clamped, {
            header: "",
            footer: "",
            id: `${tableId}-${i}`,
          });
          return { name: sheetName, html, truncated };
        });

        if (!cancelled) setSheets(parsed);
      } catch {
        if (!cancelled) setError("تعذّر عرض ملف الإكسل، يمكنك تنزيله بدلًا من ذلك");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, tableId]);

  if (error) {
    return (
      <div
        style={{
          border: "1px solid #FFE3B3",
          borderRadius: 12,
          background: "#FFF",
          padding: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "#B8622B", fontWeight: 600 }}>{error}</div>
        <a
          href={url}
          download={name}
          style={{ fontSize: 12.5, color: "#B87A00", fontWeight: 700, textDecoration: "underline" }}
        >
          تنزيل {name}
        </a>
      </div>
    );
  }

  if (!sheets) {
    return (
      <div
        style={{
          border: "1px solid #FFE3B3",
          borderRadius: 12,
          background: "#FFF",
          padding: 20,
          textAlign: "center",
          fontSize: 13,
          color: "#9A8A73",
          fontWeight: 600,
        }}
      >
        جارٍ تحميل ملف الإكسل...
      </div>
    );
  }

  const sheet = sheets[activeSheet];

  return (
    <div style={{ border: "1px solid #FFE3B3", borderRadius: 12, background: "#FFF", overflow: "hidden" }}>
      <style>{`
        .xlsx-preview table {
          border-collapse: collapse;
          font-size: 12.5px;
          width: 100%;
        }
        .xlsx-preview td {
          border: 1px solid #FFE3B3;
          padding: 4px 8px;
          color: #2B2118;
          white-space: nowrap;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 12px",
          background: "#FFF7EC",
          borderBottom: "1px solid #FFE3B3",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#2B2118" }}>
          <span>📊</span>
          <span dir="auto">{name}</span>
        </div>
        <a
          href={url}
          download={name}
          style={{ fontSize: 11.5, color: "#B87A00", fontWeight: 700, textDecoration: "underline" }}
        >
          تنزيل
        </a>
      </div>

      {sheets.length > 1 ? (
        <div style={{ display: "flex", gap: 4, padding: "6px 8px", overflowX: "auto", borderBottom: "1px solid #FFE3B3" }}>
          {sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSheet(i)}
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid " + (i === activeSheet ? "#B87A00" : "#FFE3B3"),
                background: i === activeSheet ? "#F2C94C" : "#FFF7EC",
                color: "#2B2118",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      <div
        dir="ltr"
        className="xlsx-preview"
        style={{ overflowX: "auto", overflowY: "auto", maxHeight: 360 }}
        dangerouslySetInnerHTML={{ __html: sheet.html }}
      />

      {sheet.truncated ? (
        <div style={{ padding: "6px 12px", fontSize: 11, color: "#B8A98F", borderTop: "1px solid #FFE3B3" }}>
          تم عرض جزء من الملف فقط (الحد الأقصى {MAX_ROWS} صف و {MAX_COLS} عمود)
        </div>
      ) : null}
    </div>
  );
}
