import {
  Boxes,
  CalendarClock,
  ClipboardList,
  PackageCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingState } from "~/components/ui/loading-state";
import { Skeleton } from "~/components/ui/skeleton";

const metrics = [
  { icon: PackageCheck, label: "מוצרים" },
  { icon: Boxes, label: "מלאי" },
  { icon: ClipboardList, label: "הזמנות" },
  { icon: CalendarClock, label: "עבודות" },
] as const;

export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6" dir="rtl">
      <LoadingState label="מסך הניהול מתעדכן" variant="plain" />
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ icon: Icon, label }) => (
          <Card className="rounded-md" key={label}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">{label}</CardTitle>
              <Icon
                aria-hidden="true"
                className="text-muted-foreground size-5"
              />
            </CardHeader>
            <CardContent className="grid gap-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-md">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="h-12 w-full" key={index} />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
