import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StatusMessage } from "./status-message";

describe("StatusMessage", () => {
  it("announces non-error feedback politely", () => {
    const markup = renderToStaticMarkup(
      <StatusMessage tone="success">Saved</StatusMessage>,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
  });

  it("announces error feedback assertively", () => {
    const markup = renderToStaticMarkup(
      <StatusMessage tone="error">Failed</StatusMessage>,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain('aria-atomic="true"');
  });
});
