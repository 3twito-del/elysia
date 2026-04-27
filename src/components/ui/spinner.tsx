import { cn } from "~/lib/utils";
import { AphroditeIcon } from "~/components/icon";

function Spinner({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof AphroditeIcon>, "name">) {
  return (
    <AphroditeIcon
      className={cn("size-4 animate-spin", className)}
      label="Loading"
      name="loader"
      role="status"
      {...props}
    />
  );
}

export { Spinner };
