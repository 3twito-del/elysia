import type { LucideIcon } from "lucide-react";

import { TableCell, TableRow } from "~/components/ui/table";

type TableEmptyRowProps = {
  colSpan: number;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function TableEmptyRow({
  colSpan,
  description,
  icon: Icon,
  title,
}: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell className="py-10 text-center" colSpan={colSpan}>
        <div className="mx-auto grid max-w-sm place-items-center gap-2">
          <span className="grid size-10 place-items-center border-b border-[var(--brand-aqua)]">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-sm leading-6">
            {description}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}
