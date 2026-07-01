# מסמך-אב מחייב — חבילת ERP/CRM ארגונית (Elysia Enterprise Suite)

> **סטטוס:** טיוטה לסקירה (v0.2) · **תאריך:** 2026-06-24 · **בעלות:** הנהלת Elysia + צוות הנדסה
> **ייעוד:** מערכת פנימית בלבד (single-tenant) ברמה ארגונית מקסימלית — "לפחות SAP, ומעבר לכך".
> **שפה:** עברית; מונחים טכניים, שמות מודולים, שדות ו-APIs באנגלית.

---

## 0. איך קוראים את המסמך הזה

מסמך זה הוא **מפרט מחייב (binding spec)**, לא מסמך שיווקי. כל דרישה ממוספרת ובת-בדיקה.

**מילות חיוב (לפי RFC 2119, בעברית):**

| מילה | משמעות | מזהה |
|---|---|---|
| **חובה** (MUST) | דרישה מחייבת. אי-עמידה = המערכת אינה תואמת. | `[M]` |
| **רצוי** (SHOULD) | מומלץ מאוד; סטייה מחייבת נימוק מתועד. | `[S]` |
| **אפשר** (MAY) | רשות; נחמד-שיהיה. | `[O]` |

**מזהי דרישות:** `<MODULE>-<AREA>-<NNN>` (לדוגמה `FIN-GL-001`). מזהים יציבים — לא ממחזרים מספרים גם אם דרישה נמחקת.

**איך לעבור על המסמך:** עבור סעיף-סעיף. לכל דרישה החלט: ✅ מאשר · ✏️ מתקן (כתוב בשוליים) · ❌ מחוץ להיקף · ❓ להחלטה. הסעיפים המסומנים **🔧 פער קיים** ממופים לקוד הנוכחי בסעיף 12.

**מה כן בהיקף:** מערכת אחת מאוחדת המכסה Commerce + CRM + ERP מלא (פיננסי כפול, רכש, מלאי/מחסן, הזמנות, ייצור, נכסים, HR), אנליטיקה ושכבת AI — **וכן פלטפורמת תפעול מלאה** (POS, תקשורת/טלפוניה, מסמכים+חתימה, workflow/no-code, שיווק דיגיטלי, לוגיסטיקה, פורטלים, תקצוב/FP&A, מנויים, תמחור/CPQ, GRC, משפטי, ידע/הדרכה ועוד) — כך ש**לעולם אין צורך לצאת לאף מערכת חיצונית**. הכול לעסק שלנו בלבד.
**מה לא בהיקף (כרגע):** הפיכה ל-SaaS רב-לקוחותי, מרקטפלייס הרחבות חיצוני, מכירת המוצר לגורם שלישי. הארכיטקטורה תישאר נקייה מספיק כדי לא לחסום זאת בעתיד, אך לא נשלם מחיר תכנוני עבורו עכשיו.

---

## 1. חזון ועקרונות מנחים

### 1.1 צפון אמיתי (North Star)
מערכת **אחת**, real-time, AI-native, עברית-first/RTL, שהיא **מקור אמת יחיד** (single source of truth) לכל פעולה עסקית — מהקליק של הלקוח ועד הרישום החשבונאי הכפול ודוח המע"מ. כל מה ש-SAP/Salesforce/Oracle/Dynamics עושים בנפרד עם אינטגרציות — אנחנו עושים בתוך גרף נתונים אחד, בלי שכבות ETL בין-מערכתיות.

### 1.2 עקרונות-על (Tenets) — כולם `[M]` אלא אם צוין
1. **PRIN-001 [M] — Single source of truth.** כל ישות עסקית (Customer, Product, Order, Invoice, JournalEntry) קיימת פעם אחת. אין כפילויות מסונכרנות.
2. **PRIN-002 [M] — Event-sourced core.** כל שינוי מצב משמעותי כותב אירוע ל-`OutboxEvent`/event log בלתי-משתנה. Read models נגזרים מהאירועים (CQRS היכן שמשתלם).
3. **PRIN-003 [M] — Immutable financial & inventory ledgers.** ספרי החשבונות והמלאי הם append-only. תיקון = רישום נגדי (reversal), לא מחיקה/עדכון.
4. **PRIN-004 [M] — Double-entry everywhere money moves.** כל תנועה כספית מייצרת רישום יומן מאוזן (debit=credit).
5. **PRIN-005 [M] — Auditability by construction.** מי/מה/מתי/מאיזה ערך-לאיזה-ערך נשמר על כל מוטציה רגישה (`AuditLog`), כולל פעולות שמבצע AI.
6. **PRIN-006 [M] — Authorization at the API boundary only.** בקרת גישה חיה ב-tRPC procedures (`adminProcedure(permission)`), ולעולם לא ב-UI בלבד.
7. **PRIN-007 [M] — Israeli-statutory native.** מע"מ, חשבונית ישראל (מספר הקצאה), מבנה אחיד (קובץ SHAAM), ניכוי מס במקור — חלק מהליבה, לא תוספת.
8. **PRIN-008 [M] — Hebrew-first, RTL-correct.** כל מסך, דוח ומסמך מודפס תקין ב-RTL.
9. **PRIN-009 [S] — AI-native, not AI-bolted-on.** לכל מודול Copilot/agent עם הקשר מלא לנתונים, מאחורי guardrails ו-audit.
10. **PRIN-010 [M] — Real-time over batch.** KPIs ודוחות נגזרים חי; batch רק כשאין ברירה (סגירות תקופה, רולאפים כבדים).
11. **PRIN-011 [M] — Configurable, not hardcoded.** שיעורי מס, ספים, מטבעות, מדיניות — בטבלאות קונפיגורציה עם תוקף-לפי-תאריך (effective-dated), לא קבועים בקוד.
12. **PRIN-012 [M] — Segregation of Duties (SoD).** מי שיוצר ספק ≠ מי שמאשר תשלום; מי שיוצר PO ≠ מי שמאשר חשבונית. נאכף במנוע הרשאות.
13. **PRIN-013 [M] — Self-sufficiency ("לעולם לא לצאת").** לכל משימה עסקית חוזרת יש בית מדרגה-ראשונה בתוך המערכת. מערכת חיצונית היא לכל היותר adapter (מקור/יעד נתונים) — לעולם לא היעד שאליו המשתמש *עובר לעבוד*. אם משתמש פותח כלי חיצוני כדי לבצע עבודה — זהו פער מוצר שיש לתעד ולסגור.
14. **PRIN-014 [M] — Extensibility ללא הנדסה.** שכבת no-code (workflow, custom fields/forms, report builder) מאפשרת לענות על צורך חדש בלי לצאת מהמערכת ובלי להמתין למחזור פיתוח.

### 1.3 מה אומר "מעבר ל-SAP"
SAP חזק בעומק ובציות, חלש ב-UX, איטי לשינוי, batch-כבד, ואינטגרציות בין-מודולריות יקרות. **היתרון שלנו:**
- **Unified commerce-to-ledger** — הזמנת אתר → הקצאת מלאי → רישום הכנסה → דוח מע"מ, בלי גשרים.
- **Real-time embedded analytics** — בלי data warehouse נפרד עבור רוב השאלות.
- **AI-native** — שאילתות בשפה טבעית, חיזוי, Document-AI לחשבוניות ספק, next-best-action — מובנה.
- **UX מודרני, עברית-first** — לא Fiori מתורגם.

---

## 2. בנצ'מארק שוק — מה לוקחים ובמה עוקפים

| מערכת | חוזקות שנאמץ | מודולים מובילים | היכן נעקוף |
|---|---|---|---|
| **SAP S/4HANA** | עומק פיננסי, GL/CO, מבנה ארגוני, ציות, material ledger, ATP | FI, CO, MM, SD, PP, QM, PM, EWM, PS, HCM | UX, מהירות שינוי, real-time מלא, עברית/ישראל native, AI מובנה |
| **Oracle (Fusion/NetSuite)** | רב-ספרי (multi-book), איחוד דוחות, SuiteAnalytics | ERP, SCM, EPM, CX | פשטות תפעול, עלות, התאמה מקומית |
| **Salesforce** | CRM עומק: Sales/Service/Marketing, CDP, Agentforce | Sales/Service/Marketing Cloud, Data Cloud, Einstein | איחוד מלא עם ה-ERP (לא שתי מערכות), עלות רישוי |
| **Microsoft Dynamics 365** | אינטגרציה, Business Central, Customer Insights, Copilot | Finance, SCM, Sales, Customer Service, Field Service | unified data model, עברית native |
| **(ייחוס SMB) Odoo / NetSuite** | מודולריות, time-to-value | חבילה רחבה | עומק ארגוני + AI |

**מסקנת ההיקף:** עלינו לכסות את ה-**superset** של המודולים לעיל, אבל כמערכת אחת מאוחדת. הטבלאות בסעיף 4 הן הרשימה המחייבת.

---

## 3. ארכיטקטורת-על (Reference Architecture)

### 3.1 מפת תחומים (Bounded Contexts)
```
                ┌─────────────────────── Master Data (MDM) ───────────────────────┐
                │ Accounts/Customers · Vendors · Items/Products · Pricing · Org/Branch/Warehouse · Chart of Accounts
                └──────────────────────────────────────────────────────────────────┘
   ┌──────────── CRM ────────────┐   ┌──────────────── ERP ────────────────┐   ┌──── Finance ────┐
   │ Sales · Marketing · Service │   │ Procure-to-Pay · Inventory/WMS ·     │   │ GL · AP · AR ·  │
   │ · Customer 360 / CDP ·      │   │ Order-to-Cash/OMS · Manufacturing ·  │   │ Tax · Assets ·  │
   │ Loyalty                     │   │ Demand Planning                      │   │ Cost · Close    │
   └─────────────────────────────┘   └──────────────────────────────────────┘   └─────────────────┘
   ┌──────────── HR/HCM ─────────┐   ┌─── Analytics & BI ───┐   ┌──── AI Layer (cross-cutting) ────┐
   │ Employees · Time · Payroll  │   │ Real-time KPIs ·     │   │ Copilots · NL-Query · Predictions │
   │ · Recruiting (O)            │   │ Semantic layer ·     │   │ · Document-AI · Agents (guarded)  │
   └─────────────────────────────┘   │ Forecast · Replay    │   └───────────────────────────────────┘
        ▲ event log / OutboxEvent (append-only)   │   ▲ AuditLog (append-only)   │   ▲ RBAC/ABAC + SoD
```

### 3.2 דרישות ארכיטקטורה
- **ARCH-001 [M]** מקור אמת יחיד ל-Postgres (Prisma). מערכות חיצוניות (Shopify, CardCom) הן adapters, לא מקור אמת מקביל.
- **ARCH-002 [M]** Event log/outbox בלתי-משתנה לכל אירוע עסקי; consumers אידמפוטנטיים. מרחיב את `OutboxEvent` הקיים.
- **ARCH-003 [M]** Read models / projections לדשבורדים כבדים, נבנים מאירועים; ניתנים לבנייה-מחדש (rebuild) מלאה.
- **ARCH-004 [M]** כל מוטציה רגישה עוברת service layer (`src/server/services/`) ו-procedure מורשה; אין כתיבה ישירה ל-DB מ-UI/route.
- **ARCH-005 [M]** Effective-dated config tables (tax rates, FX, pricing, policies) — שאילתה תמיד "מה היה התקף בתאריך X".
- **ARCH-006 [S]** API פנימי אחיד (tRPC) + שכבת integration adapters מבודדת (`src/server/adapters/`) לכל מערכת חיצונית.
- **ARCH-007 [M]** מיפוי לסטאק הקיים: Next.js 16 / tRPC 11 / Prisma 6 / PostgreSQL / NextAuth 5 / Redis (Upstash) / Typesense — אין החלפת סטאק; מרחיבים.
- **ARCH-008 [S]** Multi-currency + multi-org מהיום הראשון במודל הנתונים (גם אם בפועל ILS/ארגון יחיד) — כדי לא לשבור ספרים בעתיד.

---

## 4. דרישות פונקציונליות לפי מודול

> לכל מודול: מטרה, דרישות מחייבות, ומיפוי לבנצ'מארק. הדרישות הן רשימת-הבדיקה שלך.

### 4.A Master Data Management (MDM)
*🟡 נבנה (זיהוי כפילויות):* `mdm.ts` — `normalizeEmail`/`normalizePhone`/`nameSimilarity`/`duplicateScore`/`findDuplicateCandidates` (טהורים) + מסך `/admin/mdm` לבדיקת מועמדי-כפילות לקוחות (ללא מיזוג הרסני). golden-record מלא/דדופ ספקים — בהמשך.
מטרה: ישות אחת נקייה לכל customer/vendor/item/account, עם מניעת כפילויות וזהות מאוחדת.

| מזהה | חיוב | דרישה |
|---|---|---|
| MDM-001 | [M] | רשומת **Item/Product** מאוחדת המשרתת קטלוג ציבורי, מלאי, רכש, ותמחיר (כבר קיים `Product`/`Variant` — להרחיב ב-cost/valuation fields). |
| MDM-002 | [M] | **Vendor master** עם תנאי תשלום, lead time, מטבע, פרטי בנק, סטטוס, וקבצי ניכוי-מס-במקור (כבר קיים `Vendor` בסיסי). |
| MDM-003 | [M] | **Account/Customer master** עם זהות מאוחדת (email+phone+external ids) ו-identity resolution למיזוג כפילויות. |
| MDM-004 | [M] | **Org structure:** Company → Branch → Warehouse → Bin. כל תנועה משויכת לרמה הנכונה. |
| MDM-005 | [M] | **Chart of Accounts (תרשים חשבונות)** היררכי, effective-dated, עם מיפוי לדיווח רשותי ישראלי. |
| MDM-006 | [S] | מנגנון **dedup/merge** עם audit מלא ושחזור (un-merge) ל-customers ו-vendors. |
| MDM-007 | [M] 🟡 | Validation: ח.פ/ע.מ/ת.ז ישראלי, IBAN, אימות פורמט טלפון/דוא"ל. **נבנה:** `israeli-validators.ts` (טהור — `isValidIsraeliId`/`isValidCompanyId` ספרת-ביקורת מוד-10, `isValidIban`/`isValidIsraeliIban` מוד-97, `isValidIsraeliPhone`, `isValidEmail`); מחווט כשער איכות-נתונים ל-`createB2bAccount` (ח.פ/ע.מ). |

### 4.B CRM — מכירות, שיווק, שירות, Customer 360

**B.1 Sales (פייפליין מכירות) — `CRM-SAL`**
| מזהה | חיוב | דרישה |
|---|---|---|
| CRM-SAL-001 | [M] | Leads → Opportunities → Quotes → Orders עם שלבי pipeline מוגדרים וקונפיגורביליים. |
| CRM-SAL-002 | [M] | הצעות מחיר (Quotes) עם תמחור, הנחות, תוקף, והמרה אוטומטית ל-Order/Invoice. |
| CRM-SAL-003 | [S] | תחזית מכירות (sales forecast) לפי שלב × הסתברות; weighted pipeline. |
| CRM-SAL-004 | [S] 🟡 | Activity timeline אחיד (שיחות, מיילים, פגישות) לכל account. **נבנה:** `CrmActivity` (CALL/EMAIL/MEETING/NOTE/TASK, שיוך ללקוח/ליד/הזדמנות) + `crm-activity.ts` (`summarizeActivityTimeline`/`normalizeActivityType` טהורים) — תיעוד פעילות עם שיוך לקוח לפי דוא"ל, סיכום פר-סוג וציר זמן ב-`/admin/crm`. |

**B.2 Marketing — `CRM-MKT`**
| מזהה | חיוב | דרישה |
|---|---|---|
| CRM-MKT-001 | [M] | **Segmentation engine** דינמי (rule-based + computed traits). מחליף את ה-segments הסטטיים הנוכחיים. |
| CRM-MKT-002 | [M] | **Journeys/automation** מרובת-שלבים (trigger → wait → condition → action) על email/SMS/Push. |
| CRM-MKT-003 | [M] | **Consent & preference center** מלא — opt-in/out פר-ערוץ, תיעוד הסכמה (לציות פרטיות). |
| CRM-MKT-004 | [S] | A/B testing וניתוח attribution לקמפיינים. |
| CRM-MKT-005 | [S] | קופונים/הטבות מותאמות-קהל מקושרות ל-segments (קיים `coupons` — לחבר). |

**B.3 Service (שירות לקוחות) — `CRM-SVC`**
| מזהה | חיוב | דרישה |
|---|---|---|
| CRM-SVC-001 | [M] | **Cases/Tickets** עם סטטוס, עדיפות, בעלות, ו-linking ל-order/customer (קיים `ServiceRequest` — להרחיב ל-case management). |
| CRM-SVC-002 | [M] | **SLA engine** — יעדי תגובה/פתרון, escalation אוטומטי, מדידת עמידה. |
| CRM-SVC-003 | [S] | **Omnichannel inbox** — email/WhatsApp/chat/טופס באתר במקום אחד. |
| CRM-SVC-004 | [S] | **Knowledge base** + הצעות מענה מבוססות-AI. |

**B.4 Customer 360 / CDP — `CRM-360`**
| מזהה | חיוב | דרישה |
|---|---|---|
| CRM-360-001 | [M] | פרופיל 360 מאוחד: orders, wishlist, appointments, service, analytics events, consent, value (קיים בסיס ב-`getCustomer360Profile`). |
| CRM-360-002 | [M] | **מדדים עקביים בין מסכים** — הגדרה אחת ל-LTV/order count/recency (🔧 פער קיים — סעיף 12). |
| CRM-360-003 | [M] | **Churn/health scoring** עם ספים מסודרים ובני-בדיקה (🔧 פער קיים — באג סדר ספים). |
| CRM-360-004 | [S] | Identity resolution חוצה-מכשירים/ערוצים → פרופיל אחד. |
| CRM-360-005 | [S] | Next-best-action מבוסס-מודל (לא רק חוקים) פר לקוח. |

**B.5 Loyalty — `CRM-LOY`** (O)
| CRM-LOY-001 | [O] | תוכנית נקודות/דרגות, צבירה/מימוש, פקיעה — מקושרת ל-orders ו-AR.

### 4.C ERP — Procure-to-Pay (P2P)
מטרה: מספק → PO → קליטה → חשבונית → תשלום, עם 3-way match ובקרת SoD.

| מזהה | חיוב | דרישה |
|---|---|---|
| P2P-001 | [M] 🟡 | **Purchase Requisition → PO** עם workflow אישורים מדורג (לפי סכום/קטגוריה). **נבנה:** `PurchaseRequisition`/`PurchaseRequisitionLine` + `purchase-requisition.ts` (`computeRequisitionTotal`/`requiresApproval`/`parseRequisitionLines` טהורים) — טיוטה→הגשה (מעל סף `PROCUREMENT_APPROVAL_THRESHOLD` דורש אישור, מתחתיו אוטומטי)→אישור/דחייה→המרה ל-PurchaseOrder דרך `createPurchaseOrder`, ניהול ב-`/admin/erp`. סף לדוגמה ₪5K. |
| P2P-002 | [M] | **PO totals מלאים** — subtotal, מע"מ, משלוח, הנחות (כרגע `total=subtotal` בלבד — 🔧 פער). |
| P2P-003 | [M] | **Goods Receipt מעדכן מלאי בפועל** — קליטת PO **חייבת** להגדיל `InventoryItem.quantity` בסניף/מחסן הנכון ולכתוב `InventoryLedger` בתוך אותה טרנזקציה (🔧 פער קריטי — סעיף 12). |
| P2P-004 | [M] | קליטה משויכת ל-**Warehouse/Bin** (כרגע ל-`GoodsReceipt` אין `branchId` — 🔧 פער). |
| P2P-005 | [M] | **Vendor Invoice + 3-way match** (PO ↔ Receipt ↔ Invoice); חריגות נחסמות/מסומנות. |
| P2P-006 | [M] | **AP sub-ledger** — יתרת ספק, גיול (aging), לוח תשלומים. |
| P2P-007 | [M] | **Payment run** — קיבוץ תשלומים, אישור, רישום GL, ניכוי מס במקור אוטומטי. |
| P2P-008 | [M] 🟡 | **Landed cost** — שיוך עלויות שילוח/מכס לעלות הפריט (FIFO/avg). **נבנה:** `LandedCost` + `landed-cost.ts` (`allocateLandedCost` טהור — שקלול לפי VALUE/QUANTITY עם ספיגת שארית עיגול בשכבה הכבדה) — יצירת עלות נלווית פר-PO שנקלט ו-`applyLandedCost` שמעדכן את `ItemCostLayer.unitCost` של שכבות הקליטה אטומית, ניהול ב-`/admin/erp`. **רישום GL להיוון נבנה:** `buildLandedCostJournalLines`/`postLandedCostJournalEntry` (חובה מלאי 1300 / זכות סליקת-עלויות-נלוות 2060, self-heal לחשבון) מחווט ל-`applyLandedCost` (best-effort בתוך ה-tx). |
| P2P-009 | [M] 🟡 | SoD: יוצר ספק ≠ מאשר תשלום; יוצר PO ≠ מאשר חשבונית. **נבנה:** `violatesSoD` טהור + `VendorInvoice.createdById` (נרשם מ-admin המזין); `approveVendorInvoice` דוחה אישור בידי מי שהזין את החשבונית (אלא אם `force`). |

### 4.D ERP — Inventory & Warehouse (WMS)
מטרה: מלאי מדויק, ניתן-לביקורת, ברמת bin, עם valuation נכון.

| מזהה | חיוב | דרישה |
|---|---|---|
| INV-001 | [M] | **InventoryLedger בלתי-משתנה** הוא מקור האמת; כל תנועה (receipt/sale/transfer/adjust/return) = רשומת ledger. |
| INV-002 | [M] | **Valuation method** מוגדר (FIFO / Weighted-Average / Standard) עם material ledger לעלות מדויקת לפריט. |
| INV-003 | [M] | **Reservations** ל-24ש' בצ'קאאוט (קיים `InventoryReservation`) — לאחד עם ה-OMS allocation. |
| INV-004 | [M] 🟡 | **Multi-warehouse + bins** — מיקום + transfer בין-מחסני. **נבנה:** `StorageBin` (קוד A-01-3 פר-סניף) + `BinAssignment` (וריאנט×כמות) + `bins.ts` (`validateBinCode` טהור) במסך `/admin/bins`; העברות קיימות (`stock-transfer`). **in-transit נבנה:** `dispatchStockTransfer` (DRAFT→IN_TRANSIT — הורדת מקור + transfer_out) ו-`completeStockTransfer` שמקבל גם IN_TRANSIT (רגל היעד בלבד); "שלח/קבל" ב-ERP. **pick-path נבנה:** ראה INV-007. |
| INV-005 | [M] | **Cycle counting** ו-stock adjustments עם סיבה, אישור ו-GL impact. |
| INV-006 | [M] 🟡 | **Demand planning/reorder** — נקודת הזמנה + רמת יעד לחידוש. **נבנה:** `reorderPoint`/`targetLevel` על `InventoryItem` + `reorder-planning.ts` (`netAvailable`/`suggestReorderQuantity`/`reorderStatus` טהורים) — הצעות רכש (replenish-up-to) ומדיניות פר-פריט במסך `/admin/reorder`. **נקודת הזמנה דינמית** `dynamicReorderPoint` = מהירות (מ-InventoryLedger) × lead-time + safety, מוצגת ומוצעת אוטומטית. |
| INV-007 | [S] 🟡 | Pick/Pack/Ship workflow עם barcode/QR ו-mobile UI למחסן. **נבנה:** `PickList`/`PickListLine` + `pick-list.ts` (`aggregatePickLines`/`compareBinPath`/`sortByBinPath`/`pickListProgress` טהורים) — `generatePickList` מאחד פריטים מהזמנות בהכנה, מפתור מיקום פר-וריאנט וממיין לפי pick-path; סימון לוקט/סיום/ביטול ב-`/admin/bins`. **Pack נבנה:** `packing-slip.ts` (`buildPackingSlipModel` טהור) + מסך הדפסה `/admin/orders/[id]/packing-slip` (תעודת אריזה נטולת-מחיר עם נמען/פריטים/checkbox). barcode/QR + UI מובייל — חסום (ספק/מכשור). |
| INV-008 | [S] 🟡 | Lot/serial tracking ו-expiry (FEFO) היכן שרלוונטי. **נבנה:** `InventoryLot` (אצווה פר-סניף/וריאנט + תאריך תפוגה) + `lot-tracking.ts` (`allocateFefo`/`sortLotsFefo`/`compareExpiry`/`expiryStatus`/`isExpired` טהורים) — הוספת אצווה, משיכת FEFO (`consumeLotsFefo` אטומי) והתראות תפוגה ב-`/admin/bins`. שכבת מעקב מקבילה ל-InventoryItem. |
| INV-009 | [M] | תאימות בין `isInventoryLowStock` (לוגיקת sellable) לבין שאילתות ה-ERP low-stock. |

### 4.E ERP — Order-to-Cash / OMS
מטרה: ניהול הזמנות omnichannel מאוחד עד הכרת הכנסה וגבייה.

| מזהה | חיוב | דרישה |
|---|---|---|
| OMS-001 | [M] | מצב הזמנה אחיד: `PENDING_PAYMENT → PAID → PREPARING → READY_FOR_PICKUP | SHIPPED → COMPLETED` (קיים) + `CANCELLED/REFUNDED`; כל מעבר כותב `AuditLog`. |
| OMS-002 | [M] | **Allocation/ATP** — הקצאת מלאי חכמה לפי מחסן/זמינות/קרבה; backorder מנוהל. |
| OMS-003 | [M] | **Dropship (Shopify)** כ-fulfillment path עם mirror הזמנות (קיים `shopify-order-mirror`) — לאחד ב-OMS. |
| OMS-004 | [M] | **Customer Invoice + הכרת הכנסה** — כל מכירה מייצרת חשבונית ורישום GL (הכנסה/מע"מ/AR). |
| OMS-005 | [M] | **AR sub-ledger** — יתרות לקוח, גיול, התראות גבייה. |
| OMS-006 | [M] | **Returns/RMA + Refunds** עם החזרת מלאי, רישום נגדי ב-GL, וזיכוי מע"מ. |
| OMS-007 | [M] | אינטגרציית תשלום CardCom כ-adapter עם webhooks אידמפוטנטיים (קיים `payment-webhooks`). |

### 4.F Finance & Accounting (הליבה החשבונאית)
מטרה: הנהלת חשבונות כפולה מלאה, סגירת תקופה, ודיווח רשותי ישראלי — native.

| מזהה | חיוב | דרישה |
|---|---|---|
| FIN-GL-001 | [M] | **General Ledger כפול** — `JournalEntry` + `JournalLine` מאוזנים (Σdebit=Σcredit), append-only, reversal-based. |
| FIN-GL-002 | [M] | **Sub-ledgers** (AP/AR/Inventory/Fixed Assets) מתאזנים אוטומטית מול ה-GL (control accounts). |
| FIN-GL-003 | [M] | **Fiscal periods** עם נעילה; אין רישום לתקופה סגורה ללא הרשאה + audit. |
| FIN-GL-004 | [M] 🟡 | **Multi-currency** — שערים effective-dated, הפרשי שער ממומשים/לא-ממומשים. **נבנה:** `ExchangeRate` (effective-dated אל ILS) + `currency-fx.ts` (`resolveRate`/`convertToBase`/`revaluationGainLoss` טהורים) — ניהול שערים והערכת שווי מחדש (revaluation) של יתרות מט"ח פתוחות (AR/AP) עם הפרשי-שער לא-ממומשים ב-`/admin/finance`. **שערים ידניים + טיפול revaluation — לאמת רו"ח**; חיווט אוטומטי לכל נתיב פרסום GL — בהמשך. |
| FIN-TAX-001 | [M] | **מנוע מע"מ** — שיעור effective-dated (לדוגמה 18% מ-2025-01-01; **לאמת מול רשות המסים**), קודי מס לפריט/לקוח, עסקאות פטורות/אפס. |
| FIN-TAX-002 | [M] 🟡 | **חשבונית ישראל** — **מספר הקצאה** לחשבוניות מעל הסף. **נבנה:** שדות `allocationNumber`/`allocationStatus` על CustomerInvoice + `israeli-tax.ts` (`requiresAllocationNumber`/`validateAllocationNumber` 9 ספרות/`flagInvoicesNeedingAllocation`/`assignInvoiceAllocationNumber`), מסך `/admin/tax`. חיבור API לרשות המסים + חסימת הנפקה — בהמשך. סף לדוגמה ₪20K — **לאמת**. |
| FIN-TAX-003 | [M] 🟡 | **מבנה אחיד (קובץ SHAAM)** — ייצוא BKMVDATA/INI. **נבנה:** `shaam-export.ts` (טהור — A100/B100/**C100/D110**/Z900 + INI, מקודדי שדה + סכומי בקרה) + `getShaamExportForPeriod` (תנועות GL + חשבוניות כמסמכים), הורדה `/api/admin/tax/shaam`. מבנה לפי הוראה 1.31 — **לאמת רוחב שדות + B110/M100 מול רשות המסים/רו"ח**. |
| FIN-TAX-004 | [M] 🟡 | **ניכוי מס במקור** — חישוב, ניכוי ודיווח **856**. **נבנה:** `WithholdingTaxRule` + `israeli-tax.ts` (`computeWithholding`/`effectiveWithholdingRate`); `VendorPayment.withheldTax` נרשם בעת התשלום; **טופס 856** (`computeForm856`/`getForm856` — צבירה פר-ספק) עם טבלה והורדת CSV ב-`/admin/tax`. שיעורים לדוגמה — **לאמת**. |
| FIN-AP-001 | [M] | AP מלא: חשבוניות ספק, 3-way match, לוח תשלומים, גיול. |
| FIN-AR-001 | [M] 🟡 | AR מלא: חשבוניות לקוח, קבלות, גיול, גבייה, dunning. **נבנה:** AR (חשבוניות/קבלות/גיול) קיים; **Dunning נבנה:** `dunning.ts` (`daysOverdue`/`dunningLevel`/`buildDunningWorklist` טהורים) + `DunningAction` — worklist חשבוניות באיחור לפי רמת הסלמה (1–4) ותיעוד פנייה ב-`/admin/finance`. שליחת תזכורות באימייל — מותנה בספק. |
| FIN-CASH-001 | [M] | **Cash & bank** — חשבונות בנק, **bank reconciliation** (התאמת בנק), תזרים מזומנים. |
| FIN-CO-001 | [S] 🟡 | **Cost accounting / רווחיות** — cost centers, profit centers, רווחיות לפי מוצר/לקוח/הזמנה (כיוון CO של SAP). **נבנה:** `CostCenter`/`CostEntry` + `cost-accounting.ts` (`computeCenterProfitability`/`budgetVariance` טהורים) — מרכזי עלות/רווח עם תקציב חודשי, רישום תנועות הכנסה/הוצאה פר-תקופה, רווחיות ושונות-תקציב ב-`/admin/finance`. שכבת CO נפרדת מה-GL; רווחיות פר-מוצר/לקוח — הרחבה עתידית. |
| FIN-RPT-001 | [M] | דוחות כספיים: מאזן (Balance Sheet), רווח והפסד (P&L), תזרים — real-time + לפי תקופה. |
| FIN-RPT-002 | [M] | **Period close** — תהליך סגירה מובנה עם checklist, נעילה, ו-trial balance. |
| FIN-RPT-003 | [S] | גיבוי/גישור לרו"ח חיצוני (ייצוא מבנה אחיד + דוחות PDF/Excel). |

### 4.G Manufacturing / Production (PP/QM) — מותנה-צורך
מטרה: אם/כאשר מיוצר מוצר עצמי (אריזות, סטים, הרכבות). נכלל כי "הכול כולל הכול"; להפעיל לפי צורך אמיתי.

| מזהה | חיוב | דרישה |
|---|---|---|
| MFG-001 | [S] | **BOM (Bill of Materials)** רב-רמתי + routings. |
| MFG-002 | [S] | **Production/Work orders** עם צריכת חומר ו-GL (WIP). |
| MFG-003 | [S] 🟡 | **MRP** — תכנון דרישות חומר מבוסס תחזית+מלאי+פתוחים. **נבנה:** `mrp.ts` (טהור — `explodeRequirements`/`computeNetRequirement`/`mrpStatus`) + `runMrp` (read-only) שמפוצץ עץ מוצר לכמות ייצור, מקזז מול מלאי זמין (רשתי) והזמנות רכש פתוחות (ORDERED/PARTIALLY_RECEIVED), ומחשב חוסר-לרכש; מוצג ב-`/admin/erp`. |
| MFG-004 | [O] 🟡 | **Quality Management** — בדיקות נכנס/יוצא, NCR, אישורי שחרור. **נבנה:** `QualityInspection` + `quality.ts` (`defectRate`/`evaluateInspection` טהורים) — בדיקת מדגם עם AQL ותוצאת עבר/נכשל אוטומטית ב-`/admin/erp`. NCR/אישורי-שחרור — בהמשך. |
| MFG-005 | [O] 🟡 | Subcontracting / assembly kitting (רלוונטי לסטים/מארזים קמעונאיים). **נבנה:** הרכבה כבר קיימת דרך WorkOrder (צריכת רכיבים→מוצר מוגמר). **פירוק נבנה:** `planKitDisassembly` טהור + `disassembleKit` (אטומי — צריכת ערכה מוגמרת והשבת רכיבים למלאי עם תנועות `InventoryLedger` kit_disassemble_in/out) ב-`/admin/erp`. subcontracting — בהמשך. |

### 4.H Asset Management (נכסים קבועים) — `FIN-FA`
| מזהה | חיוב | דרישה |
|---|---|---|
| FIN-FA-001 | [M] | רישום **נכסים קבועים** עם קטגוריה, עלות, תאריך הפעלה. |
| FIN-FA-002 | [M] | **פחת** אוטומטי (קו ישר / יורד) עם רישום GL חודשי; ספרי מס מול הנהלת חשבונות. |
| FIN-FA-003 | [S] | גריעה/מכירת נכס עם רווח/הפסד הון. |
| FIN-FA-004 | [O] 🟡 | **תחזוקת נכסים (PM)** — work orders, לוחות זמנים מונעים. **נבנה:** `MaintenanceSchedule` + `asset-maintenance.ts` (`computeNextDue`/`maintenanceStatus` טהורים) — תזמוני תחזוקה מונעת חוזרת פר-נכס עם תאריך-יעד, סימון "בוצע" (מקדם את היעד), והתראות איחור/מתקרב ב-`/admin/finance`. |

### 4.I HR / HCM — `HR`
מטרה: עובדים, נוכחות, שכר ישראלי. **שים לב:** שכר ישראלי = לוקליזציה כבדה (ביטוח לאומי, מס הכנסה, פנסיה, תלוש 101/106) — **החלטת build-vs-buy פתוחה** (סעיף 14).

| מזהה | חיוב | דרישה |
|---|---|---|
| HR-001 | [M] | **Employee master** + מבנה ארגוני, תפקידים, היררכיית ניהול. |
| HR-002 | [S] 🟡 | **Time & attendance** — שעון נוכחות, חופשות, מחלה, אישורים. **נבנה:** `AttendanceEntry`/`LeaveRequest` + `time-attendance.ts` (`computeWorkedHours`/`computeLeaveDays`/`normalizeLeaveType` טהורים) — רישום כניסה/יציאה עם חישוב שעות (בניכוי הפסקה), בקשות חופשה/מחלה/חל"ת עם ספירת ימים ואישור/דחייה ב-`/admin/performance`. |
| HR-003 | [S] | **Payroll ישראלי** — מס הכנסה, ביטוח לאומי, בריאות, פנסיה/קה"ש, תלוש, טופס 101/106, דיווח 102/126 (**מועמד לאינטגרציה חיצונית** ולא build). |
| HR-004 | [O] | Recruiting/onboarding, ניהול ביצועים. |

### 4.J Projects (PS) — `PRJ` (O)
| PRJ-001 | [O] ✅ | פרויקטים עם תקציב, אבני-דרך, חיוב לפי שלב, ושיוך עלויות/הכנסות. **נבנה:** `projects.ts` + `/admin/projects` — Project/ProjectMilestone/ProjectTimeEntry, ניצול תקציב, בריאות פרויקט, רישום שעות חייבות.

### 4.K Analytics & BI — `BI`
מטרה: כל שאלה עסקית נענית real-time; חיזוי ואנומליות מובנים.

| מזהה | חיוב | דרישה |
|---|---|---|
| BI-001 | [M] | **דשבורדים real-time** לכל מודול (KPIs נגזרים חי, לא batch). מרחיב את ה-analytics/BI הקיים. |
| BI-002 | [M] 🟡 | **Semantic layer** — הגדרת מטריקה/ממד פעם אחת בשימוש חוזר. **נבנה:** `report-datasets.ts` (רישום מאגרים עם ממדים+מדדים מוגדרים-מרכזית) משמש את בונה הדוחות; הרחבה לכלל הדשבורדים בהמשך. |
| BI-003 | [M] | **Self-service exploration** — חיתוכים לפי ממד (זמן/סניף/קטגוריה/לקוח) ללא קוד. |
| BI-004 | [S] 🟡 | **Forecasting + anomaly detection**. **נבנה:** `anomaly-detection.ts` (`mean`/`stdDev`/`detectAnomalies` z-score טהורים) + `getRevenueAnomalies` על הכנסת הזמנות יומית, מסך `/admin/anomalies`. **Forecasting נבנה:** `forecasting.ts` (`linearTrend`/`forecastNext`/`movingAverage` טהורים — מגמה least-squares + בסיס ממוצע-נע) ו-`getRevenueForecast` (תחזית 7 ימים קדימה על סדרת ההכנסה) מוצג ב-`/admin/anomalies`. |
| BI-005 | [S] | **Session replay** ו-product analytics (קיים `analytics-replay`) — לחבר ל-Customer 360. |
| BI-006 | [M] | כל דוח כספי מתאזן מול ה-GL (אין "BI מספר" שסותר את הספרים). |

### 4.L AI Layer ("מעבר ל-SAP") — `AI`
מטרה: שכבת AI חוצת-מודולים, מאחורי guardrails ו-audit. בונה על ה-Vercel AI SDK הקיים (multi-provider).

| מזהה | חיוב | דרישה |
|---|---|---|
| AI-001 | [S] | **Copilot פר-מודול** — "מה מצב התזרים?", "אילו לקוחות בסיכון?", עם הקשר מלא והרשאות המשתמש. |
| AI-002 | [S] | **NL-Query** — שאילתה בשפה טבעית מעל הנתונים → SQL/tRPC מאומת + תוצאה מוסברת. |
| AI-003 | [S] | **Predictions** — churn, demand, credit risk, next-best-action (מחליף heuristics בחוקים+מודל). |
| AI-004 | [S] | **Document-AI** — OCR לחשבוניות ספק/קבלות → טיוטת AP עם 3-way match. |
| AI-005 | [M] 🟡 | **Guardrails + audit** — אין כתיבה אוטונומית לספרים ללא אישור אנושי. **נבנה:** `ai-governance.ts` — `assertAiActionAllowed`/`isModeAllowed`/`maxAutonomyFor` (BOOKS_DOMAINS אף פעם לא AUTONOMOUS) טהורים + מטריצת שומרי-סף, ו-`getAiGovernanceOverview` מעל ה-`AiRun` audit הקיים, מסך `/admin/ai`. החיווט ל-`adminProcedure`/`AuditLog actor=ai` קיים בנתיב ה-agent. |
| AI-006 | [M] | שימוש בדגמי Claude העדכניים (Opus 4.x) כברירת מחדל למשימות ליבה; multi-provider fallback (קיים `quota-router`). |

---

## 4+ הרחבה: שטח הפעולה המלא — "לעולם לא לצאת מהמערכת"

> מה שלמטה ממפה כל סיבה נפוצה שבגללה בעל עסק *עוזב* ל-Excel/Gmail/WhatsApp/POS נפרד/כלי שיווק/חתימה דיגיטלית/וכו'. כל אחד מקבל בית מדרגה-ראשונה בתוך החבילה (PRIN-013).

### 4.M Point of Sale (POS) & קמעונאות אומניצ'אנל — `POS`
מטרה: למכור בחנות הפיזית מאותה מערכת, עם מקור מלאי וכספים אחד.

| מזהה | חיוב | דרישה |
|---|---|---|
| POS-001 | [M] | POS לסניף: עגלה, סריקת ברקוד, תשלום (מזומן/אשראי/ארנק/שובר), הנפקת חשבונית/קבלה ישראלית עם מספר הקצאה (FIN-TAX-002). |
| POS-002 | [M] | **Offline-first** עם סנכרון בטוח (קיים `offline-sync`) — מכירה נמשכת גם בלי רשת. |
| POS-003 | [M] | מקור מלאי **אחד** בין אונליין לחנות (no double-sell); החזרות/החלפות בחנות → InventoryLedger + GL. |
| POS-004 | [M] | משמרת קופה: פתיחה/סגירה, ספירת מזומן, **Z-report**, הפקדות בנק. |
| POS-005 | [S] | חומרה: מגירת מזומן, מדפסת קבלות, מסך לקוח, סורק, מסוף סליקה (CardCom). |
| POS-006 | [S] | **Clienteling** — זיהוי לקוח ב-POS עם Customer 360, היסטוריה והמלצות. |

### 4.N Communications & Collaboration Hub — `COM`
מטרה: דוא"ל, צ'אט, טלפון ו-WhatsApp במקום אחד, מקושרים להקשר.

| מזהה | חיוב | דרישה |
|---|---|---|
| COM-001 | [M] | **Shared inbox** דוא"ל מקושר ל-account/case — לשלוח/לקבל בלי לצאת ל-Gmail. |
| COM-002 | [M] | **צ'אט פנימי** לצוות (ערוצים + ישיר), מקושר לכל ישות (הזמנה/לקוח/PO). |
| COM-003 | [M] | **טלפוניה/VoIP** — click-to-call, הקלטה, לוג שיחות אוטומטי ל-CRM, IVR בסיסי. |
| COM-004 | [M] | **WhatsApp Business + SMS** מאוחדים ל-omnichannel inbox (משלים CRM-SVC-003). |
| COM-005 | [M] | **מרכז התראות אחד** (in-app/email/SMS/push) עם העדפות פר-משתמש (קיים push/web-push). |
| COM-006 | [S] | אזכורים (@mention), תגובות ו-threads על כל ישות; הקצאת מטלות מתוך שיחה. |

### 4.O Document Management & e-Signature — `DMS`
מטרה: כל מסמך, תבנית וחתימה — בפנים.

| מזהה | חיוב | דרישה |
|---|---|---|
| DMS-001 | [M] | מאגר מסמכים מרכזי: תיוק, גרסאות, הרשאות, חיפוש מלא-טקסט + OCR. |
| DMS-002 | [M] | **תבניות מסמכים** (חוזה/הצעה/PO/חשבונית) + מילוי-אוטומטי מנתוני המערכת → PDF. |
| DMS-003 | [M] | **חתימה דיגיטלית** פנימית+חיצונית עם audit trail (לאמת מעמד "חתימה אלקטרונית מאובטחת/מאושרת" בישראל — D10). |
| DMS-004 | [S] | קישור כל מסמך לישות + תאריכי תפוגה/חידוש עם תזכורות. |

### 4.P Workflow, BPM & No-Code Platform — `WFL` (לב ה"לעולם לא לצאת")
מטרה: לבנות תהליך/טופס/אוטומציה חדשים בלי קוד ובלי להמתין לפיתוח.

| מזהה | חיוב | דרישה |
|---|---|---|
| WFL-001 | [M] ✅ | **בונה תהליכים** (trigger → condition → action) חוצה-מודולים, ללא קוד. **נבנה:** `workflows.ts` + `workflow-rules.ts` (מנוע חוקים גנרי all/any/not + אופרטורים) + `workflow-actions.ts` (פעולות עם `{{interpolation}}`), מסך `/admin/workflow`. |
| WFL-002 | [M] ✅ | **Custom fields + custom forms** על כל ישות, בלי שינוי סכמה ידני. **נבנה:** `forms.ts` (FormDefinition/Submission + ולידציית סכמה) + `custom-fields.ts` (CustomFieldDefinition/Value + coercion לפי סוג). |
| WFL-003 | [M] ✅ | **שרשראות אישורים** — פעולת `CREATE_APPROVAL` בתהליך מזינה את ApprovalRequest הקיים (SoD). |
| WFL-004 | [M] ✅ | אוטומציות מבוססות-אירוע (`dispatchEvent`) **אידמפוטנטיות** דרך `dedupeKey` ייחודי על WorkflowRun. (תזמון cron — מטא-דאטה קיים, מתזמן ייעודי בהמשך.) |
| WFL-005 | [S] ✅ | **Business rules + SLA/escalation** גנריים לכל ישות. **נבנה:** `business-rules.ts` — `BusinessRule` (סיווג סינכרוני: FLAG/SET_PRIORITY/REQUIRE_APPROVAL/ESCALATE/NOTIFY מעל מנוע החוקים) + `SlaPolicy` (יעדי תגובה/פתרון לפי ישות×רמה) + `evaluateBusinessRules`/`slaDeadlines`/`slaState` טהורים, מסך `/admin/workflow`. |
| WFL-006 | [S] | App builder קל למסכי/דשבורדי פנים חדשים בלי הנדסה (PRIN-014). |

### 4.Q Report Builder & Spreadsheet Workspace — `RPT` (שלא ייפתח Excel)
מטרה: כל ניתוח אד-הוק נעשה בפנים, חי על הנתונים.

| מזהה | חיוב | דרישה |
|---|---|---|
| RPT-001 | [M] ✅ | מעצב דוחות (ממדים/מדדים) מעל ה-semantic layer (BI-002). **נבנה:** `reports.ts` + `report-engine.ts` (אגרגציה טהורה group-by/SUM/COUNT/AVG/MIN/MAX/DISTINCT + סינון דרך מנוע החוקים) + `report-datasets.ts` (שכבה סמנטית: מאגרי orders/ledger עם ממדים/מדדים מוגדרים-פעם-אחת), מסך `/admin/reports`. |
| RPT-002 | [M] 🟡 | **סביבת pivot** חיה: קיבוץ רב-ממדי + סיכומים על נתוני המערכת (ללא נוסחאות חופשיות עדיין). |
| RPT-003 | [M] 🟡 | ייצוא **CSV** (`toCsv` בנוי); **Excel נבנה:** `reportToMatrix` טהור (משותף ל-CSV/Excel) + `report-export.ts` (`buildReportXlsx` עם `exceljs`, RTL, מדדים מספריים) ונתיב הורדה `/api/admin/reports/[id]/export?format=csv|xlsx` (CSV עם BOM לעברית) עם כפתורי Excel/CSV ב-`/admin/reports`. **דוחות מתוזמנים נבנו:** `ReportSchedule`/`ReportRun` + `report-schedules.ts` (`computeNextRun`/`isScheduleDue`/`normalizeFrequency` טהורים, `runDueReportSchedules`) — תדירות יומי/שבועי/חודשי, cron `/api/jobs/report-schedules` (5:00 UTC ב-vercel.json) ששומר snapshot CSV פר-הרצה, ניהול+הורדת הרצות ב-`/admin/reports` דרך `/api/admin/reports/runs/[id]`. **PDF נבנה:** מסך הדפסה `/admin/reports/[id]/print` (print-to-PDF דרך הדפדפן — RTL/עברית מושלמים, ללא תלות) עם כפתור "PDF" בשורת הדוח. |
| RPT-004 | [S] | דשבורדים אישיים מורכבים-משתמש, עם שיתוף והרשאות. |

### 4.R Digital Marketing Suite — `DMK`
מטרה: כל פעילות שיווק (אורגני+ממומן) מנוהלת בפנים.

| מזהה | חיוב | דרישה |
|---|---|---|
| DMK-001 | [M] | ניהול רשתות חברתיות: תזמון/פרסום/inbox מאוחד (Meta/IG/TikTok). |
| DMK-002 | [M] 🟡 | ניהול קמפיינים ממומנים: תקציב, ביצועים, **ROAS**. **נבנה:** `marketing-campaigns.ts` (`computeRoas`/`computeCampaignMetrics` טהורים + רישום הוצאה/הכנסה לפי ערוץ) במסך `/admin/marketing`. הזנת spend/revenue אוטומטית מ-Google/Meta דרך IPL — בהמשך. |
| DMK-003 | [S] | SEO: meta/sitemaps/redirects, מחקר מילות מפתח, ניטור דירוג (משלים CMS). |
| DMK-004 | [S] | לוח תוכן (content calendar) + ניהול נכסי קריאייטיב (DAM קל, מעל Cloudinary). |
| DMK-005 | [M] ✅ | תוכנית **שותפים/הפניות** (affiliate/referral): מעקב, עמלות, ותשלום דרך AP. **נבנה:** `affiliates.ts` — `AffiliatePartner`(קוד+עמלה%) + `Referral` (PENDING→APPROVED→PAID) + `computeCommission`/`summarizeReferrals` טהורים, במסך `/admin/marketing`. |

### 4.S CMS & Storefront Experience — `CMS`
מטרה: ניהול חוויית האתר, מבצעים ומרצ'נדייזינג — בלי כלי חיצוני.

| מזהה | חיוב | דרישה |
|---|---|---|
| CMS-001 | [M] 🟡 | **Page/blog builder** (בלוג קיים + **בונה עמודי נחיתה**). **נבנה:** `LandingPage`/`PageBlock` (HERO/TEXT/IMAGE/CTA) + `landing-pages.ts` (`slugifyPage`/`orderBlocks` טהורים + move/reorder) עם עורך ב-`/admin/pages` ורנדר ציבורי `/p/[slug]`. |
| CMS-002 | [M] 🟡 | מנוע **מבצעים** אוטומטי (ספי סל/כמות, עדיפות, stacking). **נבנה:** `Promotion` + `promotions.ts` (`evaluatePromotions`/`promotionDiscount`/`isPromotionActive` טהורים — הטוב-ביותר מבין ה-non-stackable + צבירת stackable, תקרה בסכום הסל) עם סימולטור ב-`/admin/promotions`. כולל **BOGO** (`bogoDiscount` — יחידות זולות חינם פר-סט) ו**היקף פר-קטגוריה** (`categorySubtotal`). חיווט לצ'קאאוט החי — בהמשך. |
| CMS-003 | [M] 🟡 | **מרצ'נדייזינג**: banners לפי מיקום + **A/B**. **נבנה:** `Banner`+`merchandising.ts` (`selectActiveBanners`) ב-`/admin/merchandising`; `Experiment`/`ExperimentVariant`+`ab-testing.ts` (`pickVariant`/`conversionRate`/`chooseWinner` טהורים) ב-`/admin/experiments`. סדר קטגוריות/pin-boost — בהמשך. |
| CMS-004 | [S] | **פרסונליזציה + recommendation engine** מעל Typesense + vectors. |
| CMS-005 | [S] | ניהול חיפוש: synonyms, redirects, no-result rules. |

### 4.T Field Service, Delivery & Logistics (TMS) — `LOG`
מטרה: ניהול משלוחים, שליחים ושירות-שטח בתוך OMS.

| מזהה | חיוב | דרישה |
|---|---|---|
| LOG-001 | [M] | ניהול **shipments**: אריזה, מצב, מעקב, מסירה. |
| LOG-002 | [M] | אינטגרציית שליחים + **הדפסת מדבקות/manifests** והשוואת תעריפים. |
| LOG-003 | [S] | אופטימיזציית מסלולים + **אפליקציית נהג** (מעקב, חתימת מסירה/POD). |
| LOG-004 | [S] | **Field service**: קריאות בשטח, לוח טכנאים, חלקים, חיוב. |
| LOG-005 | [S] | **BOPIS** (איסוף עצמי) מסונכרן עם POS ו-OMS (קיים `READY_FOR_PICKUP`). |

### 4.U Expense Management, כרטיסי אשראי וטיולים — `EXP`
| מזהה | חיוב | דרישה |
|---|---|---|
| EXP-001 | [M] | דיווח הוצאות עובד + צילום קבלה (Document-AI, AI-004) → אישור → החזר/AP. |
| EXP-002 | [M] | התאמת **כרטיסי אשראי עסקיים** לתנועות והוצאות. |
| EXP-003 | [S] | מדיניות הוצאות עם אכיפה אוטומטית; per-diem / החזר ק"מ. |
| EXP-004 | [O] | הזמנת נסיעות/לינה. |

### 4.V Treasury, תקצוב ו-FP&A — `FPA`
מטרה: תכנון פיננסי, תקציבים ותזרים — לא ב-Excel.

| מזהה | חיוב | דרישה |
|---|---|---|
| FPA-001 | [M] | **תקציבים** (מחלקה/פרויקט/תקופה) מול ביצוע בפועל (budget vs actual). |
| FPA-002 | [M] | תחזית **תזרים מזומנים** מתגלגלת (13-week + שנתי). |
| FPA-003 | [M] | תכנון **תרחישים** (what-if), מודלים ויעדים. |
| FPA-004 | [S] | **Board pack** — חבילת דוחות הנהלה אוטומטית תקופתית. |
| FPA-005 | [S] | ניהול אשראי/הלוואות/קווי אשראי + FX hedging בסיסי. |

### 4.W Subscriptions, חיוב מתגלגל והכרת הכנסה — `SUB`
| מזהה | חיוב | דרישה |
|---|---|---|
| SUB-001 | [M] | מוצרי מנוי/חברות: חיוב מתגלגל, חידוש, שדרוג/שנמוך, ביטול, proration. |
| SUB-002 | [M] | **Dunning** (כשל גבייה → ניסיונות → השעיה) מקושר ל-AR ולתשלום. |
| SUB-003 | [M] | **הכרת הכנסה** לאורך זמן (deferred revenue) לפי ASC 606 / IFRS 15. |
| SUB-004 | [S] | מדדי **MRR/ARR/churn** מנויים בדשבורד. |

### 4.X Pricing & CPQ — `PRC`
| מזהה | חיוב | דרישה |
|---|---|---|
| PRC-001 | [M] | מחירונים מרובים (ערוץ/לקוח/מטבע/כמות) **effective-dated**. |
| PRC-002 | [M] | מנוע הנחות/מבצעים/**rebates** עם עדיפויות ומניעת stacking לא רצוי. |
| PRC-003 | [S] | **CPQ**: תצורת מוצר מורכב + תמחור + הצעה אוטומטית (B2B/סטים). |
| PRC-004 | [S] | Price optimization מבוסס-AI (ביקוש/תחרות/מרג'ין). |

### 4.Y פורטלים: ספקים, B2B ולקוחות — `POR`
| מזהה | חיוב | דרישה |
|---|---|---|
| POR-001 | [M] 🟡 | **פורטל לקוח** self-service: הזמנות, חשבוניות, מסמכים. **נבנה:** `customer-portal.ts` (`getCustomerPortalData` ממוקד-לקוח-מאומת בלבד + `summarizeCustomerInvoices` טהור) ומסך `/account/invoices` — חשבוניות (AR) + מצב תשלום + מסמכים (DMS). RMA/פניות קיימים בעמודי החשבון. |
| POR-002 | [M] 🟡 | **פורטל ספק**: PO, חשבוניות, מצב תשלום, scorecard. **נבנה:** `vendor-portal.ts` — `VendorPortalToken` (magic-link 32B, מתבטל/פג-תוקף) + `resolveVendorPortalByToken` (קריאה בלבד, מוגבל לספק) + `computeVendorScorecard` (אספקה-בזמן%) טהור; מסך ציבורי `/vendor-portal/[token]` + הנפקה/ביטול ב-`/admin/erp`. אישורי משלוח — בהמשך. |
| POR-003 | [S] 🟡 | **פורטל B2B**: תנאים מסחריים, אשראי. **נבנה:** `B2bAccount` + `b2b.ts` (`b2bPrice`/`availableCredit`/`creditStatus` טהורים) — הנחה מוסכמת, מסגרת אשראי ותנאי תשלום; ניהול ב-`/admin/b2b`, מוצג בפורטל הלקוח (`/account/invoices`). **מחירונים פר-SKU נבנו:** `PriceList`/`PriceListItem` + `price-lists.ts` (`resolveContractPrice` טהור) עם ניהול ושיוך לחשבון ב-`/admin/price-lists`. **מורשי-קנייה מרובים נבנו:** `B2bAuthorizedBuyer` (שם/דוא"ל/תפקיד/תקרת הזמנה + סטטוס עצמאי) + `buyerWithinLimit` טהור; ניהול הוספה/השעיה/הסרה לכל חשבון ב-`/admin/b2b`. |

### 4.Z GRC — ממשל, סיכון, ציות + ESG — `GRC`
| מזהה | חיוב | דרישה |
|---|---|---|
| GRC-001 | [M] | ניהול מדיניות/נהלים + **attestation** (אישור קריאה) של עובדים. |
| GRC-002 | [M] | רישום **סיכונים ובקרות** (internal controls) מול הספרים. |
| GRC-003 | [M] | **בקשות פרטיות (DSAR)** — מחיקה/ייצוא נתוני לקוח אוטומטי (תיקון 13/GDPR, משלים NFR-PRIV-001). |
| GRC-004 | [S] | דיווח **ESG/קיימות** (אריזה/פליטות/שרשרת אספקה). |
| GRC-005 | [S] | **לוח ציות** (רישיונות/חידושים/תאריכי דיווח רשותי) עם תזכורות. |

### 4.AA Legal & Contract Lifecycle (CLM) — `LGL`
| מזהה | חיוב | דרישה |
|---|---|---|
| LGL-001 | [M] | מחזור חיי חוזים: טיוטה → מו"מ → חתימה → חידוש/פקיעה (עם DMS + e-sign). |
| LGL-002 | [S] | מאגר התחייבויות/סעיפים + תזכורות חידוש/הודעה מוקדמת. |
| LGL-003 | [O] | ניהול תיקים/תביעות משפטיים. |

### 4.AB Knowledge, Wiki & LMS — `KNW`
| מזהה | חיוב | דרישה |
|---|---|---|
| KNW-001 | [M] | **ויקי/בסיס ידע פנימי** (SOPs, נהלים) עם חיפוש ו-AI Q&A. |
| KNW-002 | [M] 🟡 | **LMS** — הדרכה/אונבורדינג עובדים. **נבנה:** `Course`/`CourseEnrollment` + `lms.ts` (`courseProgress`/`enrollmentStatus` טהורים) — קורסים, הרשמה ומעקב השלמה ב-`/admin/lms`. **מבחנים נבנו:** `CourseQuiz`/`QuizQuestion`/`QuizAttempt` + `scoreQuiz`/`isQuizPassed`/`parseQuizOptions` טהורים — ציון עובר פר-קורס, בניית שאלות רב-ברירה (סימון תשובה נכונה בכוכבית), ורישום/ניקוד ניסיון מבחן לעובד רשום. |
| KNW-003 | [S] | בסיס ידע חיצוני ללקוחות (מקושר ל-CRM-SVC-004). |

### 4.AC Calendar, Scheduling & Resource Booking — `CAL`
| מזהה | חיוב | דרישה |
|---|---|---|
| CAL-001 | [M] | **יומן מאוחד** (פגישות/משימות/אירועים) מסונכרן עם `appointments` הקיים. |
| CAL-002 | [M] | הזמנת תורים/שירות ללקוחות + שיבוץ צוות/משאבים. |
| CAL-003 | [S] | **תכנון משמרות** עובדים מקושר ל-HR ולנוכחות. |

### 4.AD Multi-Entity, Intercompany & Consolidation — `ENT`
| מזהה | חיוב | דרישה |
|---|---|---|
| ENT-001 | [M] ✅ | מבנה **רב-ישותי** (חברות/מטבעות) מהיום, גם אם ישות אחת בפועל (ARCH-008). **נבנה:** מודל `LegalEntity` + `entityId` על `JournalEntry`, `entities.ts`, מסך `/admin/entities`. **ייחוס מלא לישות**: תנועות ידניות (`postManualJournalEntry`) + **אוטומטיות (מכירה/החזר/קליטת PO)** מקבלות `entityId` דרך `resolvePostingEntityId(branchId)` — לפי הישות של הסניף (`Branch.entityId`), אחרת ישות הבסיס. שיוך סניף↔ישות במסך `/admin/entities`. |
| ENT-002 | [S] ✅ | תנועות **בין-חברתיות** (intercompany) + ביטול הדדי. **נבנה:** `IntercompanyTransaction` (OPEN→ELIMINATED) + `summarizeIntercompany`. |
| ENT-003 | [S] 🟡 | דוחות **מאוחדים** רב-מטבעיים. **נבנה:** `consolidation.ts` (טהור) — תרגום לפי שער-לבסיס לכל ישות + מאזן בוחן מאוחד מאוזן. הערה: שער-סגירה יחיד לכל החשבונות (ללא CTA נפרד P&L/BS) — v1. |

### 4.AE Integration Platform (iPaaS), API & EDI — `IPL`
| מזהה | חיוב | דרישה |
|---|---|---|
| IPL-001 | [M] 🟡 | מחבּרים מנוהלים + **webhooks דו-כיווניים** אידמפוטנטיים. **נבנה (יוצא):** `webhook-delivery.ts` — `WebhookEndpoint`/`WebhookDelivery`, חתימת HMAC-SHA256, `dispatchWebhookEvent` אידמפוטנטי (dedupeKey), משלוח חי עם backoff. נכנס: `webhook-events.ts` הקיים. EDI עדיין לא. |
| IPL-002 | [M] ✅ | **API management** פנימי: מפתחות, rate limits, לוגים. **נבנה:** `api-keys.ts` — `ApiKey` (hash בלבד, prefix גלוי, scopes, rateLimitPerMin, תפוגה) + `verifyApiKey` + `ApiRequestLog`, מסך `/admin/developer`. |
| IPL-003 | [S] 🟡 | **EDI** (X12) לספקים. **נבנה:** `edi.ts` (טהור — `build850` הזמנת רכש + `build810` חשבונית + `build856` ASN (היררכיית HL משלוח→הזמנה→פריט, BSN/PRF/SN1), מעטפת ISA/GS…GE/IEA + ספירות בקרה) + `EdiDocument`; הפקת 850 מ-PO ו-856 מ-Shipment, הורדה דרך `/api/admin/edi/[id]` במסך `/admin/edi`. מבנה 004010 — **לאמת מול השותף**. EDIFACT — בהמשך. |
| IPL-004 | [O] | פורטל מפתחים + sandbox להרחבות עתידיות (בלי לפתוח ל-SaaS). |

### 4.AF Gift Cards, Store Credit & Wallet — `WAL`
| מזהה | חיוב | דרישה |
|---|---|---|
| WAL-001 | [M] | **שוברי מתנה** (הנפקה/מימוש/יתרה) עם רישום **התחייבות** ב-GL. |
| WAL-002 | [M] | **זיכוי חנות/ארנק** לקוח (החזרות → credit) שמיש אונליין + POS. |
| WAL-003 | [S] | המרת נקודות נאמנות לארנק (קישור ל-CRM-LOY). |

### 4.AG HR עומק: גיוס, ביצועים, הטבות, פורטל עובד — `HRX`
*ביצועים ✅ נבנה:* `PerformanceReview` (מחזור+דירוג 1-5+סטטוס) + `PerformanceGoal` (התקדמות 0-100) + `hr-performance.ts` (`summarizeGoals`/`averageRating` טהורים) במסך `/admin/performance`. גיוס קיים (`recruiting`). הטבות/פורטל עובד — בהמשך.
| מזהה | חיוב | דרישה |
|---|---|---|
| HRX-001 | [M] | **פורטל עובד** self-service (תלושים, חופשות, פרטים, בקשות). |
| HRX-002 | [S] | **ATS/גיוס**: משרות, מועמדים, ראיונות, גיוס → onboarding. |
| HRX-003 | [S] | **ניהול ביצועים**: יעדים, הערכות, 1:1, משוב. |
| HRX-004 | [S] | הטבות/רווחה + ניהול נוכחות מתקדם. |

### 4.AH Facilities, סניפים ותפעול חנות — `FAC`
| מזהה | חיוב | דרישה |
|---|---|---|
| FAC-001 | [M] | ניהול מיקומים/סניפים (קיים `Branch`): שעות, צוות, ציוד, חוזי שכירות. |
| FAC-002 | [S] | **משימות תפעול לסניף** (פתיחה/סגירה/ניקיון/בקרת איכות) עם checklists. |
| FAC-003 | [O] | תחזוקת מתקנים (מקושר ל-FIN-FA-004). |

### 4.AI ITSM / Help Desk פנימי + נכסי IT — `ITS`
| מזהה | חיוב | דרישה |
|---|---|---|
| ITS-001 | [S] | קריאות תמיכה פנימיות (IT/תפעול) עם SLA — מעל מנוע ה-Case המשותף (CRM-SVC). |
| ITS-002 | [O] | רישום נכסי IT/ציוד עובדים (מקושר ל-Fixed Assets ול-HR). |

### 4.AJ Mobile & Offline App Surface — `MOB`
| מזהה | חיוב | דרישה |
|---|---|---|
| MOB-001 | [M] | **אפליקציית אדמין ניידת** (PWA קיים) לאישורים/דשבורדים/התראות בדרכים. |
| MOB-002 | [M] | **אפליקציית מחסן** (סורק ברקוד) ל-receive/pick/count (INV/P2P). |
| MOB-003 | [S] | אפליקציית POS/נהג/נציג-שטח לפי צורך — **offline-first**. |

---

## 5. דרישות לא-פונקציונליות (NFRs)

| מזהה | חיוב | דרישה |
|---|---|---|
| NFR-PERF-001 | [M] | דשבורד ליבה < 1.5ש' P95; שאילתת רשימה < 500ms P95. |
| NFR-SCALE-001 | [S] | תמיכה ב-≥1M orders, ≥500K customers, ≥100K SKUs בלי דגרדציה לינארית (אינדוקס/projections). |
| NFR-AVAIL-001 | [M] | יעד זמינות 99.9%; RPO ≤ 5 דק', RTO ≤ 1ש' לנתונים פיננסיים. |
| NFR-SEC-001 | [M] | הצפנה in-transit (TLS) ו-at-rest; secrets ב-vault/env מאומת (`src/env.js`). |
| NFR-PRIV-001 | [M] | ציות **חוק הגנת הפרטיות (תיקון 13)** + GDPR-class: מחיקה/ייצוא נתוני לקוח, מינימיזציה, retention policies. |
| NFR-AUDIT-001 | [M] | כל מוטציה פיננסית/מלאי/הרשאה ניתנת לשחזור מלא (who/what/when/before/after) ובלתי-ניתנת-למחיקה. |
| NFR-OBS-001 | [S] | Observability: logs/metrics/traces, alerting על אנומליות פיננסיות, health checks (קיים `health` service). |
| NFR-I18N-001 | [M] | RTL תקין בכל מסך ומסמך מודפס; פורמט תאריך/מטבע/מספר ישראלי. |
| NFR-A11Y-001 | [S] | נגישות לפי ת"י 5568 / WCAG 2.1 AA במסכי האדמין. |
| NFR-TEST-001 | [M] | כל מודול פיננסי/מלאי עם unit + integration tests; **CRM ו-ERP כרגע ללא בדיקות ייעודיות** (🔧 פער — סעיף 12). |

---

## 6. אבטחה, הרשאות וממשל (Security & Governance)

- **SEC-001 [M]** הרחבת `AdminPermission` enum למודולים החדשים (finance.read/post, ap.approve, payment.run, inventory.adjust, payroll.run וכו'), נאכף ב-`adminProcedure(permission)`.
- **SEC-002 [M]** **ABAC** מעבר ל-RBAC: גישה מותנית-הקשר (סניף/מחסן/סכום) — מאשר תשלום עד תקרה X.
- **SEC-003 [M]** **מטריצת SoD** מתועדת ונאכפת (ראה PRIN-012). חריגה דורשת אישור-על + audit.
- **SEC-004 [M]** **Approval workflows** מדורגים (סכום/קטגוריה) ל-PO, חשבוניות, תשלומים, התאמות מלאי, ושינויי GL.
- **SEC-005 [M]** Audit immutability — `AuditLog` append-only; ניסיון שינוי/מחיקה נחסם ברמת ה-service ו-DB.
- **SEC-006 [S]** הפרדת שתי זרימות האימות הקיימות (customers OTP, admins password) נשמרת; admins עם MFA `[S]`.

---

## 7. מודל נתונים — תוספות סכמה עיקריות (Prisma)

> ברמת-על; הפירוט המלא בשלב התכנון של כל phase. מודלים קיימים מסומנים (קיים).

- **Finance:** `LedgerAccount` (CoA), `JournalEntry`, `JournalLine`, `FiscalPeriod`, `TaxCode`, `TaxRate(effective-dated)`, `ExchangeRate(effective-dated)`, `BankAccount`, `BankReconciliation`.
- **AP/AR:** `VendorInvoice`, `VendorInvoiceLine`, `Payment`, `PaymentAllocation`, `CustomerInvoice`(הרחבת order→invoice), `Receipt`, `CreditNote`, `WithholdingCertificate`.
- **Inventory/WMS:** `InventoryLedger`(קיים — לחבר לקליטה), `Warehouse`, `Bin`, `StockTransfer`, `StockCount`, `ItemCostLayer`(FIFO), `LandedCost`.
- **P2P:** `PurchaseRequisition`, `PurchaseOrder`(קיים — להוסיף tax/shipping), `GoodsReceipt`(קיים — להוסיף `warehouseId`/`binId` + inventory posting), `ProductCostSnapshot`(קיים).
- **CRM:** `Lead`, `Opportunity`, `Quote`, `Campaign`, `Journey`, `Segment`(הרחבת `CustomerSegment` לדינמי), `Case`(הרחבת `ServiceRequest`), `SLAPolicy`, `ConsentRecord`.
- **Fixed Assets:** `FixedAsset`, `DepreciationSchedule`, `AssetDisposal`.
- **Manufacturing (מותנה):** `BillOfMaterials`, `BomLine`, `WorkOrder`, `Routing`.
- **HR (מותנה):** `Employee`, `Position`, `TimeEntry`, `LeaveRequest` (+ payroll חיצוני אם נבחר).
- **Config:** טבלאות effective-dated גנריות לכל policy/rate.

---

## 8. אינטגרציות חיצוניות (Adapters)

| מערכת | תפקיד | מזהה |
|---|---|---|
| CardCom | סליקה (קיים) | INT-001 [M] |
| Shopify | dropship/mirror (קיים) | INT-002 [M] |
| Resend/Brevo | email (קיים) | INT-003 [M] |
| Cloudinary | מדיה (קיים) | INT-004 [M] |
| Typesense + vectors | חיפוש/סמנטי (קיים) | INT-005 [M] |
| רשות המסים (חשבונית ישראל / מבנה אחיד) | חשבונית ומספר הקצאה ואישורי ניכוי | INT-006 [M] |
| בנקים (Open Banking / קבצי תנועות) | bank reconciliation | INT-007 [S] |
| ספק שכר (אם build-vs-buy=buy) | payroll | INT-008 [S] |

- **INT-PRIN [M]** כל אינטגרציה היא adapter מבודד עם webhooks אידמפוטנטיים, retry/backoff, ו-dead-letter; לעולם לא מקור אמת מקביל.

---

## 9. דיווח רשותי ישראלי — דרישה מפורטת (קריטי)

> מסומן בנפרד כי זו ההבחנה מ-ERP גלובלי "מתורגם". **כל המספרים/הספים — לאימות מול רו"ח/רשות המסים לפני יישום.**

- **IL-001 [M]** מע"מ: שיעור effective-dated (18% נכון ל-2025 — לאמת), דוח תקופתי (PCN874), עסקאות חייב/פטור/אפס/תשומות.
- **IL-002 [M]** **חשבונית ישראל:** קבלת **מספר הקצאה** מרשות המסים לחשבוניות מעל הסף; הצגתו על החשבונית; חסימת מסירה ללא מספר כשחובה. סף קונפיגורבי (יורד מדורגת — לאמת ערך נוכחי).
- **IL-003 [M]** **מבנה אחיד (קובץ אחיד / SHAAM):** ייצוא `BKMVDATA`+`INI` במבנה הנדרש לביקורת מס.
- **IL-004 [M]** **ניכוי מס במקור:** ניהול אישורים, חישוב, ניכוי בתשלום, דוח 856.
- **IL-005 [S]** טפסי שכר (אם payroll פנימי): 101/106, דיווחי 102/126 לביטוח לאומי/מס הכנסה.
- **IL-006 [M]** מספור חשבוניות/קבלות רציף וחוקי, מסמכים מקוריים בלתי-ניתנים-לשינוי (append-only + reversal).

---

## 10. קריטריוני קבלה ו-Definition of Done (מחייב)

כל דרישה `[M]`/`[S]` נחשבת "בוצעה" רק כאשר:
1. **DOD-001** קוד + טסטים (unit + integration; e2e לזרימות קריטיות) עוברים `pnpm verify:full`.
2. **DOD-002** בקרת גישה ב-procedure + ערך הרשאה תואם; נבדק שמשתמש לא-מורשה נחסם.
3. **DOD-003** כל מוטציה רגישה כותבת `AuditLog`/event; נבדק.
4. **DOD-004** דרישה פיננסית: trial balance מאוזן בטסט; reversal מתואם.
5. **DOD-005** RTL ועברית נבדקו במסך/מסמך הרלוונטי.
6. **DOD-006** דרישה רשותית: אומתה מול רו"ח/מסמך רשות המסים, עם פנייה מתועדת.
7. **DOD-007** טלמטריה/health check למסלול החדש.

---

## 11. עקרונות-על שאסור להפר (Invariants)
- INV-A: סכום debit = סכום credit בכל `JournalEntry`. תמיד.
- INV-B: יתרת sub-ledger = יתרת control account ב-GL. בכל רגע.
- INV-C: סכום תנועות `InventoryLedger` לפריט×מחסן = `InventoryItem.quantity`. בכל רגע.
- INV-D: אין מחיקה של מסמך פיננסי/מלאי — רק reversal.
- INV-E: אין כתיבה ל-DB רגיש מחוץ ל-service layer מורשה.

---

## 12. ניתוח פערים מול הקוד הקיים (Gap Analysis)

> מעוגן בסקירת `src/server/services/crm.ts` ו-`erp.ts`. זה הבסיס שעליו בונים.

**מה כבר חזק (לשמר):**
- מבנה service/router נקי, typed, עם `adminProcedure` + `AuditLog`.
- KPIs אמיתיים מה-DB; `OutboxEvent` event-sourcing קיים; `InventoryLedger`/`InventoryReservation` קיימים; analytics/BI + session replay; multi-provider AI עם quota-router.

**פערים מחייבי-תיקון (ממופים לדרישות):**

| # | פער | חומרה | דרישה-יעד |
|---|---|---|---|
| G1 | **קליטת PO (`receivePurchaseOrder`) לא מעדכנת מלאי ולא כותבת `InventoryLedger`** — רושמת goods receipt + cost snapshot בלבד. לולאת הרכש שבורה. | קריטי | P2P-003, P2P-004, INV-001 |
| G2 | **`computeChurnRisk` — `"HIGH"` קוד מת.** סדר הספים בודק `≥90→DORMANT` לפני `≥120→HIGH`; הסמנטיקה הפוכה. | בינוני-גבוה | CRM-360-003 |
| G3 | **שתי הגדרות ל-LTV** — overview סופר כל ההזמנות (כולל CANCELLED/REFUNDED), 360/snapshot מסנן אותן. אי-עקביות בין מסכים. | בינוני | CRM-360-002, BI-002 |
| G4 | **רשימות VIP/dormant/at-risk נגזרות מ-12 לקוחות בלבד** (`take: 12`) — לא מהבסיס כולו. | בינוני | CRM-360-001 |
| G5 | **`total = subtotal`** ב-`createPurchaseOrder` — בלי מע"מ/משלוח. | בינוני | P2P-002 |
| G6 ✅ | **תקרת 80 פריטים** ב-low-stock. **נסגר:** `reorder-planning.ts` + `/admin/reorder` — נקודת הזמנה/רמת יעד פר-פריט והצעות רכש מלאות (ללא תקרה). | נמוך-בינוני | INV-006 |
| G7 | **אפס בדיקות** ל-CRM/ERP (אין `crm.test.ts`/`erp.test.ts`). | בינוני | NFR-TEST-001 |

**סטטוס יישום (Phase 0, פרוסה 1 — 2026-06-24):** ✅ G1–G7 תוקנו ברמת הלוגיקה ב-`src/server/services/{erp,crm}.ts`, עם `erp.test.ts`/`crm.test.ts`, typecheck ו-lint נקיים. **ללא שינוי סכמה / migration** (נשען על העמודות והמודלים הקיימים: `InventoryItem`, `InventoryLedger`, `PurchaseOrder.taxTotal/shippingTotal`).

**סטטוס יישום (Phase 0, פרוסה 2 — 2026-06-24):** ✅ הונח **היסוד הפיננסי הכפול** (FIN-GL-001): מודלים `LedgerAccount`/`JournalEntry`/`JournalLine` בסכמה + שירות [ledger.ts](../src/server/services/ledger.ts) — chart of accounts, `postJournalEntry` עם אכיפת `Σdebit=Σcredit`, בוני שורות למכירה (חילוץ מע"מ + COGS) ולקליטת סחורה, `reverseJournalEntry` (reversal-based, PRIN-003) ו-`computeTrialBalance`. נוסף `branchId` ל-`GoodsReceipt` ונשמר בקליטה (P2P-004). 18 בדיקות עוברות (כולל `ledger.test.ts`), typecheck+lint נקיים. **ה-migration הוחל** (`migrate deploy`) וה-CoA נזרע (10 חשבונות, `scripts/seed-ledger.sql` + `prisma/seed.ts`).

**סטטוס יישום (Phase 0, פרוסה 3 — 2026-06-24):** ✅ ה-GL **מחווט לזרימות החיות**: קליטת PO ([erp.ts](../src/server/services/erp.ts)) רושמת מלאי/GRNI בתוך אותה טרנזקציה; מעבר הזמנה ל-PAID (webhook CardCom → `recordPaymentCapturedSideEffects`) קורא ל-`postOrderSaleToLedger` ([finance.ts](../src/server/services/finance.ts)) — idempotent פר-הזמנה, best-effort (לא שובר checkout), מחלץ מע"מ בשיעור ברירת-מחדל ומשייך COGS↔מלאי. **אימות:** 954 בדיקות עוברות, typecheck+lint נקיים, ו-DB smoke (רישום מאוזן + FK) עבר. ✅ **Phase 0 exit מתקיים:** כל מכירה/קליטה מייצרת רישום GL מאוזן; ה-trial balance מתאזן. **נותר ל-Phase 1:** AP/AR מלאים, vendor invoices + 3-way match, valuation (FIFO/avg) ו-period close — ראה §13.

**סטטוס יישום (Phase 1, פרוסה 1 — Accounts Payable — 2026-06-24):** ✅ הונח מודול AP (P2P-005/006/007): מודלים `VendorInvoice`/`VendorInvoiceLine`/`VendorPayment`/`VendorPaymentAllocation` + שירות [accounts-payable.ts](../src/server/services/accounts-payable.ts) — `createVendorInvoice`, **3-way match** (PO↔קליטה↔חשבונית) עם דגלי variance, `approveVendorInvoice` (רישום GL: GRNI + מע"מ תשומות → זכות ספק), `recordVendorPayment` עם הקצאות מרובות (רישום GL: זכות ספק → מזומן) ועדכון paidTotal/status, ו-`getApAging` (גיול ה-AP). בוני שורות ה-GL נוספו ל-`ledger.ts`. migration `20260624130000_accounts_payable` הוחל. 964 בדיקות עוברות, typecheck+lint נקיים. **מגבלות/נותר:** הפרש מחיר רכש (PPV) מנוקה כיום לפי סכום החשבונית (אין עדיין חשבון PPV ייעודי); חשבוניות ללא PO (הוצאות תפעול) טרם מקבלות רישום GL; ניכוי מס במקור (FIN-TAX-004) — לפרוסה נפרדת. **הבא (Phase 1 המשך):** AR (חשבונית לקוח כמסמך + קבלות + גיול), valuation (FIFO/ממוצע) ו-period close.

**סטטוס יישום (Phase 1, פרוסה 2 — Accounts Receivable — 2026-06-24):** ✅ הונח מודול AR (OMS-004/005): מודלים `CustomerInvoice`/`CustomerInvoiceLine`/`CustomerReceipt`/`CustomerReceiptAllocation` + שירות [accounts-receivable.ts](../src/server/services/accounts-receivable.ts) — `createCustomerInvoice`, `issueCustomerInvoice` (רישום GL: לקוחות + הכנסה + מע"מ עסקאות, **עם guard למניעת כפל**: אם מכירת ההזמנה כבר נרשמה דרך `postOrderSaleToLedger` source "sale" — מסמך בלבד), `recordCustomerReceipt` עם הקצאות מרובות (רישום GL: מזומן ← לקוחות) ועדכון paidTotal/status, ו-`getArAging`. בונה שורות `buildCustomerReceiptJournalLines` ב-`ledger.ts`. migration `20260624140000_accounts_receivable` הוחל. 968 בדיקות עוברות, typecheck+lint נקיים. **הנחה לאימות רו"ח:** הכרת הכנסה ב-e-commerce prepaid נעשית כיום ב-capture (source "sale"); חשבונית הלקוח היא מסמך/אשראי. **CI:** כשל `cart.test.ts` ב-CI הוא pre-existing (קיים כבר ב-055bdd1, לפני העבודה) ו-env-specific (עובר מקומית) — לא רגרסיה, מתוקן בנפרד. **נותר ל-Phase 1:** valuation (FIFO/ממוצע), period close, ודיווח מע"מ.

**סטטוס יישום (Phase 1, פרוסה 3 — Inventory Valuation FIFO — 2026-06-24):** ✅ הונח מודל `ItemCostLayer` (append-only, שכבת עלות לכל קליטה) + שירות [inventory-valuation.ts](../src/server/services/inventory-valuation.ts): `valueFifoEndingInventory` (טהור — מעריך את היח' שביד מול השכבות החדשות; FIFO=ישן נמכר ראשון), `weightedAverageUnitCost`, ו-`getInventoryValuation` (read-only, ללא נגיעה בזרימות מכירה). שכבת עלות נוצרת אוטומטית בקליטת PO (`receivePurchaseOrder`). שווי המלאי מוצג במסך Finance (כרטיס "גיול AP/AR ושווי מלאי"). migration `20260624150000_item_cost_layer` הוחל. 973 בדיקות עוברות. **הערה:** COGS-per-sale מדויק (consumption של שכבות) נדחה — כרגע COGS עדיין estimate ב-`finance.estimateOrderCogs`; הערכת השווי FIFO היא snapshot read-only. **נותר ל-Phase 1:** period close, דיווח מע"מ, ניכוי מס במקור; וחיווט AP/AR/חשבוניות ל-UI.

**סטטוס יישום (Phase 2, פרוסה 1 — CRM Sales Pipeline — 2026-06-24):** ✅ נפתח Phase 2 (CRM עומק) עם צבר מכירות (CRM-SAL-001/003): מודלים `Lead` ו-`Opportunity` (שלבים QUALIFIED→PROPOSAL→NEGOTIATION→WON/LOST, הסתברות לפי שלב) + שירות [crm-sales.ts](../src/server/services/crm-sales.ts) — `createLead`, `convertLeadToOpportunity`, `setOpportunityStage`, ו-helpers טהורים `weightedPipelineValue`/`pipelineByStage`/`winRate` + `getSalesPipelineOverview`. **מוצג במסך CRM** (כרטיס "צבר מכירות" + טבלת שלבים). migration `20260624160000_crm_sales_pipeline` הוחל. 978 בדיקות עוברות, typecheck+lint נקיים. **נותר ב-Phase 2:** Quotes, marketing automation/journeys, service/SLA (cases), CDP/identity resolution, loyalty; ו-mutations של pipeline ב-UI (כרגע התצוגה read-only).

**סטטוס יישום (Phase 2, פרוסה 2 — Quotes — 2026-06-24):** ✅ הצעות מחיר (CRM-SAL-002): מודלים `Quote`/`QuoteLine` (DRAFT→SENT→ACCEPTED/DECLINED/EXPIRED) + שירות [crm-quotes.ts](../src/server/services/crm-quotes.ts) — `createQuote`, `sendQuote`, `decideQuote` (ACCEPTED מסמן את ה-Opportunity כ-WON), `convertQuoteToInvoice` (יוצר `CustomerInvoice` משורות ההצעה — מחבר CRM→AR), `expireStaleQuotes`, ו-helpers טהורים `computeQuoteTotals`/`isQuoteExpired`. migration `20260624170000_crm_quotes` הוחל. 983 בדיקות עוברות. שרשרת המכירה Lead→Opportunity→Quote→Invoice סגורה ברמת ה-backend. **נותר ב-Phase 2:** marketing automation/journeys, service/SLA (cases), CDP, loyalty; ו-mutations ל-UI (quotes/pipeline עדיין ללא מסכי יצירה/עריכה).

**סטטוס יישום (Phase 2, פרוסה 3 — Service SLA — 2026-06-24):** ✅ מנוע SLA (CRM-SVC-002) מעל `ServiceRequest`: נוספו שדות `priority`/`assignedAdminUserId`/`firstRespondedAt`/`resolvedAt` + שירות [service-sla.ts](../src/server/services/service-sla.ts) — יעדי תגובה/פתרון לפי priority (`SLA_TARGETS_HOURS`), helpers טהורים `computeSlaDeadlines`/`isFirstResponseBreached`/`isResolutionBreached`/`slaStatus`, ו-DB: `assignServiceRequest`/`setServicePriority`/`recordFirstResponse`/`resolveServiceRequest`/`getServiceSlaOverview`. **מוצג במסך שירות** (כרטיס SLA: פתוחות/חריגות/בסיכון/ממתינות למענה). migration `20260624180000_service_sla` הוחל. 994 בדיקות עוברות. **פישוט:** WAITING_FOR_CUSTOMER לא עוצר את השעון עדיין. **נותר ב-Phase 2:** marketing automation/journeys, CDP/identity resolution, loyalty; ו-mutations ל-UI לכל מודולי ה-CRM/finance.

**סטטוס יישום (Phase 2, פרוסה 4 — Dynamic Segmentation — 2026-06-25):** ✅ מנוע סגמנטציה דינמי (CRM-MKT-001): שירות [marketing-segments.ts](../src/server/services/marketing-segments.ts) שמפעיל את שדה ה-`rule Json?` הקיים ב-`CustomerSegment` (היה סטטי). `evaluateSegmentRule` (טהור, רקורסיבי: all/any/not + trait leaf עם gte/lte/gt/lt/eq/neq), `buildCustomerTraits` (ממפה `CustomerMetricSnapshot`→traits כולל recencyDays), ו-`recomputeSegmentMemberships` (מנהל רק memberships עם reason="rule_engine", אידמפוטנטי, לא נוגע בידניים/system). **ללא שינוי סכמה / migration** (השדה כבר היה קיים). 1000 בדיקות עוברות, typecheck+lint נקיים. **נותר ב-Phase 2:** journeys/automation (multi-step), consent/preference center, CDP/identity resolution, loyalty; ו-mutations ל-UI.

**סטטוס יישום (Phase 4, פרוסה 1 — דוחות כספיים — 2026-06-25):** ✅ FIN-RPT-001: שירות [financial-statements.ts](../src/server/services/financial-statements.ts) — `buildFinancialStatements` (טהור) גוזר רווח והפסד (הכנסות/הוצאות/רווח נקי) ומאזן (נכסים/התחייבויות/הון) מ-trial balance, עם זהות תקופה-לא-סגורה Assets = Liabilities + Equity + NetIncome ובדיקת איזון. **מוצג במסך Finance** (כרטיסי P&L + מאזן). real-time read-only. deployed c6ef540.

**סטטוס יישום (Phase 4, פרוסה 2 — Period Close — 2026-06-25):** ✅ סגירת תקופה (FIN-RPT-002): מודל `FiscalPeriod` (year/month ייחודי, OPEN|CLOSED, closingEntryId, closedAt/By) + שירות [period-close.ts](../src/server/services/period-close.ts) — `buildClosingEntryLines` (טהור: מאפס כל הכנסה/הוצאה ל-`RETAINED_EARNINGS` 3100, plug של רווח/הפסד נקי, מאוזן בהגדרה), `getPeriodCloseSummary`, ו-`closePeriod` (מפרסם תנועת סגירה מתוארכת ליום האחרון בחודש + נועל את התקופה; upsert של חשבון העודפים לריפוי-עצמי). נוסף guard `assertPostingPeriodOpen` ב-[ledger.ts](../src/server/services/ledger.ts) שדוחה רישום/היפוך המתוארך לתקופה סגורה (PRIN-003). נוסף `RETAINED_EARNINGS` ל-chart-of-accounts. **מוצג במסך Finance** (כרטיס "סגירת תקופה": תצוגת רווח נקי לסגירה + כפתור סגירה + טבלת תקופות). migration `20260625120000_fiscal_period` הוחל. 1013 בדיקות עוברות, typecheck+lint נקיים. **נותר ב-Phase 4:** multi-currency, bank reconciliation, ודיווח רשותי ישראלי (PCN874/מבנה אחיד/856) — **חסום עד אימות רו"ח**.

**סטטוס יישום (Phase 4, פרוסה 3 — Manual Journal Entry — 2026-06-25):** ✅ תנועת יומן ידנית (FIN-GL-001): שירות [manual-journal.ts](../src/server/services/manual-journal.ts) — `parseJournalLines` (טהור: "קוד חשבון | חובה | זכות" לכל שורה, ולידציה שצד אחד בלבד מאוכלס וחיובי), `postManualJournalEntry` (source "manual", עובר דרך `postJournalEntry` ולכן יורש אימות איזון INV-A ו-guard תקופה סגורה), `listLedgerAccounts`, `listRecentJournalEntries`. עד כה כל תנועות ה-GL נוצרו אוטומטית ממכירות/AP/AR — כעת אפשר לרשום הפרשות/התאמות/יתרות פתיחה/הון ידנית. **מוצג במסך Finance** (כרטיס "תנועת יומן ידנית": טופס + רשימת חשבונות זמינים + תנועות אחרונות). ללא שינוי סכמה. 1019 בדיקות עוברות, typecheck+lint נקיים.

**סטטוס יישום (Phase 4, פרוסה 4 — Cash Flow — 2026-06-25):** ✅ דוח תזרים מזומנים (FIN-RPT-001, שיטה ישירה) — משלים את שלישיית הדוחות (P&L/מאזן/תזרים): שירות [cash-flow.ts](../src/server/services/cash-flow.ts) — `classifyCashFlow` (טהור: מקור מוכר→קטגוריה; ידני/לא-מוכר נגזר מסוגי החשבונות הנגדיים — EQUITY→מימון, אחרת שוטף), `buildCashFlowStatement` (טהור: סכימה ל-OPERATING/INVESTING/FINANCING + שינוי נטו), ו-`getCashFlowStatement` (כל תנועת GL הנוגעת בחשבון מזומן 1000, ללא REVERSED). `netChange` שווה ליתרת המזומן המצטברת → מתאזן מול שורת המזומן במאזן. **מוצג במסך Finance** (כרטיס "תזרים מזומנים"). ללא שינוי סכמה. 1024 בדיקות עוברות. **מגבלה מודעת:** פעילות השקעה ריקה עד הוספת חשבונות רכוש קבוע (אין הבחנה כיום בין רכוש שוטף לקבוע ברמת ה-type). **נותר ב-Phase 4:** multi-currency, bank reconciliation; דיווח רשותי ישראלי **חסום עד אימות רו"ח**.

**סטטוס יישום (Phase 4, פרוסה 5 — Bank Reconciliation — 2026-06-25):** ✅ התאמת בנק: מודל `BankStatementLine` (amount חתום: +הפקדה/−משיכה, status UNMATCHED|MATCHED|IGNORED, `matchedJournalEntryId` ייחודי) + שירות [bank-reconciliation.ts](../src/server/services/bank-reconciliation.ts) — `parseBankStatementCsv` (טהור: "תאריך,תיאור,סכום,אסמכתא"; דילוג על header/ריקים), `matchStatementLines` (טהור, greedy: סכום זהה ± חלון תאריכים, הקרוב ביותר, כל תנועת GL פעם אחת), `summarizeReconciliation` (טהור), ו-DB: `importBankStatementLines`, `autoMatchBankStatement` (מתאים שורות מול תנועות מזומן ב-GL שטרם הותאמו), `ignoreBankStatementLine`, `getReconciliationOverview` (יתרת מזומן בספרים מול יתרת הדף + הפרש). **מוצג במסך Finance** (כרטיס "התאמת בנק": ייבוא CSV + התאמה אוטומטית + טבלת שורות + סיכום הפרש). migration `20260625130000_bank_statement_line`. 1029 בדיקות עוברות. **תיקון אגב:** דוח התזרים כלל בעבר `status != REVERSED` — תוקן לכלול את כל התנועות (מקור + היפוך מתאזנים), כדי ש-netChange יישאר שווה ליתרת המזומן. **נותר ב-Phase 4:** multi-currency; דיווח רשותי ישראלי **חסום**.

**סטטוס יישום (Phase 3, פרוסה 1 — Stock Transfers — 2026-06-25):** ✅ נפתח Phase 3 (WMS) עם העברות מלאי בין-סניפיות (INV-WMS): מודלים `StockTransfer`/`StockTransferLine` (DRAFT→COMPLETED/CANCELLED, FK לסניפי מקור/יעד) + שירות [stock-transfer.ts](../src/server/services/stock-transfer.ts) — `planStockTransfer` (טהור: זוגות תנועות out/−q ב-מקור, in/+q ב-יעד; ולידציית סניפים שונים וכמות חיובית שלמה), `parseTransferLines` (טהור: "מק\"ט | כמות"), ו-DB: `createStockTransfer` (טיוטה, רזולוציית SKU→variant), `completeStockTransfer` (אטומי: בדיקת זמינות במקור (quantity−reserved), עדכון `InventoryItem` בשני הסניפים, ושתי תנועות `InventoryLedger` בלתי-הפיכות transfer_out/transfer_in), `cancelStockTransfer`, `listStockTransfers`. **מוצג במסך ERP** (כרטיס "העברות מלאי": טופס יצירה + טבלה עם השלם/בטל לטיוטות). migration `20260625140000_stock_transfer`. 1035 בדיקות עוברות, typecheck+lint נקיים. **נותר ב-Phase 3:** bins/locations, cycle count, allocation/ATP, RMA/refunds, reorder מלא (G6).

**סטטוס יישום (Phase 3, פרוסה 2 — Cycle Count — 2026-06-25):** ✅ ספירת מלאי: מודלים `InventoryCount`/`InventoryCountLine` (DRAFT→COMPLETED/CANCELLED, `bookQty` נלכד בהשלמה) + שירות [cycle-count.ts](../src/server/services/cycle-count.ts) — `computeCountVariance`/`planCountAdjustments`/`parseCountLines` (טהורים), ו-DB: `createInventoryCount` (טיוטה, רזולוציית SKU), `completeInventoryCount` (אטומי: לוכד book qty, מגדיר `InventoryItem.quantity = countedQty`, ורושם `InventoryLedger` reason `cycle_count_adjustment` על ההפרש בלבד), `cancelInventoryCount`, `listInventoryCounts` (כולל הפרש נטו). **מוצג במסך ERP** (כרטיס "ספירת מלאי": טופס + טבלה עם השלם/בטל לטיוטות). migration `20260625150000_inventory_count`. 1039 בדיקות עוברות. **נותר ב-Phase 3:** bins/locations, allocation/ATP, RMA/refunds, reorder מלא (G6).

**סטטוס יישום (Phase 3, פרוסה 3 — Refund GL posting / RMA — 2026-06-25):** ✅ סגירת לולאת O2C בספרים: זרימת ההחזר הקיימת (`refundAdminOrder`) כבר השיבה מלאי (`return_restocked`) ועדכנה סטטוס הזמנה/תשלום — אך **לא הפכה את המכירה ב-GL**. נוסף `buildSalesReturnJournalLines` ב-[ledger.ts](../src/server/services/ledger.ts) (טהור, מראָה של `buildSaleJournalLines`: חיוב הכנסה+מע"מ עסקאות, זיכוי לקוחות בברוטו, החזרת מלאי מ-COGS) + `postOrderRefundToLedger` ב-[finance.ts](../src/server/services/finance.ts) (source `sales_return`, אידמפוטנטי per-order, נרשם רק אם המכירה הוכרה, מדלג בחן ללא chart). חוּוט אל תוך `refundAdminOrder` (best-effort בתוך ה-tx). **ללא שינוי סכמה.** 1041 בדיקות עוברות. **מגבלה מודעת:** הזיכוי הוא ברמת הזמנה מלאה (לא partial/line-level) — תואם את ה-refund הקיים. **נותר ב-Phase 3:** bins/locations, allocation/ATP, RMA partial, reorder מלא (G6).

**סטטוס יישום (Phase 3, פרוסה 4 — Allocation / ATP — 2026-06-25):** ✅ זמינות-להבטחה רשתית (INV-C/OMS): שירות [availability.ts](../src/server/services/availability.ts) — `computeNetworkAtp` (טהור: זמין=on-hand−reserved−safety לכל סניף, מסוכם לרשת + פירוק פר-סניף), `allocateDemand` (טהור: הקצאת ביקוש greedy מהסניף המלא ביותר, fulfilled/shortfall), ו-DB: `getVariantAvailability`/`getAvailabilityBySku` (כולל "מלאי נכנס" מהזמנות רכש פתוחות ORDERED/PARTIALLY_RECEIVED — מוצג בנפרד, לא נספר כזמין). **מוצג במסך ERP** (כרטיס "זמינות להבטחה (ATP)": חיפוש לפי מק"ט → ATP רשתי + on-hand/reserved/on-order + טבלת זמינות פר-סניף). ללא שינוי סכמה. 1044 בדיקות עוברות. **נותר ב-Phase 3:** bins/locations, RMA partial, reorder מלא (G6).

**סטטוס יישום (Phase 2, פרוסה 5 — Journeys / Automation — 2026-06-25):** ✅ מנוע אוטומציה רב-שלבי (CRM-MKT-002): מודלים `Journey`/`JourneyStep`/`JourneyEnrollment` (trigger segment_entered|manual, צעדים מסודרים עם delayHours ו-actionType, נמענים עם currentStepOrder/nextRunAt/status) + שירות [crm-journeys.ts](../src/server/services/crm-journeys.ts) — **מנוע תזמון טהור**: `computeNextRunAt` ו-`advanceEnrollment` (מקדם נמען בצעד בשל אחד, מחשב nextRunAt לצעד הבא או COMPLETED), ו-DB: `createJourney`/`addJourneyStep`/`activateJourney`/`archiveJourney`/`enrollSegmentMembers` (רושם חברי סגמנט שטרם רשומים)/`runJourneyTick` (מקדם נמענים בשלים, שולח `send_email` דרך ה-outbox עם idempotency `journey:{enrollmentId}:{step}`). מנצל את מנוע הסגמנטציה הקיים. **מוצג במסך CRM** (כרטיס "מסעות לקוח": צור מסע + הוסף צעד + הפעל + רשום סגמנט + ארכב + "הרץ tick"). migration `20260625160000_crm_journeys`. 1050 בדיקות עוברות. **פישוט מודע:** צעד אחד לכל tick לכל נמען (ריצות חוזרות/cron מקדמות הלאה). **נותר ב-Phase 2:** consent/preference center, CDP/identity resolution, loyalty.

**סטטוס יישום (Phase 2, פרוסה 6 — Consent / Preference Center — 2026-06-25):** ✅ מרכז הסכמות שיווק מאוחד (CRM-MKT-003): מודל `ConsentRecord` (append-only, פר לקוח+ערוץ EMAIL/SMS/PUSH/WHATSAPP, GRANTED|REVOKED, source/note) + שירות [consent.ts](../src/server/services/consent.ts) — `resolveConsent`/`isConsentGranted` (טהורים: הרשומה האחרונה לכל ערוץ קובעת, ברירת מחדל opt-out), ו-DB: `recordConsent`/`recordConsentByEmail`/`getCustomerConsent`/`isChannelAllowed`/`listRecentConsentRecords`. **חוּוט ל-`runJourneyTick`**: צעד `send_email` נשלח רק אם `isChannelAllowed(customerId, "EMAIL")` (כיבוד opt-in לפני שליחה). **מוצג במסך CRM** (כרטיס "מרכז הסכמות": רישום הסכמה לפי דוא"ל+ערוץ+סטטוס + טבלת שינויים אחרונים). migration `20260625170000_consent_record`. 1053 בדיקות עוברות. **נותר ב-Phase 2:** CDP/identity resolution, loyalty. **הערה:** הסכמות push קיימות עדיין נפרדות ב-`PushSubscription` (לא מאוחדו).

**סטטוס יישום (Phase 5, פרוסה 1 — Fixed Assets + Depreciation — 2026-06-25):** ✅ נפתח Phase 5 עם רכוש קבוע ופחת (FIN-FA): מודלים `FixedAsset`/`FixedAssetDepreciation` + שירות [fixed-assets.ts](../src/server/services/fixed-assets.ts) — `monthlyDepreciation`/`depreciationForPeriod`/`currentPeriod` (טהורים: קו-ישר, capped לרצפת ה-salvage ולתקופת stub אחרונה), ו-DB: `createFixedAsset` (היוון + רישום GL Dr רכוש קבוע / Cr מזומן, source `asset_acquisition`), `runDepreciation` (פחת חודשי לכל נכס פעיל, אידמפוטנטי per asset+period, Dr הוצאות פחת / Cr פחת נצבר source `depreciation`, סטטוס FULLY_DEPRECIATED בסיום), `getFixedAssetsSummary`/`listFixedAssets`. נוספו לתרשים החשבונות: `FIXED_ASSETS` 1500, `ACCUMULATED_DEPRECIATION` 1590 (contra-asset במודל normalSide DEBIT → מקטין נכסים נטו), `DEPRECIATION_EXPENSE` 5100. **בונוס:** עודכן `classifyCashFlow` כך ש-`asset_acquisition`/`asset_disposal` ממופים ל-INVESTING — **"פעילות השקעה" בדוח התזרים כבר אינה ריקה**. **מוצג במסך Finance** (כרטיס "רכוש קבוע ופחת": היוון נכס + הרץ פחת + סיכום עלות/פחת/NBV + טבלה). migration `20260625180000_fixed_assets`. 1060 בדיקות עוברות. **נותר ב-Phase 5:** גריעת נכס (disposal), HR/payroll, manufacturing.

**סטטוס יישום (Phase 2, פרוסה 7 — Loyalty — 2026-06-25):** ✅ תוכנית נאמנות (CRM-LOY): מודלים `LoyaltyAccount`/`LoyaltyTransaction` (לדג'ר נקודות append-only, יתרה+נקודות-חיים+דרגה) + שירות [loyalty.ts](../src/server/services/loyalty.ts) — `resolveTier` (טהור: ארד/כסף/זהב/פלטינה לפי ספים 0/500/1500/5000) ו-`pointsForAmount` (טהור: נקודה ל-10 ש"ח, floor), ו-DB: `earnPoints`/`redeemPoints`/`adjustPoints` (אטומי, נקודות-חיים עולות רק בצבירה, דרגה מתעדכנת), `applyLoyaltyByEmail`, `awardPointsForOrder` (אידמפוטנטי per-order), `getLoyaltySummary`/`listLoyaltyAccounts`. **מוצג במסך CRM** (כרטיס "מועדון לקוחות": צבירה/פדיון לפי דוא"ל + סיכום + טבלת מובילים). migration `20260625190000_loyalty`. 1063 בדיקות עוברות. **נותר ב-Phase 2:** CDP/identity resolution; חיווט `awardPointsForOrder` אוטומטי ל-capture.

**סטטוס יישום (Phase 5, פרוסה 2 — Asset Disposal — 2026-06-25):** ✅ גריעת/מימוש רכוש קבוע: `disposalResult` (טהור: NBV=עלות−פחת נצבר, רווח/הפסד=תמורה−NBV) + `disposeFixedAsset` ב-[fixed-assets.ts](../src/server/services/fixed-assets.ts) — רושם GL: Dr מזומן (תמורה) / Dr פחת נצבר / Cr רכוש קבוע (עלות) + plug רווח/הפסד לחשבון `DISPOSAL_GAIN_LOSS` (4900, REVENUE), source `asset_disposal` (→ INVESTING בתזרים), סטטוס DISPOSED. **מוצג במסך Finance** (טור מימוש בטבלת הנכסים). ללא migration נוסף.

**סטטוס יישום (Phase 5, פרוסה 3 — HR + Payroll — 2026-06-25):** ✅ נפתח HR: מודלים `Employee`/`PayrollRun`/`Payslip` + שירות [hr-payroll.ts](../src/server/services/hr-payroll.ts) — `computePayslip`/`summarizePayroll` (טהורים: ניכויי מס הכנסה+ב"ל בשיעורים להמחשה, נטו), ו-DB: `createEmployee`, `runPayroll` (תלוש לכל עובד פעיל + רישום GL Dr הוצאות שכר ברוטו / Cr מזומן נטו / Cr התחייבויות שכר, אידמפוטנטי per-period source `payroll`→OPERATING), `listEmployees`/`getPayrollSummary`. חשבונות חדשים: `SALARY_EXPENSE` 5200, `PAYROLL_LIABILITIES` 2200. **מוצג במסך Finance** (כרטיס "כוח אדם ושכר": קליטת עובד + הרץ שכר + סיכום + טבלה). migration `20260625200000_hr_payroll`. 1068 בדיקות עוברות. **מגבלה מודעת:** שכר מפושט (שיעורים שטוחים) — לא תחליף לחישוב שכר ישראלי סטטוטורי. **נותר ב-Phase 5:** manufacturing/BOM, HR עומק (חופשות/נוכחות).

**סטטוס יישום (Phase 4.U — Expense Management — 2026-06-25):** ✅ ניהול הוצאות עובד (EXP): מודל `ExpenseClaim` (SUBMITTED→APPROVED/REJECTED, קישור אופציונלי ל-Employee) + שירות [expense-management.ts](../src/server/services/expense-management.ts) — `summarizeExpenseClaims` (טהור), ו-DB: `createExpenseClaim`, `approveExpenseClaim` (רושם GL Dr הוצאות תפעוליות / Cr מזומן, source `expense`→OPERATING), `rejectExpenseClaim`, `listExpenseClaims`/`getExpenseSummary`. חשבון חדש: `GENERAL_EXPENSE` 5300. **מוצג במסך Finance** (כרטיס "ניהול הוצאות": הגשה + אישור/דחייה).

**סטטוס יישום (Phase 4.V — Budgeting / FP&A — 2026-06-25):** ✅ תקצוב מול ביצוע: מודל `BudgetLine` (תקציב per חשבון+תקופה, unique) + שירות [budgeting.ts](../src/server/services/budgeting.ts) — `computeBudgetVariance` (טהור: סטייה=ביצוע−תקציב + אחוז + סכומים), ו-DB: `setBudget` (upsert), `getBudgetVsActual` (תקציב מול ביצוע מה-trial balance לאותו חודש). **מוצג במסך Finance** (כרטיס "תקצוב מול ביצוע": הגדרת תקציב + טבלת סטיות לחודש הנוכחי). migration `20260625210000_expense_budget`. 1072 בדיקות עוברות, typecheck+lint נקיים.

**סטטוס יישום (Phase 5, פרוסה 4 — Manufacturing / BOM — 2026-06-25):** ✅ ייצור (PP): מודלים `BillOfMaterials`/`BomComponent`/`WorkOrder` + שירות [manufacturing.ts](../src/server/services/manufacturing.ts) — `explodeBom`/`computeFinishedUnitCost` (טהורים), ו-DB: `createBom` (רזולוציית SKU מוגמר+רכיבים), `createWorkOrder` (טיוטה), `completeWorkOrder` (אטומי: בדיקת זמינות רכיבים, צריכה — `InventoryLedger` reason `production_consume`, ייצור מוגמר — `production_output`, ויצירת `ItemCostLayer` למוגמר בעלות הרכיבים שנצרכו דרך `resolveUnitCost`), `cancelWorkOrder`, `listBoms`/`listWorkOrders`. שווי המלאי נשמר (עלות רכיבים נכנסת = עלות מוגמר יוצאת) ולכן אין צורך ב-JE. **מוצג במסך ERP** (כרטיס "ייצור": יצירת BOM + הוראת עבודה + טבלה עם השלם/בטל). migration `20260625220000_manufacturing`. 1076 בדיקות עוברות. **מגבלה מודעת:** עבודה/תקורה (labor/overhead) לא מהוונים עדיין לעלות המוגמר. **נותר ב-Phase 5:** HR עומק (חופשות/נוכחות), MRP/תכנון.

**סטטוס יישום (Phase 7, פרוסה 1 — Workspace: KNW + COM — 2026-06-25):** ✅ **נפתח Phase 7 ("לעולם לא לצאת")** עם מסך אדמין חדש `/admin/workspace` (נוסף לניווט + `AdminSection`). שני מודולים: **בסיס ידע (KNW)** — מודל `KnowledgeArticle` + [knowledge-base.ts](../src/server/services/knowledge-base.ts) (`slugify` Unicode-aware ששומר עברית, `searchArticles` — טהורים; create/publish/archive/list+search); **הודעות צוות / מרכז התראות (COM)** — מודל `Announcement` + [announcements.ts](../src/server/services/announcements.ts) (`activeAnnouncements` טהור: מסונן לפי פרסום/תפוגה, נעוצים ראשונים; create/pin/expire). **מסך Workspace** עם כרטיסי הודעות (פרסום + נעיצה/הסרה) ובסיס ידע (יצירה + חיפוש + פרסום/ארכוב). migration `20260625230000_workspace`. עודכן `qa-route-inventory` למסך החדש. 1083 בדיקות עוברות, typecheck+lint נקיים. **נותר ב-Phases 7–10:** WFL (workflow/no-code), RPT (report builder), DMS + e-signature, COM עומק (דוא"ל/צ'אט/טלפון), POS/LOG/MOB, ועוד §4.

**סטטוס יישום (Phase 7, פרוסה 2 — DMS + WFL — 2026-06-25):** ✅ במסך Workspace נוספו שני מודולים: **ניהול מסמכים + חתימה (DMS)** — מודל `Document` (קישור, קישור אופציונלי לישות, מחזור חתימה NONE→PENDING→SIGNED) + [document-management.ts](../src/server/services/document-management.ts) (`summarizeDocuments` טהור; create/requestSignature/sign/archive/list); **זרימת אישורים גנרית (WFL)** — מודל `ApprovalRequest` (כותרת/סכום/ישות, PENDING→APPROVED/REJECTED) + [approvals.ts](../src/server/services/approvals.ts) (`summarizeApprovals` טהור; create/decide/list). **מסך Workspace** עם כרטיסי מסמכים (בקש חתימה/חתום/ארכב) ובקשות אישור (אשר/דחה). migration `20260625240000_dms_approvals`. 1087 בדיקות עוברות. **מגבלה מודעת:** העלאת קבצים בפועל (Cloudinary) לא חוּוטה — מאוחסן URL; חתימה היא רישום סטטוס (לא e-signature קריפטוגרפי).

**סטטוס יישום (Phase 7, פרוסה 3 — CAL — 2026-06-25):** ✅ שיבוץ משאבים (CAL): מודלים `Resource`/`ResourceBooking` + שירות [resource-booking.ts](../src/server/services/resource-booking.ts) — `hasBookingConflict`/`assertValidWindow` (טהורים: חפיפה = start<end && end>start; חלונות נוגעים אינם מתנגשים), ו-DB: `createResource`, `createBooking` (דוחה חפיפות באטומיות), `cancelBooking`, `listResources`/`listUpcomingBookings`. **מוצג במסך Workspace** (כרטיס "שיבוץ משאבים": משאב + שיבוץ + טבלת שיבוצים קרובים). migration `20260625250000_resource_booking`.

**סטטוס יישום (Phase 2, פרוסה 8 — CDP / Identity Resolution — 2026-06-25):** ✅ זיהוי כפילויות לקוח (CDP): שירות [customer-identity.ts](../src/server/services/customer-identity.ts) — `normalizeEmail`/`normalizePhone`/`findDuplicateGroups` (טהורים: קיבוץ לפי דוא"ל/טלפון מנורמל, קבוצות בגודל ≥2), ו-`getDuplicateCustomerGroups`. **מוצג במסך CRM** (כרטיס "כפילויות לקוחות" — תצוגה בלבד, לאיחוד ידני, ללא שינוי נתונים). ללא שינוי סכמה. 1096 בדיקות עוברות, typecheck+lint נקיים. **מגבלה מודעת:** זיהוי בלבד — מיזוג פיזי (reassign FKs) לא בוצע (סיכון לאיחוד שגוי).

**סטטוס יישום (Phase 8, פרוסה 1 — POS + WAL — 2026-06-25):** ✅ **נפתח Phase 8 (קמעונאות)** עם מסך אדמין חדש `/admin/pos` (נוסף לניווט + qa-route). **שוברי מתנה / ארנק (WAL)** — מודלים `GiftCard`/`GiftCardTransaction` + חשבון `GIFT_CARD_LIABILITY` 2300 + [gift-card.ts](../src/server/services/gift-card.ts): `applyRedemption`/`splitRedemptionVat`/`summarizeGiftCards` (טהורים), `issueGiftCard` (Dr מזומן / Cr התחייבות שוברים, source `gift_card_issue`→OPERATING), `redeemGiftCard` (Dr התחייבות / Cr הכנסה + מע"מ, source `gift_card_redeem`, capped ליתרה). **משמרת קופה (POS)** — מודל `RegisterShift` + [pos-register.ts](../src/server/services/pos-register.ts): `computeShiftVariance` (טהור: צפוי=פותחת+מכירות מזומן, סטייה=ספירה−צפוי), `openShift`/`closeShift`/`listShifts`. **מסך POS** עם כרטיסי שוברים (הנפקה/פדיון) ומשמרת קופה (פתיחה/סגירה עם סטייה). migration `20260625260000_pos_giftcards`. 1102 בדיקות עוברות. **מגבלה מודעת:** POS אינו מחובר עדיין למכירה בפועל (מכירות-מזומן מוזנות ידנית בסגירה); פדיון שובר אינו מקושר להזמנה.

**סטטוס יישום (§4.W — Subscriptions — 2026-06-25):** ✅ מנויים וחיוב מתגלגל (SUB): מודלים `SubscriptionPlan`/`CustomerSubscription` + שירות [subscriptions.ts](../src/server/services/subscriptions.ts) — `computeNextBilling`/`isSubscriptionDue` (טהורים), `createPlan`/`subscribeCustomer`/`pause`/`cancel`, ו-`runSubscriptionBilling` (לכל מנוי פעיל שמועדו הגיע: יוצר ומנפיק חשבונית AR דרך `createCustomerInvoice`+`issueCustomerInvoice` → הכנסה ל-GL, ומקדם `nextBillingAt`), `getSubscriptionSummary` (MRR). **מוצג במסך Finance** (כרטיס "מנויים": תוכנית/צירוף/הרץ חיוב/ביטול). migration `20260625270000_subscriptions_pricing`.

**סטטוס יישום (§4.X — Pricing / CPQ — 2026-06-25):** ✅ חוקי תמחור והנחות (PRC): מודל `PriceRule` (PERCENT/FIXED, כמות מינימום) + שירות [pricing-rules.ts](../src/server/services/pricing-rules.ts) — `applyPriceRules` (טהור: בוחר את החוק הזכאי שנותן את הסכום הנמוך ביותר, לא יורד מ-0), `createPriceRule`/`setPriceRuleActive`/`listPriceRules`/`quotePrice`. **מוצג במסך CRM** (כרטיס "חוקי תמחור": יצירה + טבלה + הפעלה/השבתה). 1110 בדיקות עוברות, typecheck+lint נקיים. **מגבלה מודעת:** חוקי התמחור לא חוּוטו עדיין אוטומטית ל-Quotes/הזמנות (מנוע מוכן, applyPriceRules טהור ובדוק).

**סטטוס יישום (§4.Z — GRC — 2026-06-26):** ✅ ציות/סיכון/משימות רגולציה (GRC): מודל `ComplianceItem` (RISK/POLICY/AUDIT/TASK, חומרה LOW→CRITICAL, OPEN→IN_PROGRESS→RESOLVED/ACCEPTED, dueAt) + שירות [grc.ts](../src/server/services/grc.ts) — `isOverdue`/`summarizeCompliance` (טהורים: open vs resolved + חשיפת high/critical פתוחה), create/setStatus/list (עם דגל overdue)/summary. **מוצג במסך Workspace** (כרטיס "ציות וסיכון": יצירה + סגירה + דגלי איחור/חומרה).

**סטטוס יישום (§4.AA — Contracts / CLM — 2026-06-26):** ✅ ניהול מחזור חיים של חוזה (LGL): מודל `Contract` (DRAFT→ACTIVE→EXPIRED/TERMINATED, שווי, פקיעה, autoRenew) + שירות [contracts.ts](../src/server/services/contracts.ts) — `isExpiringSoon`/`summarizeContracts` (טהורים: פעילים + לקראת פקיעה ב-30 יום + שווי פעיל), create/setStatus/list (עם דגל expiringSoon)/summary. **מוצג במסך Workspace** (כרטיס "חוזים": יצירה + הפעלה/סיום + התראת פקיעה). migration `20260626100000_grc_contracts`. 1118 בדיקות עוברות, typecheck+lint נקיים.

**סטטוס יישום (§4.T — LOG / Shipping — 2026-06-26):** ✅ מובילים ותעריפי משלוח (LOG/TMS): מודלים `Carrier`/`ShippingRate` + שירות [shipping-rates.ts](../src/server/services/shipping-rates.ts) — `selectShippingRate` (טהור: התעריף הזול ביותר שמכסה אזור+משקל), create/list/`quoteShipping`. **מוצג במסך ERP** (כרטיס "מובילים ותעריפי משלוח"). migration `20260626110000_carriers_shipping`.

**סטטוס יישום (FIN — Chart of Accounts UI — 2026-06-26):** ✅ מסך ניהול תרשים חשבונות: שירות [chart-of-accounts.ts](../src/server/services/chart-of-accounts.ts) — `isValidAccountCode`/`deriveNormalSide` (טהורים), `createLedgerAccount` (ולידציה+ייחודיות+צד טבעי לפי סוג), `listAccountsWithBalances` (כל חשבון + יתרה חיה מ-trial balance). **מוצג במסך Finance** (כרטיס "תרשים חשבונות": אתחול ברירת מחדל + הוספת חשבון + טבלת יתרות). עד כה התרשים היה code-only; כעת ניתן לצפות ולהוסיף חשבונות מותאמים. 1124 בדיקות עוברות, typecheck+lint נקיים.

**סטטוס יישום (§4.AI + §4.AH — ITSM + Facilities — 2026-06-26):** ✅ מסך אדמין חדש `/admin/operations` ("תפעול", נוסף לניווט + qa-route) עם שלושה מודולי תפעול פנימי: **Help Desk IT** (`ITTicket`, OPEN→IN_PROGRESS→RESOLVED/CLOSED, עדיפות) + **מרשם נכסי IT** (`ITAsset`, IN_USE/IN_STORAGE/RETIRED) דרך [it-service.ts](../src/server/services/it-service.ts) (`summarizeTickets`/`summarizeAssets` טהורים), ו-**תחזוקת סניפים** (`FacilityRequest`, OPEN→SCHEDULED→DONE) דרך [facilities.ts](../src/server/services/facilities.ts) (`summarizeFacilityRequests` טהור). migration `20260626120000_itsm_facilities`. 1128 בדיקות עוברות, typecheck+lint נקיים.

**סטטוס יישום (§4.K — BI Executive Dashboard — 2026-06-26):** ✅ מסך אדמין חדש `/admin/bi` ("בינה עסקית", נוסף לניווט + qa-route): שירות [bi-metrics.ts](../src/server/services/bi-metrics.ts) — `buildExecutiveSummary` (טהור: גוזר הון חוזר, יחס שוטף, פוזיציית חוב נטו), ו-`getExecutiveDashboard` שמאחד KPIs מכל המודולים (דוחות כספיים, מזומן מהתאמת בנק, AR/AP aging, שווי מלאי FIFO, MRR ממנויים, חברי נאמנות, אישורים ממתינים) — resilient עם catch לכל מקור. **מסך BI** עם 8 כרטיסי KPI + כרטיס יחסים פיננסיים.

**סטטוס יישום (§4.AG — Recruiting (HRX) — 2026-06-26):** ✅ צנרת גיוס: מודלים `JobOpening`/`JobCandidate` + שירות [recruiting.ts](../src/server/services/recruiting.ts) — `nextStage` (טהור: APPLIED→SCREEN→INTERVIEW→OFFER→HIRED) ו-`summarizeCandidatesByStage` (טהור), create/advance/reject/list. **מוצג במסך Operations** (כרטיס "גיוס": משרות + מועמדים + קידום/דחייה). migration `20260626130000_recruiting`. 1133 בדיקות עוברות, typecheck+lint נקיים.

**סטטוס יישום (סגירת לולאות — Loyalty + POS — 2026-06-26):** ✅ במקום מודול חדש — **סגירת שתי לולאות פתוחות** שזוהו ב-§12 (PRIN-013 — "לעולם לא לצאת"): **(1) צבירת נאמנות אוטומטית** — `awardPointsForOrder` חוּוט ל-`recordPaymentCapturedSideEffects` ([payment-webhooks.ts](../src/server/services/payment-webhooks.ts)), כך שכל הזמנה משולמת צוברת נקודות (אידמפוטנטי, best-effort, מדלג על אורח) — לא עוד הזנה ידנית בלבד. **(2) מכירת POS אמיתית** — `recordPosSale` ([pos-register.ts](../src/server/services/pos-register.ts)) יוצרת `Order` במצב PAID, מנכה מלאי on-hand אטומית, כותבת `InventoryLedger` (`pos_sale`), לוכדת תשלום מזומן, ומשתמשת מחדש ב-`postOrderSaleToLedger`+`awardPointsForOrder` (אותו מקור מלאי/כספים כמו האתר — PRIN-001). ה-shift **גוזר** את מכירות המזומן מההזמנות המקושרות (`Order.registerShiftId` חדש) במקום מספר שמוקלד ידנית; הסגירה משווה ספירה מול צפוי גזור. **מסך POS**: כרטיס "מכירת קופה" + עמודת מכירות חיות לכל משמרת. migration `20260626150000_pos_sale_order_shift` הוחל. 1142 בדיקות עוברות, typecheck+lint נקיים. **נותר (תלוי החלטה):** חיווט `applyPriceRules` להזמנות (כלפי-חוץ), והכרעת D3 לפני בניית consumption של שכבות עלות.

---

## 13. מפת דרכים מדורגת (Phased Roadmap)

> כל phase עם **exit criteria** מחייב. לא עוברים phase בלי שכל ה-`[M]` שלו עומד ב-DoD.

**Phase 0 — תיקון נכונות + יסוד פיננסי (בסיס לכל השאר)**
G1–G7 + הקמת `LedgerAccount`/`JournalEntry`/`JournalLine` + מנוע מע"מ בסיסי (effective-dated).
*Exit:* קליטת PO מעדכנת מלאי+ledger; כל מכירה מייצרת רישום GL מאוזן; trial balance מאוזן; טסטים ירוקים.

**Phase 1 — Procure-to-Pay + AP/AR + Inventory posting מלא**
PO totals, 3-way match, vendor invoices, payment run + ניכוי מס, AR/customer invoices, valuation (FIFO/avg), landed cost.
*Exit:* sub-ledgers מתאזנים מול GL (INV-B); aging מדויק.

**Phase 2 — CRM עומק**
Sales pipeline, segmentation דינמי, journeys/automation, consent center, service/SLA, Customer 360 עקבי + scoring מתוקן.
*Exit:* G2/G3/G4 סגורים; semantic layer (BI-002) חי; SLA נמדד.

**Phase 3 — WMS + OMS omnichannel + Demand Planning**
Bins/transfers/cycle count, allocation/ATP, dropship מאוחד, RMA/refunds, reorder מלא (G6).
*Exit:* INV-C מתקיים בכל מחסן; OMS מנהל את כל הערוצים.

**Phase 4 — Finance close + דיווח רשותי ישראלי**
Period close, multi-currency, cash/bank reconciliation, cost accounting, חשבונית ישראל + מבנה אחיד + 856.
*Exit:* IL-001..IL-004 אומתו מול רו"ח; סגירת תקופה מלאה.

**Phase 5 — Manufacturing / Assets / HR (לפי צורך)**
BOM/MRP/work orders (אם רלוונטי), fixed assets + פחת, HR master + החלטת payroll.
*Exit:* פחת חודשי ל-GL; (manufacturing/payroll לפי החלטות סעיף 14).

**Phase 6 — AI Layer מלא**
Copilots פר-מודול, NL-query, predictions, Document-AI לחשבוניות, כולם מאחורי guardrails+audit.
*Exit:* AI-005 נאכף; שום פעולה אוטונומית על הספרים ללא אישור.

> **Phases 7–10 — "לעולם לא לצאת מהמערכת".** המודולים מ-§4+ נכנסים כאן, מקובצים לפי תלות. סדר ה-Phases הפנימי גמיש לפי כאב עסקי.

**Phase 7 — פלטפורמת Self-Sufficiency (התשתית שמייתרת כלים חיצוניים)**
Workflow/No-code (WFL), Report Builder + Spreadsheet (RPT), DMS + e-signature (DMS), Communications Hub (COM), מרכז התראות.
*Exit:* אפשר לבנות תהליך/טופס/דוח חדש בלי קוד; דוא"ל/צ'אט/טלפון בתוך המערכת; PRIN-013/014 נמדדים.

**Phase 8 — קמעונאות אומניצ'אנל ולוגיסטיקה**
POS + משמרת קופה (POS), TMS/משלוחים + מדבקות (LOG), אפליקציות ניידות (MOB), שוברים/ארנק (WAL), יומן/שיבוץ (CAL), Facilities (FAC).
*Exit:* מכירה בחנות עם מקור מלאי/כספים אחד; משלוח מקצה-לקצה; אפליקציית מחסן חיה.

**Phase 9 — עומק מסחרי וצמיחה**
Pricing & CPQ (PRC), Subscriptions + rev-rec (SUB), Digital Marketing (DMK), CMS/Storefront (CMS), פורטלים (POR), FP&A/Treasury (FPA), Expense (EXP).
*Exit:* כל פעילות שיווק/תמחור/תקצוב/מנויים מנוהלת בפנים; פורטלי לקוח/ספק חיים.

**Phase 10 — ממשל, ידע והרחבה ארגונית**
GRC + ESG (GRC), Legal/CLM (LGL), Knowledge/LMS (KNW), Multi-entity/Consolidation (ENT), iPaaS/EDI (IPL), HR עומק (HRX), ITSM (ITS).
*Exit:* DSAR אוטומטי; חוזים/ידע/ציות בפנים; מוכנות רב-ישותית.

---

## 14. החלטות פתוחות (Decision Log — דורש את החלטתך)

| # | החלטה | אופציות | המלצה |
|---|---|---|---|
| D1 | **Payroll** build vs buy | לבנות שכר ישראלי מלא / לאינטגרציה לספק שכר ישראלי | **Buy** — לוקליזציה רגולטורית כבדה ומשתנה |
| D2 | **Manufacturing depth** | מלא (BOM/MRP/QM) / קל (kitting/סטים בלבד) / לדלג | תלוי אם מייצרים/מרכיבים בפועל — כנראה **קל** |
| D3 | **Inventory valuation** | FIFO / Weighted-Average / Standard | **Weighted-Average** לקמעונאות, אלא אם רו"ח מנחה אחרת |
| D4 | **Period-1 priority** | פיננסי-first / CRM-first | **פיננסי-first** (Phase 0–1) — הוא מקור האמת |
| D5 | **AI autonomy** | המלצות בלבד / פעולה-עם-אישור / אוטונומי-מוגבל | **פעולה-עם-אישור**; אף פעם לא אוטונומי על ספרים |
| D6 | **דוחות רשותיים** | לבנות פנימי / לעבוד מול תוכנת הנה"ח מאושרת | לאמת מול רו"ח לפני Phase 4 |
| D7 | **טלפוניה/VoIP + WhatsApp** | לבנות / לאינטגרציה לספק (Twilio/ספק ישראלי) | **Integrate** — adapter, לא core |
| D8 | **רשתות חברתיות + Ads** | לבנות מנוע פרסום / לעטוף APIs (Meta/Google) | **Integrate** דרך IPL |
| D9 | **חומרת POS** | מסוף ייעודי / טאבלט + סורק + מדפסת | טאבלט + perifריאלים, לפי סניף |
| D10 | **תוקף חתימה דיגיטלית** | חתימה רגילה / מאובטחת / מאושרת (חוק חתימה אלקטרונית) | לאמת מול עו"ד לפי סוג מסמך |
| D11 | **עומק No-Code (WFL)** | workflow+fields בלבד / עד app-builder מלא | להתחיל מצומצם, להרחיב לפי שימוש |

---

## 15. נספחים

**A. מפתח חיוב:** `[M]` חובה · `[S]` רצוי · `[O]` אפשר.
**B. מילון מונחים:** GL (ספר ראשי) · AP (זכאים/ספקים) · AR (חייבים/לקוחות) · CoA (תרשים חשבונות) · WMS (ניהול מחסן) · OMS (ניהול הזמנות) · ATP (זמין-להבטחה) · BOM (עץ מוצר) · MRP (תכנון דרישות חומר) · SoD (הפרדת תפקידים) · CDP (פלטפורמת נתוני לקוח) · RMA (החזרה מורשית).
**C. אינדקס מודולים:**
*ליבה:* MDM · CRM(SAL/MKT/SVC/360/LOY) · P2P · INV · OMS · FIN(GL/TAX/AP/AR/CASH/CO/RPT/FA) · MFG · HR · PRJ · BI · AI.
*הרחבת "לעולם לא לצאת" (§4+):* POS · COM · DMS · WFL · RPT · DMK · CMS · LOG · EXP · FPA · SUB · PRC · POR · GRC · LGL · KNW · CAL · ENT · IPL · WAL · HRX · FAC · ITS · MOB.
**D. הערת אזהרה רגולטורית:** כל שיעור/סף/טופס בסעיפים FIN-TAX, IL ו-HR הוא לדוגמה ולאימות מול רו"ח/יועץ מס/רשות המסים לפני יישום. אין במסמך ייעוץ מס/משפטי.

---

*סוף המסמך — v0.1. עבור עליו, סמן ✅/✏️/❌/❓ לכל דרישה, ונעדכן לגרסה מחייבת v1.0.*
