import { CalendarCheck, MapPin, MessageCircle, Phone } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Branch } from "~/lib/catalog";

export function BranchCard({ branch }: { branch: Branch }) {
  return (
    <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">{branch.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-muted-foreground grid gap-2 text-sm">
          <span className="flex items-center gap-2">
            <MapPin className="size-4" />
            {branch.address}, {branch.city}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="size-4" />
            {branch.phone}
          </span>
        </div>
        <div className="grid gap-1 text-sm">
          <span>א-ה: {branch.openingHours.sundayThursday}</span>
          <span>ו: {branch.openingHours.friday}</span>
          <span>ש: {branch.openingHours.saturday}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {branch.services.map((service) => (
            <Badge key={service} variant="secondary">
              {service}
            </Badge>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="gap-2">
            <a href={`tel:${branch.phone}`}>
              <Phone className="size-4" />
              חיוג
            </a>
          </Button>
          <Button asChild className="gap-2" variant="outline">
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
        <Button className="gap-2">
          <CalendarCheck className="size-4" />
          תיאום פגישה
        </Button>
      </CardContent>
    </Card>
  );
}
