export const legalPlaceholder = "[להשלמה]";

export const legalSafetySentence =
  "אין באמור כדי לגרוע מזכויות הצרכן לפי כל דין.";

export const termsSafetySentence =
  "אין בתנאי שימוש אלה כדי לגרוע מזכויות המשתמש או הצרכן לפי כל דין.";

export const productVisualDisclaimer =
  "ייתכנו הבדלי גוון קלים בין התמונה לבין המוצר בפועל עקב תאורה, צילום והבדלי תצוגה בין מסכים.";

export const productSensitivityDisclaimer =
  "במקרה של רגישות ידועה למתכות, מומלץ לבדוק את מפרט החומר לפני הרכישה. אין לראות במוצר כהיפואלרגני אלא אם צוין כך במפורש.";

export const newsletterConsentText =
  "אני מאשר/ת קבלת עדכונים ודיוור שיווקי מ-Elysia. ניתן להסיר את ההרשמה בכל עת.";

export const checkoutLegalAgreementText =
  "קראתי ואני מסכים/ה לתקנון האתר, למדיניות הפרטיות ולמדיניות המשלוחים, הביטולים וההחזרות.";

export const vatIncludedNotice = "המחירים כוללים מע״מ ככל שחל לפי דין.";

// TODO: Replace business legal placeholders with verified business details before production.
export const businessLegalPlaceholders = [
  { label: "שם משפטי של העסק", value: legalPlaceholder },
  { label: "עוסק מורשה / ח.פ", value: legalPlaceholder },
  { label: "כתובת למשלוח הודעות", value: legalPlaceholder },
  { label: "טלפון שירות", value: legalPlaceholder },
  { label: "אימייל שירות", value: legalPlaceholder },
  { label: "שעות פעילות", value: legalPlaceholder },
] as const;

export const footerBusinessDetails =
  "מופעל על ידי: [שם משפטי להשלמה] | ע.מ/ח.פ: [להשלמה]";

export const privacyProviderPlaceholders = [
  { label: "שם משפטי של בעל השליטה במידע", value: legalPlaceholder },
  { label: "אימייל לפניות פרטיות", value: legalPlaceholder },
  { label: "ספק אחסון", value: legalPlaceholder },
  { label: "ספק סליקה", value: legalPlaceholder },
  { label: "ספק אנליטיקה", value: legalPlaceholder },
  { label: "ספק דיוור", value: legalPlaceholder },
] as const;

export const privacySensitiveInfoWarning =
  "אין לצרף לפנייה מידע רגיש שאינו נדרש לטיפול בבקשה.";

export const accessibilityPlaceholders = [
  { label: "רכז/ת נגישות", value: legalPlaceholder },
  { label: "אימייל", value: legalPlaceholder },
  { label: "טלפון", value: legalPlaceholder },
  { label: "תאריך בדיקה אחרונה", value: legalPlaceholder },
  { label: "מגבלות ידועות", value: "[להשלמה / לא ידועות]" },
  { label: "זמן מענה לפניות נגישות", value: legalPlaceholder },
] as const;

export const policyLinks = [
  { href: "/terms", label: "תקנון האתר" },
  { href: "/privacy", label: "פרטיות" },
  { href: "/accessibility", label: "נגישות" },
  {
    href: "/shipping-returns",
    label: "משלוחים, ביטולים והחזרות",
  },
  { href: "/warranty", label: "אחריות" },
  { href: "/jewellery-care", label: "טיפול בתכשיטים" },
] as const;

export const cookiePreferencesLink = {
  href: "/privacy#cookie-preferences",
  label: "ניהול העדפות פרטיות",
} as const;

export const orderLegalLinks = [
  { href: "/shipping-returns", label: "ביטולים והחזרות" },
  { href: "/warranty", label: "אחריות" },
  { href: "/terms", label: "תקנון" },
  { href: "/privacy", label: "פרטיות" },
] as const;
