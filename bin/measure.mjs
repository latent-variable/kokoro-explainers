// The two measurements the review packet makes about on-screen time, kept here so they can be tested.
//   readingSeconds(text)       how long a viewer needs to read a piece of on-screen text while listening
//   stillStretches(scene, ats) the longest stretch of a scene in which nothing new appears
// Prose is read at 3.3 words a second. Code is counted in identifier tokens (`Author.followers.of_type`
// is three), because it is harder to read than the same number of words, at 1.5 tokens a second.
export const READ_WPS = 3.3;
export const READ_CODE_TPS = 1.5;

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
// Letters and digits in any script; a CJK character is read as a word of its own.
export const words = (s) => (s.replace(CJK, " x ").match(/[\p{L}\p{N}][\p{L}\p{N}_'.-]*/gu) || []).length;
export const tokens = (s) => (s.replace(CJK, " x ").match(/[\p{L}\p{N}]+/gu) || []).length;
// Parentheses alone do not make code (prose has them); a call, a brace, an operator, an underscore or a dotted name does.
export const looksLikeCode = (s) => /[{}=<>_\[\]]|[\p{L}\p{N}_]\(|[\p{L}\p{N}]\.[\p{L}_(]/u.test(s);

export function readingSeconds(text) {
  return looksLikeCode(text) ? tokens(text) / READ_CODE_TPS : words(text) / READ_WPS;
}

/** The longest gap between things appearing in a scene: its start, each cue's time, its end. */
export function stillStretches(scene, cueTimes) {
  if (![scene.start, scene.duration, ...cueTimes].every(Number.isFinite) || scene.duration <= 0) throw new Error(`stillStretches: a scene needs a finite start and a positive duration (got ${scene.start}, ${scene.duration})`);
  const end = scene.start + scene.duration;
  const points = [scene.start, ...cueTimes.filter((t) => t > scene.start && t < end).sort((a, b) => a - b), end];
  let best = { seconds: 0, from: scene.start, to: end };
  for (let i = 1; i < points.length; i++) {
    const seconds = points[i] - points[i - 1];
    if (seconds > best.seconds) best = { seconds, from: points[i - 1], to: points[i] };
  }
  return best;
}

/**
 * A viewer reads in the order things appear and cannot read two things at once. Given the elements of one
 * scene as [{ at, text }] and the scene's end, return when each is read by: it starts when it lands or when
 * the viewer finishes the one before, whichever is later, and takes its reading time. `late` means the
 * viewer cannot finish it before the scene ends. Text that lands together queues, so three paragraphs on one
 * cue are not each judged as if they stood alone.
 */
export function readingQueue(items, sceneEnd) {
  if (!Number.isFinite(sceneEnd)) throw new Error("readingQueue: the scene end must be a finite number");
  let done = -Infinity;
  return [...items].sort((a, b) => a.at - b.at).map((it) => {
    const need = readingSeconds(it.text);
    done = Math.max(done, it.at) + need;
    return { ...it, need, readBy: done, late: done > sceneEnd + 1e-9 };
  });
}
