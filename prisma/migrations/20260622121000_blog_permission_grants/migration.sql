-- Grant blog permissions to existing system roles after the enum values commit.
UPDATE "Role"
SET "permissions" = (
    SELECT ARRAY_AGG(DISTINCT role_permission.permission)
    FROM unnest(
        "permissions" || ARRAY[
            'BLOG'::"AdminPermission",
            'BLOG_READ'::"AdminPermission",
            'BLOG_WRITE'::"AdminPermission"
        ]
    ) AS role_permission(permission)
)
WHERE "permissions" @> ARRAY['SYSTEM'::"AdminPermission"];
