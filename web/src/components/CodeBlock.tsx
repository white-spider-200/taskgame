"use client";

import { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/vs2015.css";

let registered = false;
function ensureLanguagesRegistered() {
  if (registered) return;
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("python", python);
  hljs.registerLanguage("xml", xml);
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("sql", sql);
  hljs.registerLanguage("bash", bash);
  registered = true;
}

export function CodeBlock({ code }: { code: string }) {
  const html = useMemo(() => {
    ensureLanguagesRegistered();
    return hljs.highlightAuto(code).value;
  }, [code]);

  return (
    <pre
      dir="ltr"
      style={{
        margin: 0,
        background: "#1e1e1e",
        borderRadius: 10,
        padding: "14px 16px",
        overflowX: "auto",
        fontSize: 13.5,
        lineHeight: 1.6,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
      }}
    >
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}
