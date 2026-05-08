import { describe, expect, it } from "vitest";

import { stringifyJsonLd } from "./json-ld";

describe("stringifyJsonLd", () => {
  it("escapes characters that can break out of a script tag", () => {
    expect(
      stringifyJsonLd({ name: "</script><script>alert(1)</script>" }),
    ).toBe(
      '{"name":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"}',
    );
  });
});
