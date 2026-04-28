import { CalendarCheck, Heart, PackageCheck, Ruler } from "lucide-react";

import { MetricCard } from "~/components/metric-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const metadata = {
  title: "אזור לקוח",
};

export default function AccountPage() {
  return (
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-semibold">אזור לקוח</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
          צפייה בהזמנות, Wishlist, מידות, כתובות ותורים תיפתח לאחר חיבור מנגנון
          OTP ללקוחות. כניסת אדמין מתבצעת במסלול נפרד ומוגן בסיסמה.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-[420px_1fr]">
          <Card className="rounded-md">
            <CardHeader className="border-b border-[var(--glass-border)] pb-4">
              <CardTitle>כניסת לקוח</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Label htmlFor="identifier">אימייל או טלפון</Label>
                <Input
                  disabled
                  id="identifier"
                  placeholder="name@example.com או 050..."
                />
              </div>
              <Button className="w-full" disabled variant="secondary">
                מנגנון OTP בהכנה
              </Button>
              <p className="text-muted-foreground text-xs leading-6">
                אין יותר קוד ברירת מחדל לכניסה. הפעלת לקוחות תדרוש OTP אמיתי או
                מנגנון מאובטח אחר לפני פתיחה לציבור.
              </p>
            </CardContent>
          </Card>
          <RevealGrid className="grid gap-5 sm:grid-cols-2">
            <MetricCard
              detail="סטטוס, חשבוניות והחזרות"
              icon={PackageCheck}
              label="הזמנות"
              variant="soft"
              value="0"
            />
            <MetricCard
              detail="מוצרים שמורים לקנייה"
              icon={Heart}
              label="Wishlist"
              variant="soft"
              value="0"
            />
            <MetricCard
              detail="טבעות, שרשראות וצמידים"
              icon={Ruler}
              label="מידות"
              variant="soft"
              value="פרופיל"
            />
            <MetricCard
              detail="מדידה וייעוץ בסניף"
              icon={CalendarCheck}
              label="תורים"
              variant="soft"
              value="בתיאום"
            />
          </RevealGrid>
        </div>
      </RevealSection>
    </main>
  );
}
