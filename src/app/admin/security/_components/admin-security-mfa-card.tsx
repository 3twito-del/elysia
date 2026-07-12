"use client";

import { useState } from "react";
import { KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";

import {
  AdminMutationStatus,
  type AdminMutationFeedback,
} from "../../_components/admin-mutation-status";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { formatHebrewDateTime } from "~/lib/format";
import { api } from "~/trpc/react";

export function AdminSecurityMfaCard() {
  const status = api.admin.mfaStatus.useQuery();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [revealedCodes, setRevealedCodes] = useState<string[] | null>(null);
  const regenerate = api.admin.regenerateOwnRecoveryCodes.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: (result) => {
      if (result.ok) {
        setRevealedCodes(result.recoveryCodes);
      } else {
        setFeedback({
          message: "יש להשלים תחילה הפעלת אימות דו-שלבי.",
          tone: "error",
        });
      }
    },
  });

  return (
    <>
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-5" />
            אימות דו-שלבי (TOTP)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {status.isPending ? (
            <p className="text-muted-foreground text-sm">טוען...</p>
          ) : status.data?.enabled ? (
            <p className="text-sm leading-6">
              אימות דו-שלבי פעיל
              {status.data.enrolledAt
                ? ` מאז ${formatHebrewDateTime(status.data.enrolledAt)}.`
                : "."}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm leading-6">
              אימות דו-שלבי מופעל בכניסה הבאה לניהול (חובה לכל אדמין).
            </p>
          )}

          {status.data?.enabled ? (
            <div className="grid gap-2">
              <Button
                className="w-fit gap-2"
                disabled={regenerate.isPending}
                onClick={() => regenerate.mutate()}
                type="button"
                variant="outline"
              >
                <RefreshCcw aria-hidden="true" className="size-4" />
                יצירת קודי גיבוי חדשים
              </Button>
              <p className="text-muted-foreground text-xs">
                יצירת קודים חדשים מבטלת את כל קודי הגיבוי הקודמים שלא נוצלו.
              </p>
              <AdminMutationStatus feedback={feedback} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setRevealedCodes(null);
        }}
        open={Boolean(revealedCodes)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound aria-hidden="true" className="size-4" />
              קודי גיבוי חדשים
            </DialogTitle>
            <DialogDescription>
              הקודים הקודמים בוטלו. יש לשמור קודים אלו במקום בטוח — הם יוצגו
              כעת בפעם היחידה.
            </DialogDescription>
          </DialogHeader>
          <ul
            className="elysia-inset glass-inset grid grid-cols-2 gap-2 rounded-md border p-3 font-mono text-sm"
            dir="ltr"
          >
            {revealedCodes?.map((code) => <li key={code}>{code}</li>)}
          </ul>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
