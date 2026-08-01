import {
  AlignmentType,
  BorderStyle,
  CharacterSet,
  Document,
  HeadingLevel,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  TextRun,
  type IParagraphOptions,
  type IRunOptions,
  type ParagraphChild,
} from "docx";
import { fmtDur, starsStr } from "@/lib/format";
import type { TaskDTO, TeamMember } from "@/lib/team";

type MemberWeekStat = TeamMember & {
  done: number;
  expired: number;
  avgStars: string;
  points: number;
  totalTime: number;
  tasks: TaskDTO[];
};

const INK = "2B2118";
const MUTED = "6B5B4A";
const MAX_IMG = 180;

/** Body text — readable Naskh, same family as many Arabic office docs. */
const FONT_BODY = "Noto Naskh Arabic";
/** Titles — matches the reference weekly report. */
const FONT_TITLE = "Noto Kufi Arabic";

const AR_FONT = {
  ascii: FONT_BODY,
  hAnsi: FONT_BODY,
  cs: FONT_BODY,
  eastAsia: FONT_BODY,
} as const;

const AR_TITLE_FONT = {
  ascii: FONT_TITLE,
  hAnsi: FONT_TITLE,
  cs: FONT_TITLE,
  eastAsia: FONT_TITLE,
} as const;

const AR_LANG = { value: "ar-SA", bidirectional: "ar-SA" } as const;
const EN_LANG = { value: "en-US" } as const;

/** Arabic-script unicode blocks (incl. Arabic presentation forms). */
const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const ARABIC_RUN_RE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+|[^؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g;

/**
 * Splits mixed-script text into per-script segments (Arabic vs everything
 * else) so each becomes its own run — matching how the browser's Unicode
 * bidi algorithm renders mixed Arabic/English inside an RTL container in
 * the printable report: Arabic runs flow right-to-left, embedded English
 * words/numbers flow left-to-right, at their natural position in the line.
 */
function splitBidiSegments(text: string): { text: string; rtl: boolean }[] {
  const matches = text.match(ARABIC_RUN_RE);
  if (!matches) return [{ text, rtl: true }];
  return matches.map((seg) => ({ text: seg, rtl: ARABIC_RE.test(seg) }));
}

function arRun(opts: IRunOptions & { title?: boolean; rtl?: boolean }): TextRun {
  const { title, font, rtl = true, ...rest } = opts;
  return new TextRun({
    rightToLeft: rtl,
    font: font ?? (title ? AR_TITLE_FONT : AR_FONT),
    language: rtl ? AR_LANG : EN_LANG,
    ...rest,
  });
}

/** Builds one TextRun per script segment of `text`, sharing the given formatting. */
function bidiRuns(text: string, opts: Omit<IRunOptions & { title?: boolean }, "text">): TextRun[] {
  return splitBidiSegments(text).map(({ text: seg, rtl }) => arRun({ ...opts, text: seg, rtl }));
}

function rtlPara(children: ParagraphChild[], opts: Partial<IParagraphOptions> = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { line: 360, lineRule: LineRuleType.AUTO, after: 80 },
    ...opts,
    children,
  });
}

function taskDate(t: TaskDTO) {
  return t.completedAt
    ? new Date(t.completedAt).toLocaleDateString("ar", { day: "numeric", month: "long" })
    : "—";
}

function taskStars(t: TaskDTO) {
  return t.stars ? `${starsStr(Math.round(t.stars))} (${t.stars.toFixed(1)})` : "—";
}

function guessImageType(url: string, mime: string | null): "jpg" | "png" | "gif" | "bmp" | "webp" | null {
  const fromMime = (mime || "").toLowerCase();
  if (fromMime.includes("jpeg") || fromMime.includes("jpg")) return "jpg";
  if (fromMime.includes("png")) return "png";
  if (fromMime.includes("gif")) return "gif";
  if (fromMime.includes("bmp")) return "bmp";
  if (fromMime.includes("webp")) return "webp";
  const lower = url.toLowerCase().split("?")[0] || "";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".gif")) return "gif";
  if (lower.endsWith(".bmp")) return "bmp";
  if (lower.endsWith(".webp")) return "webp";
  return null;
}

async function loadImageForDocx(url: string, name: string): Promise<ImageRun | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type");
    const kind = guessImageType(url, mime);
    if (!kind) return null;

    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: mime || `image/${kind === "jpg" ? "jpeg" : kind}` });
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_IMG / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!pngBlob) return null;
    const pngBuf = await pngBlob.arrayBuffer();
    return new ImageRun({
      type: "png",
      data: pngBuf,
      transformation: { width, height },
      altText: { title: name, description: name, name },
    });
  } catch {
    return null;
  }
}

async function loadFont(path: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function multilineParas(label: string, text: string): Paragraph[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return lines.map((line, i) =>
    rtlPara(
      bidiRuns(i === 0 ? `${label}: ${line}` : line, { size: 22, color: INK }),
      { spacing: { after: i === lines.length - 1 ? 100 : 40, line: 360 } },
    ),
  );
}

async function taskBlocks(t: TaskDTO, index: number): Promise<Paragraph[]> {
  const blocks: Paragraph[] = [
    rtlPara(bidiRuns(`${index}. ${t.title}`, { bold: true, size: 28, color: INK, title: true }), {
      spacing: { before: 240, after: 60, line: 320 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "E4D5B0", space: 10 },
      },
    }),
    rtlPara(
      [
        arRun({
          text: `التصنيف: ${t.category}  |  التقييم: ${taskStars(t)}  |  الوقت: ${fmtDur(t.elapsedMs || 0)}  |  التاريخ: ${taskDate(t)}`,
          size: 20,
          color: MUTED,
        }),
      ],
      { spacing: { after: 100, line: 320 } },
    ),
  ];

  if (t.desc.trim()) blocks.push(...multilineParas("الوصف", t.desc));
  if (t.submission?.text.trim()) {
    blocks.push(...multilineParas("الإنجاز", t.submission.text));
  }

  const files = t.submission?.files ?? [];
  for (const f of files) {
    if (f.kind === "image") {
      const img = await loadImageForDocx(f.url, f.name);
      if (img) {
        blocks.push(rtlPara([img], { spacing: { before: 80, after: 80 } }));
      } else {
        blocks.push(
          rtlPara(bidiRuns(`صورة: ${f.name}`, { size: 20, color: MUTED }), {
            spacing: { after: 60 },
          }),
        );
      }
    } else {
      const kindLabel = f.kind === "spreadsheet" ? "جدول" : "فيديو";
      blocks.push(
        rtlPara(bidiRuns(`${kindLabel}: ${f.name}`, { size: 20, color: MUTED }), {
          spacing: { after: 60 },
        }),
      );
    }
  }

  return blocks;
}

/**
 * Builds an editable Word report that mirrors the printable PDF layout:
 * title, summary stats, then per-task details with proof photos embedded.
 */
export async function buildWeeklyReportDocx(
  m: MemberWeekStat,
  teamName: string,
  weekLbl: string,
): Promise<Blob> {
  const subject = `تقرير الأداء الأسبوعي — ${m.name} — ${weekLbl}`;
  const summaryLines = [
    "مرحبًا،",
    "",
    `فيما يلي تقرير الأداء الأسبوعي لـ ${m.name} ضمن ${teamName}.`,
    `الأسبوع: ${weekLbl}`,
    "",
    `المهام المنجزة: ${m.done}`,
    `المهام غير المكتملة: ${m.expired}`,
    `متوسط التقييم: ${m.avgStars}`,
    `النقاط المكتسبة: ${m.points}`,
    `إجمالي وقت العمل: ${fmtDur(m.totalTime)}`,
  ];

  const children: Paragraph[] = [
    rtlPara([arRun({ text: subject, bold: true, size: 36, color: INK, title: true })], {
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240, line: 320 },
    }),
    ...summaryLines.map((line) =>
      rtlPara([arRun({ text: line || " ", size: 24, color: INK })], {
        spacing: { after: 60, line: 360 },
      }),
    ),
    rtlPara([arRun({ text: "تفاصيل المهام", bold: true, size: 30, color: INK, title: true })], {
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 160, line: 320 },
    }),
  ];

  if (m.tasks.length === 0) {
    children.push(
      rtlPara([arRun({ text: "لا توجد مهام منجزة هذا الأسبوع.", size: 24, color: MUTED })]),
    );
  } else {
    for (let i = 0; i < m.tasks.length; i++) {
      children.push(...(await taskBlocks(m.tasks[i]!, i + 1)));
    }
  }

  children.push(
    rtlPara(
      [
        arRun({
          text: "تم إنشاء هذا التقرير تلقائيًا بواسطة ملعب المهام.",
          size: 18,
          color: MUTED,
          italics: true,
        }),
      ],
      { spacing: { before: 400 }, alignment: AlignmentType.CENTER },
    ),
  );

  const [naskhReg, naskhBold, kufiReg] = await Promise.all([
    loadFont("/fonts/NotoNaskhArabic-Regular.ttf"),
    loadFont("/fonts/NotoNaskhArabic-Bold.ttf"),
    loadFont("/fonts/NotoKufiArabic-Regular.ttf"),
  ]);

  const fonts = [
    naskhReg && { name: FONT_BODY, data: naskhReg as unknown as Buffer, characterSet: CharacterSet.ARABIC },
    naskhBold && { name: FONT_BODY, data: naskhBold as unknown as Buffer, characterSet: CharacterSet.ARABIC },
    kufiReg && { name: FONT_TITLE, data: kufiReg as unknown as Buffer, characterSet: CharacterSet.ARABIC },
  ].filter(Boolean) as { name: string; data: Buffer; characterSet: typeof CharacterSet.ARABIC }[];

  const doc = new Document({
    fonts: fonts.length ? fonts : undefined,
    styles: {
      default: {
        document: {
          run: {
            font: AR_FONT,
            rightToLeft: true,
            language: AR_LANG,
            size: 24,
          },
          paragraph: {
            alignment: AlignmentType.RIGHT,
            spacing: { line: 360, lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
