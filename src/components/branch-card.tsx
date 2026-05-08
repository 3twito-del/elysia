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
    <Card className="commerce-command maison-frame interactive-lift overflow-hidden rounded-md py-0">
      <CardHeader className="border-b border-[var(--glass-border)] bg-[linear-gradient(135deg,var(--luxury-accent-soft),transparent_56%)] p-5 pb-4">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-2xl font-medium">
          <span>{branch.name}</span>
          <Badge
            className="[border-color:var(--luxury-accent-border)] px-3 py-1 font-normal"
            variant="outline"
          >
            {branch.city}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 p-5">
        <div className="text-muted-foreground grid gap-2.5 text-sm leading-6">
          <span className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0" />
            {branch.address}, {branch.city}
          </span>
          <span className="flex items-center gap-2.5">
            <Phone className="size-4 shrink-0" />
            {branch.phone}
          </span>
        </div>
        <div className="glass-inset grid gap-1.5 rounded-md border px-4 py-3 text-sm leading-6">
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
              <Phone className="size-4" />
              חיוג
            </a>
          </Button>
          <Button asChild className="gap-2" variant="secondary">
            <a
              href={`https://wa.me/${branch.whatsapp}`}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        </div>
        <Button asChild className="gap-2">
          <a href={appointmentHref} rel="noreferrer" target="_blank">
            <CalendarCheck className="size-4" />
            תיאום פגישה
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
