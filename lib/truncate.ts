// Обрезка текста до max символов по границе слова.
export function truncate(
  text: string,
  max = 300
): { text: string; truncated: boolean } {
  const clean = (text ?? "").trim();
  if (clean.length <= max) return { text: clean, truncated: false };

  let cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  cut = cut.replace(/[\s.,;:!?\-—]+$/u, "");

  return { text: cut, truncated: true };
}