export const SUBMISSION_TEXT_FORMATS = ["auto", "code", "text", "markdown"] as const;
export type SubmissionTextFormat = (typeof SUBMISSION_TEXT_FORMATS)[number];

export function parseTextFormat(value: unknown): SubmissionTextFormat {
  return (SUBMISSION_TEXT_FORMATS as readonly string[]).includes(value as string)
    ? (value as SubmissionTextFormat)
    : "auto";
}

const CODE_SIGNALS: RegExp[] = [
  /[{};]/,
  /=>/,
  /\b(function|const|let|var|import|export|class|return|interface|extends|implements)\b/,
  /\bif\s*\(|\bfor\s*\(|\bwhile\s*\(/,
  /\bdef\b|\bprint\(|\bself\b|\belif\b/,
  /^\s{2,}\S/m,
  /<\/?[a-zA-Z][^>]*>/,
  /\b(public|private|protected|static|void|int|string|bool)\b/i,
  /\bSELECT\b.+\bFROM\b/i,
  /^\s*(\/\/|#|\/\*).*$/m,
];

export function looksLikeCode(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 8) return false;

  // Prose (a couple of grammatical sentences, no real line structure) can still
  // contain a stray semicolon/keyword/arrow and trip the signals below even
  // though it isn't code — e.g. "public bool X => Y(); A description of what
  // this does. More explanation." Treat that as plain text instead.
  const lines = trimmed.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  const sentenceEnders = (trimmed.match(/[.!?؟]\s+[A-Za-z؀-ۿ]/g) || []).length;
  if (lines.length <= 3 && sentenceEnders >= 2) return false;

  let score = 0;
  for (const pattern of CODE_SIGNALS) {
    if (pattern.test(trimmed)) score++;
  }

  const symbolCount = (trimmed.match(/[{}()[\];=<>]/g) || []).length;
  if (symbolCount / trimmed.length > 0.04) score++;

  return score >= 2;
}
