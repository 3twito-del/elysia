import { describe, expect, it } from "vitest";

import {
  ADMIN_LOGIN_TICKET_TTL_MS,
  mintAdminLoginTicket,
  verifyAdminLoginTicket,
} from "./admin-mfa-ticket";

const NOW = 1_700_000_000_000;
const MFA_VERIFIED_TTL_MS = ADMIN_LOGIN_TICKET_TTL_MS.mfa_verified;

describe("admin login ticket", () => {
  it("round-trips a freshly minted password_verified ticket", () => {
    const ticket = mintAdminLoginTicket({
      adminUserId: "admin_1",
      now: NOW,
      stage: "password_verified",
    });

    const payload = verifyAdminLoginTicket(ticket, { now: NOW });

    expect(payload).toEqual({
      adminUserId: "admin_1",
      expiresAt: NOW + 10 * 60_000,
      stage: "password_verified",
    });
  });

  it("rejects a ticket after it expires", () => {
    const ticket = mintAdminLoginTicket({
      adminUserId: "admin_1",
      now: NOW,
      stage: "mfa_verified",
    });

    expect(
      verifyAdminLoginTicket(ticket, { now: NOW + MFA_VERIFIED_TTL_MS }),
    ).toBeNull();
  });

  it("accepts a ticket right up to its expiry boundary", () => {
    const ticket = mintAdminLoginTicket({
      adminUserId: "admin_1",
      now: NOW,
      stage: "mfa_verified",
    });

    expect(
      verifyAdminLoginTicket(ticket, { now: NOW + MFA_VERIFIED_TTL_MS - 1_000 }),
    ).not.toBeNull();
  });

  it("rejects a stage mismatch", () => {
    const ticket = mintAdminLoginTicket({
      adminUserId: "admin_1",
      now: NOW,
      stage: "password_verified",
    });

    expect(
      verifyAdminLoginTicket(ticket, {
        expectedStage: "mfa_verified",
        now: NOW,
      }),
    ).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const ticket = mintAdminLoginTicket({
      adminUserId: "admin_1",
      now: NOW,
      stage: "password_verified",
    });
    const [payload, signature] = ticket.split(".");
    const tamperedSignature = signature!
      .split("")
      .reverse()
      .join("");

    expect(
      verifyAdminLoginTicket(`${payload}.${tamperedSignature}`, { now: NOW }),
    ).toBeNull();
  });

  it("rejects a tampered payload (adminUserId swapped)", () => {
    const ticket = mintAdminLoginTicket({
      adminUserId: "admin_1",
      now: NOW,
      stage: "password_verified",
    });
    const otherTicket = mintAdminLoginTicket({
      adminUserId: "admin_2",
      now: NOW,
      stage: "password_verified",
    });
    const [, signature] = ticket.split(".");
    const [otherPayload] = otherTicket.split(".");

    expect(
      verifyAdminLoginTicket(`${otherPayload}.${signature}`, { now: NOW }),
    ).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(verifyAdminLoginTicket(null)).toBeNull();
    expect(verifyAdminLoginTicket("")).toBeNull();
    expect(verifyAdminLoginTicket("garbage")).toBeNull();
    expect(verifyAdminLoginTicket("no-dot-here")).toBeNull();
  });
});
