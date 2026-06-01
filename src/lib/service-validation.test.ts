import { describe, expect, it } from "vitest";

import { getZodFieldErrors } from "./form-validation";
import {
  getServiceRequestTriageFacts,
  getServiceRequestAttachmentPolicy,
  maxServiceRequestFileBytes,
  maxServiceRequestFiles,
  publicServiceRequestInputSchema,
  serviceRequestAcceptedFileTypeLabel,
  serviceRequestAcceptedFileTypes,
  updateServiceSettingsInputSchema,
  upsertContactTopicInputSchema,
} from "./service-validation";

describe("service validation", () => {
  it("normalizes public service request contact data", () => {
    const parsed = publicServiceRequestInputSchema.parse({
      topicSlug: " repair ",
      name: "  Dana Twito  ",
      phone: " 054-727-7455 ",
      email: " DANA@EXAMPLE.COM ",
      orderNumber: "",
      productReference: "  /product/ring  ",
      preferredContact: "PHONE",
      preferredContactTime: "",
      message: "  Need repair details  ",
    });

    expect(parsed).toMatchObject({
      topicSlug: "repair",
      name: "Dana Twito",
      phone: "054-727-7455",
      email: "dana@example.com",
      productReference: "/product/ring",
      preferredContact: "PHONE",
      message: "Need repair details",
    });
    expect(parsed.orderNumber).toBeUndefined();
    expect(parsed.preferredContactTime).toBeUndefined();
  });

  it("rejects incomplete public service requests", () => {
    const parsed = publicServiceRequestInputSchema.safeParse({
      topicSlug: "",
      name: "",
      phone: "123",
      email: "not-an-email",
      message: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = getZodFieldErrors(parsed.error);

      expect(typeof errors.topicSlug).toBe("string");
      expect(typeof errors.name).toBe("string");
      expect(typeof errors.phone).toBe("string");
      expect(typeof errors.email).toBe("string");
      expect(typeof errors.message).toBe("string");
    }
  });

  it("keeps service contact defaults editable but validated", () => {
    const parsed = updateServiceSettingsInputSchema.parse({
      phoneE164: "+972547277455",
      displayPhone: "054-727-7455",
      serviceEmail: "3TWITO@GMAIL.COM",
      physicalBranchesEnabled: false,
    });

    expect(parsed).toEqual({
      phoneE164: "+972547277455",
      displayPhone: "054-727-7455",
      serviceEmail: "3twito@gmail.com",
      physicalBranchesEnabled: false,
    });
  });

  it("validates contact topic slugs and optional recipient emails", () => {
    expect(
      upsertContactTopicInputSchema.parse({
        slug: "repair-status",
        label: "Repair",
        description: "",
        recipientEmail: "",
        isActive: true,
        sortOrder: 20,
      }),
    ).toMatchObject({
      slug: "repair-status",
      recipientEmail: undefined,
    });

    expect(
      upsertContactTopicInputSchema.safeParse({
        slug: "Repair Status",
        label: "Repair",
        recipientEmail: "ops@example.com",
        isActive: true,
        sortOrder: 20,
      }).success,
    ).toBe(false);
  });

  it("documents supported service attachment limits", () => {
    expect(maxServiceRequestFiles).toBe(5);
    expect(maxServiceRequestFileBytes).toBe(10 * 1024 * 1024);
    expect(serviceRequestAcceptedFileTypeLabel).toBe(
      "JPG, PNG, WebP, GIF או PDF",
    );
    expect(serviceRequestAcceptedFileTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ]);
    expect(getServiceRequestAttachmentPolicy()).toEqual({
      acceptedFileTypeLabel: "JPG, PNG, WebP, GIF או PDF",
      acceptedFileTypes: serviceRequestAcceptedFileTypes,
      maxFileBytes: 10 * 1024 * 1024,
      maxFileSizeMb: 10,
      maxFiles: 5,
    });
  });

  it("summarizes admin triage facts without opening the full request", () => {
    expect(
      getServiceRequestTriageFacts({
        attachmentCount: 2,
        orderNumber: "EL-1001",
        preferredContact: "WHATSAPP",
        productReference: "/product/venus-line-ring",
      }),
    ).toEqual([
      { key: "attachment", label: "2 קבצים", tone: "warning" },
      { key: "product", label: "יש מוצר", tone: "neutral" },
      { key: "order", label: "יש הזמנה", tone: "neutral" },
      { key: "contact", label: "חזרה: וואטסאפ", tone: "warning" },
    ]);
  });
});
