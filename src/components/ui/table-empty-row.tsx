import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { TableCell, TableRow } from "~/components/ui/table";

type TableEmptyRowProps = {
  action?: ReactNode;
  colSpan: number;
  description: string;
  icon: LucideIcon;
  title: string;
};

export function TableEmptyRow({
  action,
  colSpan,
  description,
  icon: Icon,
  title,
}: TableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell className="py-10 text-center" colSpan={colSpan}>
        <div className="mx-auto grid max-w-sm place-items-center gap-2">
          <span className="glass-inset grid size-10 place-items-center rounded-md border">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-sm leading-6">
            {description}
          </p>
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
