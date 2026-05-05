export function CheckoutStepBadge({ value }: { value: string }) {
  return (
    <span className="glass-inset grid size-7 place-items-center rounded-full border text-xs font-semibold">
      {value}
    </span>
  );
}
