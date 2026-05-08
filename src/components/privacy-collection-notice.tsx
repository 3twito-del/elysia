import Link from "next/link";

import { cn } from "~/lib/utils";

type PrivacyNoticeVariant =
  | "account"
  | "appointment"
  | "checkout"
  | "login"
  | "ai";

const notices = {
  account:
    "הפרטים באזור הלקוח נמסרים מרצונך לצורך ניהול חשבון, משלוחים, בקשות שירות, החזרות ועמידה בדין. אם לא יימסרו פרטי חובה, לא נוכל להשלים את הפעולה המבוקשת.",
  appointment:
    "מסירת הפרטים תלויה ברצונך ובהסכמתך. ללא שם וטלפון לא נוכל לתאם את הפגישה. הפרטים ישמשו לתיאום, שירות לקוחות, אבטחה ועמידה בדין, ויימסרו לספקי תשתית, דוא״ל או SMS לפי הצורך.",
  checkout:
    "מסירת הפרטים תלויה ברצונך ובהסכמתך. ללא שם, טלפון, אימייל וכתובת משלוח ככל שנבחר משלוח, לא נוכל לשמור או לתאם את ההזמנה. הפרטים ישמשו לאימות, שירות, אספקה, מניעת הונאות ועמידה בדין, ויימסרו לספקי סליקה, שילוח, דוא״ל, SMS ותשתית לפי הצורך.",
  login:
    "האימייל או הטלפון נמסרים מרצונך לצורך שליחת קוד כניסה, זיהוי חשבון, אבטחה ומניעת שימוש לרעה. ללא פרט זיהוי תקין לא נוכל להכניס אותך לאזור הלקוח.",
  ai: "המידע שתזינו לכלי ה-AI נמסר מרצונכם וישמש ליצירת המלצות, אבטחה, שיפור השירות ותיעוד תפעולי. אין להזין מידע רגיש שאינו דרוש לבחירת תכשיט. חלק מהעיבוד עשוי להתבצע באמצעות ספקי AI ותשתית מחוץ לישראל.",
} satisfies Record<PrivacyNoticeVariant, string>;

export function PrivacyCollectionNotice({
  className,
  variant,
}: {
  className?: string;
  variant: PrivacyNoticeVariant;
}) {
  return (
    <p className={cn("text-muted-foreground text-xs leading-6", className)}>
      {notices[variant]} זכויות עיון ותיקון מפורטות{" "}
      <Link
        className="text-foreground underline underline-offset-4"
        href="/privacy"
      >
        במדיניות הפרטיות
      </Link>
      .
    </p>
  );
}
