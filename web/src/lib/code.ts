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

  let score = 0;
  for (const pattern of CODE_SIGNALS) {
    if (pattern.test(trimmed)) score++;
  }

  const symbolCount = (trimmed.match(/[{}()[\];=<>]/g) || []).length;
  if (symbolCount / trimmed.length > 0.04) score++;

  return score >= 2;
}
