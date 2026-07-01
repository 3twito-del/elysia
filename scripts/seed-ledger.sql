-- Idempotent seed of the default chart of accounts (FIN-GL-001).
-- Mirrors DEFAULT_CHART_OF_ACCOUNTS in src/server/services/ledger-accounts.ts.
INSERT INTO "LedgerAccount" ("id", "code", "name", "type", "normalSide", "isActive", "updatedAt")
VALUES
  (gen_random_uuid()::text, '1000', 'מזומן ובנקים',                    'ASSET',     'DEBIT',  true, now()),
  (gen_random_uuid()::text, '1100', 'לקוחות (חייבים)',                 'ASSET',     'DEBIT',  true, now()),
  (gen_random_uuid()::text, '1300', 'מלאי',                            'ASSET',     'DEBIT',  true, now()),
  (gen_random_uuid()::text, '1400', 'מע"מ תשומות',                     'ASSET',     'DEBIT',  true, now()),
  (gen_random_uuid()::text, '2000', 'ספקים (זכאים)',                   'LIABILITY', 'CREDIT', true, now()),
  (gen_random_uuid()::text, '2050', 'התחייבות לסחורה שהתקבלה (GRNI)',  'LIABILITY', 'CREDIT', true, now()),
  (gen_random_uuid()::text, '2060', 'סליקת עלויות נלוות',              'LIABILITY', 'CREDIT', true, now()),
  (gen_random_uuid()::text, '2100', 'מע"מ עסקאות',                     'LIABILITY', 'CREDIT', true, now()),
  (gen_random_uuid()::text, '3000', 'הון',                             'EQUITY',    'CREDIT', true, now()),
  (gen_random_uuid()::text, '4000', 'הכנסות ממכירות',                  'REVENUE',   'CREDIT', true, now()),
  (gen_random_uuid()::text, '5000', 'עלות המכר',                       'EXPENSE',   'DEBIT',  true, now())
ON CONFLICT ("code") DO NOTHING;
