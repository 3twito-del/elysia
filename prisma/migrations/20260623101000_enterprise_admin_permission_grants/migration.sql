-- Grant enterprise analytics, CRM, ERP, and finance permissions to existing system roles after enum values commit.
UPDATE "Role"
SET "permissions" = (
    SELECT ARRAY_AGG(DISTINCT role_permission.permission)
    FROM unnest(
        "permissions" || ARRAY[
            'ANALYTICS_READ'::"AdminPermission",
            'CRM_READ'::"AdminPermission",
            'CRM_WRITE'::"AdminPermission",
            'ERP_READ'::"AdminPermission",
            'ERP_WRITE'::"AdminPermission",
            'FINANCE_READ'::"AdminPermission"
        ]
    ) AS role_permission(permission)
)
WHERE "permissions" @> ARRAY['SYSTEM'::"AdminPermission"];
