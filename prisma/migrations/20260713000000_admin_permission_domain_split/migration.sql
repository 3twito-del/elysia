-- K-15 (docs/QA_EVIDENCE.md "k-02-role-permission-review"): a single
-- ERP_WRITE gated 12 unrelated admin domains, including money-moving
-- finance/payroll. Splits out a dedicated *_WRITE permission per domain
-- (matching the existing CATALOG_READ/WRITE, INVENTORY_READ/WRITE
-- pattern). `erp/actions.ts` (vendor portal, vendor invoices/payments,
-- stock transfers) keeps the existing ERP_WRITE unchanged — it's the one
-- domain that already matches that permission's name.

-- AlterEnum
ALTER TYPE "AdminPermission" ADD VALUE 'FINANCE_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'MARKETING_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'OPERATIONS_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'PERFORMANCE_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'POS_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'PROJECTS_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'REPORTS_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'WORKFLOW_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'WORKSPACE_WRITE';
