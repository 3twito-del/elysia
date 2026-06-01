import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  getServiceRequestTriageFacts,
  maxServiceRequestFileBytes,
  maxServiceRequestFiles,
  publicServiceRequestInputSchema,
  serviceRequestAcceptedFileTypes,
  updateServiceRequestInputSchema,
  updateServiceSettingsInputSchema,
  upsertContactTopicInputSchema,
  upsertServiceBranchInputSchema,
} from "~/lib/service-validation";
import { db } from "~/server/db";
import { mediaProvider } from "~/server/adapters/media";
import {
  shouldFallbackToCatalogFixturesOnDatabaseError,
  shouldUseCatalogFixtures,
} from "~/server/services/catalog-fixtures";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";

const defaultServiceSettings = {
  id: "default",
  phoneE164: "+972547277455",
  displayPhone: "054-727-7455",
  serviceEmail: "3twito@gmail.com",
  physicalBranchesEnabled: false,
};

export const defaultContactTopics = [
  {
    id: "topic_general",
    slug: "general",
    label: "פנייה כללית",
    description: "שאלה או בקשה שאינה משויכת לנושא אחר.",
    sortOrder: 10,
  },
  {
    id: "topic_order",
    slug: "order",
    label: "הזמנה קיימת",
    description: "בירור, עדכון או שאלה לגבי הזמנה.",
    sortOrder: 20,
  },
  {
    id: "topic_repair",
    slug: "repair",
    label: "תיקון",
    description: "בקשה לבדיקת תיקון, אחריות או טיפול בתכשיט.",
    sortOrder: 30,
  },
  {
    id: "topic_returns",
    slug: "returns",
    label: "החלפה או החזרה",
    description: "בקשה להחלפה, החזרה או זיכוי.",
    sortOrder: 40,
  },
  {
    id: "topic_sizing",
    slug: "sizing",
    label: "מידות",
    description: "ייעוץ מידה, התאמה או בחירת מתנה.",
    sortOrder: 50,
  },
  {
    id: "topic_accessibility_privacy",
    slug: "accessibility-privacy",
    label: "נגישות ופרטיות",
    description: "פנייה בנושא נגישות, פרטיות או מידע אישי.",
    sortOrder: 60,
  },
  {
    id: "topic_partnership",
    slug: "partnership",
    label: "שיתוף פעולה",
    description: "פנייה לבית Elysia, תוכן או שיתוף פעולה.",
    sortOrder: 70,
  },
];

const serviceRequestListInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  query: z.string().trim().max(160).optional(),
  status: z
    .enum(["NEW", "IN_REVIEW", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"])
    .optional(),
  topicId: z.string().trim().min(1).optional(),
});

type TransactionClient = Prisma.TransactionClient;

export type PublicServiceProfile = Awaited<
  ReturnType<typeof getPublicServiceProfile>
>;

export type ServiceRequestListInput = z.infer<
  typeof serviceRequestListInputSchema
>;

export { serviceRequestListInputSchema };

export async function getServiceSettings() {
  return readPublicServiceData({
    label: "settings",
    fallback: () => defaultServiceSettings,
    database: async () => {
      const settings = await db.serviceSettings.findUnique({
        where: { id: defaultServiceSettings.id },
      });

      return settings ?? defaultServiceSettings;
    },
  });
}

export async function getPublicContactSettings() {
  const settings = await getServiceSettings();

  return {
    email: settings.serviceEmail,
    phoneDisplay: settings.displayPhone,
    phoneHref: `tel:${settings.phoneE164}`,
    phoneE164: settings.phoneE164,
  };
}

export async function getActiveContactTopics() {
  return readPublicServiceData({
    label: "contact-topics",
    fallback: () => defaultContactTopics,
    database: async () => {
      const topics = await db.contactTopic.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      });

      return topics.length > 0 ? topics : defaultContactTopics;
    },
  });
}

export async function getPublicPhysicalBranches() {
  return readPublicServiceData({
    label: "branches",
    fallback: () => [],
    database: async () => {
      const settings = await getServiceSettings();

      if (!settings.physicalBranchesEnabled) return [];

      return db.branch.findMany({
        where: {
          kind: "PHYSICAL",
          isActive: true,
          isApproved: true,
          isPublic: true,
        },
        orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }],
      });
    },
  });
}

export async function getPublicServiceProfile() {
  const [settings, topics, branches] = await Promise.all([
    getServiceSettings(),
    getActiveContactTopics(),
    getPublicPhysicalBranches(),
  ]);

  return { settings, topics, branches };
}

export async function createPublicServiceRequest(input: {
  data: z.infer<typeof publicServiceRequestInputSchema>;
  files: File[];
}) {
  const parsed = publicServiceRequestInputSchema.parse(input.data);
  const files = getValidatedServiceRequestFiles(input.files);
  const [settings, topic] = await Promise.all([
    getServiceSettings(),
    db.contactTopic.findUnique({ where: { slug: parsed.topicSlug } }),
  ]);
  const uploads = await Promise.all(
    files.map((file) =>
      mediaProvider.uploadServiceAttachment({
        bytes: file.size,
        contentType: file.type,
        file,
        originalFilename: file.name,
      }),
    ),
  );
  const request = await db.$transaction(async (tx) => {
    const created = await tx.serviceRequest.create({
      data: {
        topicId: topic?.id,
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email,
        orderNumber: parsed.orderNumber,
        productReference: parsed.productReference,
        preferredContact: parsed.preferredContact,
        preferredContactTime: parsed.preferredContactTime,
        message: parsed.message,
        attachments: {
          create: uploads.map((upload) => ({
            provider: upload.provider,
            publicId: upload.publicId,
            secureUrl: upload.secureUrl,
            originalFilename: upload.originalFilename,
            contentType: upload.contentType,
            bytes: upload.bytes,
            width: upload.width,
            height: upload.height,
          })),
        },
      },
      include: { attachments: true, topic: true },
    });

    await writeServiceAudit(tx, {
      action: "service_request_created",
      entity: "ServiceRequest",
      entityId: created.id,
      metadata: {
        attachmentCount: uploads.length,
        preferredContact: parsed.preferredContact,
        topicSlug: parsed.topicSlug,
      },
    });

    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.emailRequested,
      aggregateType: "ServiceRequest",
      aggregateId: created.id,
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:service-request:${created.id}`,
      payload: {
        recipientEmail: topic?.recipientEmail ?? settings.serviceEmail,
        subject: `Elysia service request: ${topic?.label ?? parsed.topicSlug}`,
        body: createServiceRequestEmailBody({
          attachmentCount: uploads.length,
          email: parsed.email,
          message: parsed.message,
          name: parsed.name,
          orderNumber: parsed.orderNumber,
          phone: parsed.phone,
          preferredContact: parsed.preferredContact,
          preferredContactTime: parsed.preferredContactTime,
          productReference: parsed.productReference,
          requestId: created.id,
          topicLabel: topic?.label ?? parsed.topicSlug,
        }),
        template: "service_request_created",
      },
    });

    return created;
  });

  return request;
}

export async function listAdminServiceRequests(input: ServiceRequestListInput) {
  const parsed = serviceRequestListInputSchema.parse(input);
  const where: Prisma.ServiceRequestWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.topicId ? { topicId: parsed.topicId } : {}),
    ...(parsed.query
      ? {
          OR: [
            { name: { contains: parsed.query, mode: "insensitive" } },
            { email: { contains: parsed.query, mode: "insensitive" } },
            { phone: { contains: parsed.query, mode: "insensitive" } },
            { orderNumber: { contains: parsed.query, mode: "insensitive" } },
            {
              productReference: {
                contains: parsed.query,
                mode: "insensitive",
              },
            },
            { message: { contains: parsed.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [totalItems, requests, topics] = await Promise.all([
    db.serviceRequest.count({ where }),
    db.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: { attachments: true, topic: true },
    }),
    db.contactTopic.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
  ]);

  return {
    items: requests.map((request) => ({
      id: request.id,
      topicId: request.topicId,
      topicLabel: request.topic?.label ?? "ללא נושא",
      status: request.status,
      name: request.name,
      phone: request.phone,
      email: request.email,
      orderNumber: request.orderNumber,
      productReference: request.productReference,
      preferredContact: request.preferredContact,
      preferredContactTime: request.preferredContactTime,
      message: request.message,
      adminNotes: request.adminNotes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      triageFacts: getServiceRequestTriageFacts({
        attachmentCount: request.attachments.length,
        orderNumber: request.orderNumber,
        preferredContact: request.preferredContact,
        productReference: request.productReference,
      }),
      attachments: request.attachments.map((attachment) => ({
        id: attachment.id,
        provider: attachment.provider,
        filename: attachment.originalFilename,
        contentType: attachment.contentType,
        bytes: attachment.bytes,
        url: attachment.secureUrl,
      })),
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
    topics,
  };
}

export async function getAdminServiceConfiguration() {
  const [settings, topics, branches] = await Promise.all([
    getServiceSettings(),
    db.contactTopic.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    db.branch.findMany({
      where: { kind: "PHYSICAL" },
      orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }],
    }),
  ]);

  return { settings, topics, branches };
}

export async function updateAdminServiceRequest(input: {
  adminUserId: string;
  data: z.infer<typeof updateServiceRequestInputSchema>;
}) {
  const parsed = updateServiceRequestInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const updated = await tx.serviceRequest.update({
      where: { id: parsed.serviceRequestId },
      data: {
        status: parsed.status,
        adminNotes: parsed.adminNotes,
      },
    });

    await writeServiceAudit(tx, {
      adminUserId: input.adminUserId,
      action: "service_request_updated",
      entity: "ServiceRequest",
      entityId: updated.id,
      metadata: {
        status: updated.status,
        hasAdminNotes: Boolean(parsed.adminNotes),
      },
    });

    return { id: updated.id, status: updated.status };
  });
}

export async function updateAdminServiceSettings(input: {
  adminUserId: string;
  data: z.infer<typeof updateServiceSettingsInputSchema>;
}) {
  const parsed = updateServiceSettingsInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const settings = await tx.serviceSettings.upsert({
      where: { id: defaultServiceSettings.id },
      update: parsed,
      create: {
        id: defaultServiceSettings.id,
        ...parsed,
      },
    });

    await writeServiceAudit(tx, {
      adminUserId: input.adminUserId,
      action: "service_settings_updated",
      entity: "ServiceSettings",
      entityId: settings.id,
      metadata: {
        physicalBranchesEnabled: settings.physicalBranchesEnabled,
        serviceEmail: settings.serviceEmail,
      },
    });

    return settings;
  });
}

export async function upsertAdminContactTopic(input: {
  adminUserId: string;
  data: z.infer<typeof upsertContactTopicInputSchema>;
}) {
  const parsed = upsertContactTopicInputSchema.parse(input.data);

  return db.$transaction(async (tx) => {
    const topic = parsed.id
      ? await tx.contactTopic.update({
          where: { id: parsed.id },
          data: {
            slug: parsed.slug,
            label: parsed.label,
            description: parsed.description,
            recipientEmail: parsed.recipientEmail,
            isActive: parsed.isActive,
            sortOrder: parsed.sortOrder,
          },
        })
      : await tx.contactTopic.create({
          data: {
            slug: parsed.slug,
            label: parsed.label,
            description: parsed.description,
            recipientEmail: parsed.recipientEmail,
            isActive: parsed.isActive,
            sortOrder: parsed.sortOrder,
          },
        });

    await writeServiceAudit(tx, {
      adminUserId: input.adminUserId,
      action: "contact_topic_upserted",
      entity: "ContactTopic",
      entityId: topic.id,
      metadata: { slug: topic.slug, isActive: topic.isActive },
    });

    return topic;
  });
}

export async function upsertAdminServiceBranch(input: {
  adminUserId: string;
  data: z.infer<typeof upsertServiceBranchInputSchema>;
}) {
  const parsed = upsertServiceBranchInputSchema.parse(input.data);
  const services = parseList(parsed.servicesText);
  const openingHours = { note: parsed.openingHoursText };
  const data = {
    slug: parsed.slug,
    name: parsed.name,
    address: parsed.address,
    city: parsed.city,
    phone: parsed.phone,
    whatsapp: parsed.whatsapp,
    openingHours,
    services,
    kind: "PHYSICAL" as const,
    isApproved: parsed.isApproved,
    isPublic: parsed.isPublic,
    isActive: parsed.isActive,
    sortOrder: parsed.sortOrder,
  };

  return db.$transaction(async (tx) => {
    const branch = parsed.id
      ? await tx.branch.update({
          where: { id: parsed.id },
          data,
        })
      : await tx.branch.create({ data });

    await writeServiceAudit(tx, {
      adminUserId: input.adminUserId,
      action: "service_branch_upserted",
      entity: "Branch",
      entityId: branch.id,
      metadata: {
        isApproved: branch.isApproved,
        isPublic: branch.isPublic,
        slug: branch.slug,
      },
    });

    return branch;
  });
}

export function shouldShowPhysicalBranches(input: {
  physicalBranchesEnabled: boolean;
}) {
  return input.physicalBranchesEnabled;
}

const publicServiceFallbackWarningKeys = new Set<string>();

async function readPublicServiceData<T>({
  database,
  fallback,
  label,
}: {
  database: () => Promise<T>;
  fallback: () => Promise<T> | T;
  label: string;
}) {
  if (shouldUseCatalogFixtures()) {
    return fallback();
  }

  try {
    return await database();
  } catch (error) {
    if (
      !shouldFallbackToCatalogFixturesOnDatabaseError() ||
      !isPublicServiceDatabaseReadError(error)
    ) {
      throw error;
    }

    warnPublicServiceFallback(label, error);

    return fallback();
  }
}

function isPublicServiceDatabaseReadError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message = getPublicServiceErrorMessage(error);

  return (
    (typeof code === "string" &&
      ["P1000", "P1001", "P1002", "P1008", "P1017", "P2024"].includes(code)) ||
    /Can't reach database server|Authentication failed|Timed out fetching a new connection|Unable to start a transaction|Connection pool timeout|DATABASE_URL is required/i.test(
      message,
    )
  );
}

function getPublicServiceErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function warnPublicServiceFallback(label: string, error: unknown) {
  if (publicServiceFallbackWarningKeys.has(label)) return;

  publicServiceFallbackWarningKeys.add(label);
  console.warn(
    `[service] Falling back to default public ${label} after database read failed: ${getPublicServiceErrorMessage(
      error,
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240)}`,
  );
}

function getValidatedServiceRequestFiles(files: File[]) {
  const presentFiles = files.filter((file) => file.size > 0 && file.name);

  if (presentFiles.length > maxServiceRequestFiles) {
    throw new Error(`ניתן לצרף עד ${maxServiceRequestFiles} קבצים.`);
  }

  for (const file of presentFiles) {
    if (
      !serviceRequestAcceptedFileTypes.includes(
        file.type as (typeof serviceRequestAcceptedFileTypes)[number],
      )
    ) {
      throw new Error("ניתן לצרף קבצים מצורפים בלבד.");
    }

    if (file.size > maxServiceRequestFileBytes) {
      throw new Error("קובץ מצורף גדול מדי. הגודל המרבי הוא 10MB.");
    }
  }

  return presentFiles;
}

function createServiceRequestEmailBody(input: {
  attachmentCount: number;
  email: string;
  message: string;
  name: string;
  orderNumber?: string;
  phone: string;
  preferredContact: string;
  preferredContactTime?: string;
  productReference?: string;
  requestId: string;
  topicLabel: string;
}) {
  return [
    "Elysia service request",
    `Request ID: ${input.requestId}`,
    `Topic: ${input.topicLabel}`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
    `Email: ${input.email}`,
    input.orderNumber ? `Order: ${input.orderNumber}` : null,
    input.productReference ? `Product: ${input.productReference}` : null,
    `Preferred contact: ${input.preferredContact}`,
    input.preferredContactTime
      ? `Preferred time: ${input.preferredContactTime}`
      : null,
    `Attachments: ${input.attachmentCount}`,
    "",
    input.message,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function parseList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function writeServiceAudit(
  tx: TransactionClient,
  input: {
    action: string;
    adminUserId?: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

function createAdminPageInfo(input: {
  page: number;
  pageSize: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(input.totalItems / input.pageSize));
  const page = Math.min(input.page, totalPages);

  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize: input.pageSize,
    totalItems: input.totalItems,
    totalPages,
  };
}

function getAdminSkip(input: { page: number; pageSize: number }) {
  return (input.page - 1) * input.pageSize;
}
