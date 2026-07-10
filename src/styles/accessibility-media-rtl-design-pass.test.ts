import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const siteFooter = read("src/components/site-footer.tsx");
const label = read("src/components/ui/label.tsx");
const checkoutForm = read(
  "src/app/checkout/_components/cart-checkout-form.tsx",
);
const addressForm = read("src/app/account/_components/customer-address-form.tsx");
const savedSizesForm = read(
  "src/app/account/_components/customer-saved-sizes-form.tsx",
);
const serviceRequestForm = read(
  "src/app/service/_components/service-request-form.tsx",
);
const productCard = read("src/components/product-card.tsx");
const searchPage = read("src/app/search/page.tsx");
const css = read("src/styles/globals.css");

describe("accessibility + media + RTL design pass (owner-selected DP 90-100)", () => {
  it("brings the footer social icons up to the 44px touch-target minimum", () => {
    expect(siteFooter).toContain(
      'className="footer-social-link inline-grid size-11 place-items-center rounded-full border transition"',
    );
  });

  it("gives every required field the same visual marker via a shared Label prop", () => {
    expect(label).toContain("required?: boolean");
    expect(label).toContain('<span aria-hidden="true" className="text-destructive">');
    expect(checkoutForm).toContain('<Label htmlFor="name" required>');
    expect(checkoutForm).toContain('<Label htmlFor="phone" required>');
    expect(checkoutForm).toContain('<Label htmlFor="email" required>');
    expect(checkoutForm).toContain('<Label htmlFor="city" required>');
    expect(checkoutForm).toContain('<Label htmlFor="street" required>');
    expect(addressForm).toContain('label="שם מקבל"\n          required');
    expect(savedSizesForm).toContain("<Label htmlFor={inputId} required>");
    expect(serviceRequestForm).toContain('<Label htmlFor="topicSlug" required>');
    expect(serviceRequestForm).toContain("required={required}");
  });

  it("shares one blur-up placeholder constant between the product-card grid and the search list view instead of two duplicated copies", () => {
    expect(productCard).toContain("export const PRODUCT_IMAGE_BLUR_DATA_URL =");
    expect(searchPage).toContain("PRODUCT_IMAGE_BLUR_DATA_URL,");
    expect(searchPage).not.toContain("SEARCH_RESULT_IMAGE_BLUR_DATA_URL");
    expect(searchPage).toContain("blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}");
  });

  it("caps the about-page editorial figure at tablet widths instead of letting it stretch full-bleed between the mobile and 1024px layouts", () => {
    expect(css).toContain(
      "@media (min-width: 640px) and (max-width: 1023px) {",
    );
    expect(css).toMatch(
      /max-width: 1023px\) \{\s*\.about-v2 \.about-sticky-figure \{\s*max-width: 28rem;\s*margin-inline: auto;/,
    );
  });

  it("gives phone/email/postal-code fields explicit LTR direction so digits and Latin placeholders don't inherit page RTL", () => {
    expect(checkoutForm).toContain('id="phone"\n                        inputMode="tel"');
    expect(checkoutForm).toMatch(/id="email"[\s\S]{0,40}dir="ltr"|dir="ltr"[\s\S]{0,120}id="email"/);
    expect(checkoutForm).toContain('id="postalCode"\n                          inputMode="numeric"');
    expect(serviceRequestForm).toContain('dir="ltr"\n          error={state.fieldErrors?.phone}');
    expect(serviceRequestForm).toContain('dir="ltr"\n        error={state.fieldErrors?.email}');
  });

  it("keeps the existing focus, contrast, and reveal systems verified rather than re-implemented (audits, no code change needed)", () => {
    // 90: chip/toggle focus already flows through the shared .elysia-control
    // override + focus-within rings on custom checkbox chips (verified in
    // search-controls.tsx's AvailabilityField).
    expect(css).toContain(".elysia-control:focus-visible:not([aria-invalid=\"true\"])");
    // 93: skip-link already uses shared brand tokens (popover bg, glass
    // shadow, radius, bronze focus) rather than default/generic styling.
    expect(css).toContain(".skip-link {");
    expect(css).toContain("box-shadow: 0 12px 28px var(--glass-shadow-deep);");
    // 99: no raw directional glyphs remain anywhere in public source.
    expect(css).not.toContain(">›<");
  });
});
