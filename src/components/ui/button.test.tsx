import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("defaults native buttons to type button", () => {
    expect(renderToStaticMarkup(<Button>Action</Button>)).toContain(
      'type="button"',
    );
  });

  it("preserves explicit submit buttons", () => {
    expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain(
      'type="submit"',
    );
  });

  it("does not add a button type to asChild links", () => {
    const markup = renderToStaticMarkup(
      <Button asChild>
        <a href="/search">Search</a>
      </Button>,
    );

    expect(markup).toContain("<a ");
    expect(markup).not.toContain("type=");
  });
});
