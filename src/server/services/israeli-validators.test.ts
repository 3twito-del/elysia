import { describe, expect, it } from "vitest";

import {
  isValidCompanyId,
  isValidEmail,
  isValidIban,
  isValidIsraeliIban,
  isValidIsraeliId,
  isValidIsraeliPhone,
} from "./israeli-validators";

describe("isValidIsraeliId", () => {
  it("accepts a valid check digit and pads short numbers", () => {
    expect(isValidIsraeliId("123456782")).toBe(true);
    expect(isValidIsraeliId("3033213")).toBe(isValidIsraeliId("03033213"));
  });

  it("rejects a wrong check digit or over-length", () => {
    expect(isValidIsraeliId("123456789")).toBe(false);
    expect(isValidIsraeliId("1234567890")).toBe(false);
    expect(isValidIsraeliId("")).toBe(false);
  });

  it("company/dealer numbers use the same algorithm", () => {
    expect(isValidCompanyId("123456782")).toBe(true);
  });
});

describe("isValidIban", () => {
  it("accepts valid IBANs via mod-97", () => {
    expect(isValidIban("DE89370400440532013000")).toBe(true);
    expect(isValidIsraeliIban("IL620108000000099999999")).toBe(true);
  });

  it("rejects a corrupted IBAN or wrong length", () => {
    expect(isValidIban("DE89370400440532013001")).toBe(false);
    expect(isValidIsraeliIban("IL62010800000009999999")).toBe(false); // 22 chars
    expect(isValidIban("not-an-iban")).toBe(false);
  });
});

describe("isValidIsraeliPhone", () => {
  it("accepts landline, mobile and +972 forms", () => {
    expect(isValidIsraeliPhone("02-1234567")).toBe(true);
    expect(isValidIsraeliPhone("050-1234567")).toBe(true);
    expect(isValidIsraeliPhone("+972-50-123-4567")).toBe(true);
  });

  it("rejects malformed numbers", () => {
    expect(isValidIsraeliPhone("12345")).toBe(false);
    expect(isValidIsraeliPhone("050-12345")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts and rejects by basic shape", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("bad@ nospace.com")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
  });
});
