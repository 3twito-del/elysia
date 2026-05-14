import { CalendarCheck, MapPin, MessageCircle, Phone } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { CatalogBranch } from "~/server/services/catalog";

export function BranchCard({ branch }: { branch: CatalogBranch }) {
  const appointmentHref = `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(
    `שלום, אשמח לתאם פגישה בסניף ${branch.name}`,
  )}`;

  return (
    <Card className="brand-branch-card brand-accent-card interactive-lift rounded-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-medium">{branch.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="text-muted-foreground grid gap-2.5 text-sm leading-6">
          <span className="flex items-center gap-2.5">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {branch.address}, {branch.city}
          </span>
          <span className="flex items-center gap-2.5">
            <Phone aria-hidden="true" className="size-4 shrink-0" />
            {branch.phone}
          </span>
        </div>
        <div className="grid gap-1.5 border-y border-[var(--glass-border)] py-4 text-sm leading-6">
          <span>א-ה: {branch.openingHours.sundayThursday}</span>
          <span>ו: {branch.openingHours.friday}</span>
          <span>ש: {branch.openingHours.saturday}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {branch.services.map((service) => (
            <Badge
              className="px-3 py-1 text-xs font-normal"
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
              <Phone aria-hidden="true" className="size-4" />
              חיוג
            </a>
          </Button>
          <Button asChild className="gap-2" variant="secondary">
            <a
              href={`https://wa.me/${branch.whatsapp}`}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              WhatsApp
            </a>
          </Button>
        </div>
        <Button asChild className="gap-2" variant="outline">
          <a href={appointmentHref} rel="noreferrer" target="_blank">
            <CalendarCheck aria-hidden="true" className="size-4" />
            תיאום פגישה
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
