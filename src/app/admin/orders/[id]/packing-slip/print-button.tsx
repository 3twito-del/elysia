"use client";

import { Printer } from "lucide-react";

import { Button } from "~/components/ui/button";

/** Triggers the browser print dialog for the packing slip. */
export function PrintButton() {
  return (
    <Button
      className="gap-2 print:hidden"
      onClick={() => window.print()}
      size="sm"
      type="button"
      variant="outline"
    >
      <Printer aria-hidden="true" className="size-4" />
      הדפס
    </Button>
  );
}
