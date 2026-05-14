import { PlugZap, ShieldAlert } from "lucide-react";

import { adminLogoutAction } from "~/app/admin/actions";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function AdminForbidden({
  detail,
  title,
}: {
  detail: string;
  title: string;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6" dir="rtl">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert aria-hidden="true" className="size-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground grid gap-4 leading-7">
          <p>{detail}</p>
          <form action={adminLogoutAction}>
            <Button type="submit" variant="outline">
              מעבר להתחברות מחדש
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export function AdminDatabaseFallback() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6" dir="rtl">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlugZap aria-hidden="true" className="size-5" />
            נדרש חיבור מסד נתונים תקין
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground leading-7">
          מסכי התפעול קוראים הזמנות, מלאי, לקוחות ואירועים מתוך Prisma. הגדירו
          `DATABASE_URL` תקין והריצו seed/migration לפני בדיקת סביבת האדמין.
        </CardContent>
      </Card>
    </main>
  );
}
