const URL_RE = /(https?:\/\/[^\s<>"]+)/g;
const URL_RE_TEST = /^https?:\/\/[^\s<>"]+$/;
const INLINE_CODE_RE = /(`[^`\n]+`)/g;

function linkifySegment(text: string, keyPrefix: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE_TEST.test(part) ? (
      <a
        key={`${keyPrefix}-${i}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#2563EB", textDecoration: "underline", wordBreak: "break-all" }}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export function linkifyText(text: string) {
  const parts = text.split(INLINE_CODE_RE);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
      <code
        key={i}
        dir="ltr"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
          background: "#F3ECDD",
          border: "1px solid #E4D5B0",
          borderRadius: 4,
          padding: "1px 5px",
          fontSize: "0.9em",
          unicodeBidi: "plaintext",
        }}
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      linkifySegment(part, String(i))
    ),
  );
}
