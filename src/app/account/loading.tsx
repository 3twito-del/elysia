import { CreditCard, Heart, MapPin, PackageCheck } from "lucide-react";

import { SiteHeader } from "~/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingState } from "~/components/ui/loading-state";
import { Skeleton } from "~/components/ui/skeleton";

const accountSections = [
  { icon: PackageCheck, label: "הזמנות" },
  { icon: Heart, label: "מועדפים" },
  { icon: MapPin, label: "כתובות" },
  { icon: CreditCard, label: "פרטיות" },
] as const;

export default function AccountLoading() {
  return (
    <main>
      <SiteHeader />
      <section
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
        dir="rtl"
      >
        <LoadingState label="אזור הלקוח מתעדכן" variant="plain" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {accountSections.map(({ icon: Icon, label }) => (
            <Card className="rounded-md" key={label}>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">{label}</CardTitle>
                <Icon
                  aria-hidden="true"
                  className="text-muted-foreground size-5"
                />
              </CardHeader>
              <CardContent className="grid gap-3">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card className="rounded-md" key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="grid gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
