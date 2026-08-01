import { CodeBlock } from "@/components/CodeBlock";
import { linkifyText } from "@/components/Linkify";
import { MarkdownView } from "@/components/MarkdownView";
import { looksLikeCode, type SubmissionTextFormat } from "@/lib/code";

export function SubmissionText({
  text,
  format,
}: {
  text: string;
  format?: SubmissionTextFormat;
}) {
  const resolved = format && format !== "auto" ? format : looksLikeCode(text) ? "code" : "text";

  if (resolved === "code") return <CodeBlock code={text} />;
  if (resolved === "markdown") return <MarkdownView text={text} />;
  return (
    <div
      dir="auto"
      style={{ fontSize: 15, color: "#2B2118", fontWeight: 500, whiteSpace: "pre-wrap" }}
    >
      {linkifyText(text)}
    </div>
  );
}
