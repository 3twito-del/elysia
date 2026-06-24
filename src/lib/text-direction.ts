export type TextDirection = "ltr" | "rtl";

/**
 * Resolve writing direction from the content language so a heading sits on the
 * side that reads naturally: a Latin-first string flows left-to-right, a
 * Hebrew-first string right-to-left. Falls back to rtl (the site's base
 * direction) when the string carries no directional letters.
 */
export function getTextDirection(text: string): TextDirection {
  for (const character of text) {
    if (/[֐-׿]/u.test(character)) return "rtl";
    if (/[A-Za-z]/u.test(character)) return "ltr";
  }

  return "rtl";
}
