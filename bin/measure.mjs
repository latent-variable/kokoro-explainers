// The two measurements the review packet makes about on-screen time, kept here so they can be tested.
//   readingSeconds(text)       how long a viewer needs to read a piece of on-screen text while listening
//   stillStretches(scene, ats) the longest stretch of a scene in which nothing new appears
// Prose is read at 3.3 words a second. Code is counted in identifier tokens (`Author.followers.of_type`
// is three), because it is harder to read than the same number of words, at 1.5 tokens a second.
export const READ_WPS = 3.3;
export const READ_CODE_TPS = 1.5;

export const words = (s) => (s.match(/[A-Za-z0-9][\w'.-]*/g) || []).length;
export const tokens = (s) => (s.match(/[A-Za-z0-9]+/g) || []).length;
export const looksLikeCode = (s) => /[(){}=<>_\[\]]|[A-Za-z0-9]\.[A-Za-z_(]/.test(s);

export function readingSeconds(text) {
  return looksLikeCode(text) ? tokens(text) / READ_CODE_TPS : words(text) / READ_WPS;
}

/** The longest gap between things appearing in a scene: its start, each cue's time, its end. */
export function stillStretches(scene, cueTimes) {
  const end = scene.start + scene.duration;
  const points = [scene.start, ...cueTimes.filter((t) => t > scene.start && t < end).sort((a, b) => a - b), end];
  let best = { seconds: 0, from: scene.start, to: end };
  for (let i = 1; i < points.length; i++) {
    const seconds = points[i] - points[i - 1];
    if (seconds > best.seconds) best = { seconds, from: points[i - 1], to: points[i] };
  }
  return best;
}
