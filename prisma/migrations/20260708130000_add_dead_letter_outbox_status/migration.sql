-- AlterEnum
-- ADR 0003/0007: an outbox event whose retry budget is exhausted stops retrying
-- and becomes DEAD_LETTER — a loud, terminal operational fact for the invariant
-- sweep instead of silent churn. Additive enum value; safe to apply forward-only.
ALTER TYPE "OutboxEventStatus" ADD VALUE 'DEAD_LETTER';
