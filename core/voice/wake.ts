export function matchesWakePhrase(transcript: string, phrases: string[]): boolean {
  const text = transcript.trim().toLowerCase();
  if (!text) return false;
  if (!phrases.length) return true;
  return phrases.some((phrase) => {
    const p = phrase.trim().toLowerCase();
    if (!p) return false;
    return text === p || text.startsWith(`${p} `) || text.includes(` ${p} `) || text.startsWith(`${p},`);
  });
}

export function stripWakePhrase(transcript: string, phrases: string[]): string {
  let text = transcript.trim();
  for (const phrase of phrases) {
    const p = phrase.trim();
    if (!p) continue;
    const re = new RegExp(`^\\s*${escapeRegExp(p)}[,:]?\\s*`, 'i');
    text = text.replace(re, '');
  }
  return text.trim() || transcript.trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
