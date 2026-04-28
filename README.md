# Aphrodite

אתר איקומרס בעברית לרשת תכשיטים, מבוסס Next.js App Router, tRPC,
Prisma/Postgres, אדמין פנימי, הזמנות ידניות, שמירת מלאי זמנית ואינטגרציות
מדורגות לספקים חיצוניים.

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:migrate:dev
pnpm db:seed
pnpm dev
```

לפני `pnpm db:seed` חובה למלא ב־`.env`:

```env
ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
ADMIN_BOOTSTRAP_PASSWORD="strong-password-at-least-12"
ADMIN_BOOTSTRAP_NAME="Aphrodite Admin"
```

## No-Card Soft Launch

המינימום התפעולי להפעלה ללא עלות וללא כרטיס אשראי:

- Neon Free כ־Postgres מנוהל.
- Brevo Free לאימיילים טרנזקציוניים.
- Vercel Hobby רק ל־staging/soft launch לא מסחרי; הפעלה מסחרית מלאה דורשת
  בדיקת תנאי שימוש ושדרוג מתאים.

משתני סביבה נדרשים:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate-a-long-random-secret"
ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
ADMIN_BOOTSTRAP_PASSWORD="strong-password-at-least-12"
ADMIN_BOOTSTRAP_NAME="Aphrodite Admin"
BREVO_API_KEY="xkeysib-..."
STORE_FROM_EMAIL="orders@example.com"
STORE_FROM_NAME="Aphrodite"
OPERATIONS_EMAIL="studio@example.com"
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
```

לאחר הגדרת env:

```bash
pnpm exec prisma generate
pnpm db:migrate:dev
pnpm db:seed
pnpm build
```

## Operational Flow

- לקוח שולח בקשת הזמנה דרך `/checkout`.
- המערכת יוצרת `Order`, `Payment` ידני, `InventoryReservation` ו־
  `InventoryLedger`.
- המלאי נשמר ל־24 שעות.
- נשלח אימייל אישור ללקוח ואימייל תפעולי ל־`OPERATIONS_EMAIL`.
- כשל אימייל לא מבטל הזמנה; הוא נרשם ב־`IntegrationJob`.
- אדמין נכנס דרך `/admin/login`, משנה סטטוס ומייצר `AuditLog`.

## Verification

```bash
pnpm format:write
pnpm check
pnpm build
pnpm audit --prod
```
