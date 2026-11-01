// Text read from an app under test goes into prompts for Muse Code. A label or a value is data, never an
// instruction: it stays on one line and inside its code span, whatever characters it carries.

const BREAKS = /[\r\n\u2028\u2029\u0085]+/g;

/** One line: line breaks of any kind become a space, so a value cannot start a new paragraph of the prompt. */
export const line = (s: string): string => s.replace(BREAKS, " ");

/**
 * A Markdown code span that holds `s` exactly (on one line): the fence is one backtick longer than the longest run
 * of backticks inside, and padded when `s` starts or ends with one, as CommonMark specifies. A value with a
 * backtick cannot close the span and write prose after it.
 */
export function code(s: string): string {
  const text = line(s);
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}
