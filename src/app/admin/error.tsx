"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6"
      dir="rtl"
    >
      <Card className="w-full rounded-md">
        <CardContent className="p-4 sm:p-6">
          <EmptyState
            actions={
              <Button className="gap-2" onClick={reset} type="button">
                <RefreshCw aria-hidden="true" className="size-4" />
                ניסיון חוזר
              </Button>
            }
            description="מסך הניהול אינו זמין כרגע. הפעולה לא בוצעה, ואפשר לנסות שוב."
            icon={AlertTriangle}
            testId="admin-error-boundary"
            title="מסך הניהול אינו זמין"
            variant="inset"
          />
        </CardContent>
      </Card>
    </main>
  );
}
