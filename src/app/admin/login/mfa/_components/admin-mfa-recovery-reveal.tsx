"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import { adminMfaFinalizeAction } from "../actions";
import { Button } from "~/components/ui/button";

type AdminMfaRecoveryRevealProps = {
  codes: string[];
  next: string;
};

export function AdminMfaRecoveryReveal({
  codes,
  next,
}: AdminMfaRecoveryRevealProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={adminMfaFinalizeAction} className="grid gap-5">
      <input name="next" type="hidden" value={next} />
      <div className="grid gap-3">
        <p className="text-sm leading-6">
          קודי גיבוי חד-פעמיים אלו מאפשרים כניסה במקרה של אובדן גישה
          לאפליקציית האימות. הם יוצגו כעת בפעם היחידה — יש לשמור אותם במקום
          בטוח.
        </p>
        <ul
          className="elysia-inset glass-inset grid grid-cols-2 gap-2 rounded-md border p-3 font-mono text-sm"
          dir="ltr"
        >
          {codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          required
          type="checkbox"
        />
        שמרתי את קודי הגיבוי במקום בטוח
      </label>
      <ContinueButton disabled={!confirmed} />
    </form>
  );
}

function ContinueButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full gap-2"
      disabled={disabled || pending}
      size="lg"
      type="submit"
    >
      <CheckCircle2 aria-hidden="true" className="size-4" />
      המשך לניהול
    </Button>
  );
}
