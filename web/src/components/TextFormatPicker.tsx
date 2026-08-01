import type { SubmissionTextFormat } from "@/lib/code";

const OPTIONS: { value: SubmissionTextFormat; label: string }[] = [
  { value: "auto", label: "تلقائي" },
  { value: "text", label: "نص عادي" },
  { value: "code", label: "كود" },
  { value: "markdown", label: "ماركداون" },
];

export function TextFormatPicker({
  value,
  onChange,
  accent,
}: {
  value: SubmissionTextFormat;
  onChange: (value: SubmissionTextFormat) => void;
  accent: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="btn-anim"
            style={{
              background: active ? accent : "#FFF",
              color: active ? "#FFF" : "#7A6A55",
              fontWeight: 700,
              fontSize: 12.5,
              padding: "5px 12px",
              borderRadius: 999,
              border: `2px solid ${active ? accent : "#E4D5B0"}`,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
