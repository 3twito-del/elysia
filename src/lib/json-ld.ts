const HTML_ESCAPES: Record<string, string> = {
  "&": "\\u0026",
  "<": "\\u003c",
  ">": "\\u003e",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const HTML_ESCAPE_PATTERN = /[&<>\u2028\u2029]/g;

export function stringifyJsonLd(value: unknown) {
  return JSON.stringify(value).replace(
    HTML_ESCAPE_PATTERN,
    (character) => HTML_ESCAPES[character] ?? character,
  );
}
