-- CreateEnum
CREATE TYPE "BranchKind" AS ENUM ('ONLINE', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('NEW', 'IN_REVIEW', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ServiceContactPreference" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'ANY');

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "kind" "BranchKind" NOT NULL DEFAULT 'PHYSICAL',
ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ServiceSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "phoneE164" TEXT NOT NULL DEFAULT '+972547277455',
    "displayPhone" TEXT NOT NULL DEFAULT '054-727-7455',
    "serviceEmail" TEXT NOT NULL DEFAULT '3twito@gmail.com',
    "physicalBranchesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactTopic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "recipientEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orderNumber" TEXT,
    "productReference" TEXT,
    "preferredContact" "ServiceContactPreference" NOT NULL DEFAULT 'ANY',
    "preferredContactTime" TEXT,
    "message" TEXT NOT NULL,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequestAttachment" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_kind_isApproved_isPublic_isActive_sortOrder_idx" ON "Branch"("kind", "isApproved", "isPublic", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ContactTopic_slug_key" ON "ContactTopic"("slug");

-- CreateIndex
CREATE INDEX "ContactTopic_isActive_sortOrder_idx" ON "ContactTopic"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_createdAt_idx" ON "ServiceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_topicId_idx" ON "ServiceRequest"("topicId");

-- CreateIndex
CREATE INDEX "ServiceRequest_email_idx" ON "ServiceRequest"("email");

-- CreateIndex
CREATE INDEX "ServiceRequest_phone_idx" ON "ServiceRequest"("phone");

-- CreateIndex
CREATE INDEX "ServiceRequestAttachment_serviceRequestId_idx" ON "ServiceRequestAttachment"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ContactTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestAttachment" ADD CONSTRAINT "ServiceRequestAttachment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default service settings and topics.
INSERT INTO "ServiceSettings" ("id", "phoneE164", "displayPhone", "serviceEmail", "physicalBranchesEnabled", "createdAt", "updatedAt")
VALUES ('default', '+972547277455', '054-727-7455', '3twito@gmail.com', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "ContactTopic" ("id", "slug", "label", "description", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('topic_general', 'general', 'פנייה כללית', 'שאלה או בקשה שאינה משויכת לנושא אחר.', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topic_order', 'order', 'הזמנה קיימת', 'בירור, עדכון או שאלה לגבי הזמנה.', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topic_repair', 'repair', 'תיקון', 'בקשה לבדיקת תיקון, אחריות או טיפול בתכשיט.', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topic_returns', 'returns', 'החלפה או החזרה', 'בקשה להחלפה, החזרה או זיכוי.', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topic_sizing', 'sizing', 'מידה והתאמה', 'ייעוץ מידה, התאמה או בחירת מתנה.', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topic_accessibility_privacy', 'accessibility-privacy', 'נגישות ופרטיות', 'פנייה בנושא נגישות, פרטיות או מידע אישי.', 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topic_partnership', 'partnership', 'שיתוף פעולה', 'פנייה עסקית, תוכן או שיתוף פעולה.', 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Branch" ("id", "slug", "name", "address", "city", "phone", "whatsapp", "openingHours", "services", "kind", "isApproved", "isPublic", "isActive", "sortOrder")
VALUES (
  'branch_online_service',
  'online-service',
  'שירות אונליין',
  'Online',
  'Online',
  '054-727-7455',
  '972547277455',
  '{"online":"Sun-Thu 10:00-18:00"}',
  ARRAY['Online service', 'Phone support', 'Repairs coordination'],
  'ONLINE',
  true,
  false,
  true,
  0
)
ON CONFLICT ("slug") DO UPDATE SET
  "kind" = 'ONLINE',
  "isApproved" = true,
  "isPublic" = false,
  "isActive" = true,
  "phone" = '054-727-7455',
  "whatsapp" = '972547277455';
