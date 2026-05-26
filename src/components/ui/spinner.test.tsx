import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("is announced when rendered as a standalone status indicator", () => {
    const markup = renderToStaticMarkup(<Spinner />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="בהמתנה"');
  });

  it("does not keep an accessible label when rendered decoratively", () => {
    const markup = renderToStaticMarkup(
      <Spinner aria-hidden="true" role="presentation" />,
    );

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('role="presentation"');
    expect(markup).not.toContain("aria-label=");
  });
});
