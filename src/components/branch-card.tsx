import { AphroditeIcon } from "~/components/icon";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Branch } from "~/lib/catalog";

export function BranchCard({ branch }: { branch: Branch }) {
  const appointmentHref = `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(
    `שלום, אשמח לתאם פגישה בסניף ${branch.name}`,
  )}`;

  return (
    <Card className="rounded-md border-black/10 bg-white/50 shadow-none ring-1 ring-black/[0.03] backdrop-blur transition-colors hover:bg-white/65">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-medium">{branch.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="text-muted-foreground grid gap-2.5 text-sm leading-6">
          <span className="flex items-center gap-2.5">
            <AphroditeIcon name="mapPin" className="size-5 shrink-0" />
            {branch.address}, {branch.city}
          </span>
          <span className="flex items-center gap-2.5">
            <AphroditeIcon name="phone" className="size-5 shrink-0" />
            {branch.phone}
          </span>
        </div>
        <div className="grid gap-1.5 border-y border-black/10 py-4 text-sm leading-6">
          <span>א-ה: {branch.openingHours.sundayThursday}</span>
          <span>ו: {branch.openingHours.friday}</span>
          <span>ש: {branch.openingHours.saturday}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {branch.services.map((service) => (
            <Badge
              className="bg-white/55 px-3 py-1 text-xs font-normal"
              key={service}
              variant="outline"
            >
              {service}
            </Badge>
          ))}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button asChild className="gap-2" variant="outline">
            <a href={`tel:${branch.phone}`}>
              <AphroditeIcon name="phone" className="size-5" />
              חיוג
            </a>
          </Button>
          <Button asChild className="gap-2" variant="secondary">
            <a
              href={`https://wa.me/${branch.whatsapp}`}
              rel="noreferrer"
              target="_blank"
            >
              <AphroditeIcon name="chatCircle" className="size-5" />
              WhatsApp
            </a>
          </Button>
        </div>
        <Button asChild className="gap-2" variant="outline">
          <a href={appointmentHref} rel="noreferrer" target="_blank">
            <AphroditeIcon name="calendarCheck" className="size-5" />
            תיאום פגישה
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
