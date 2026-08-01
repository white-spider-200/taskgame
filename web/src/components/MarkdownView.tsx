"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/CodeBlock";

export function MarkdownView({ text }: { text: string }) {
  return (
    <div dir="auto" className="markdown-view" style={{ color: "#2B2118", fontSize: 15 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#2563EB", textDecoration: "underline", wordBreak: "break-all" }}
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = /language-/.test(className || "");
            if (isBlock) {
              return <CodeBlock code={String(children).replace(/\n$/, "")} />;
            }
            return (
              <code
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
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
