import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { notFoundJson, unauthorizedJson } from "~/server/http/api-response";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.adminUserId) {
    return unauthorizedJson("Unauthorized.");
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
    include: {
      addresses: true,
      appointments: true,
      carts: { include: { items: true } },
      giftProfiles: true,
      orders: {
        include: {
          items: true,
          payments: true,
          returns: true,
          shipments: true,
        },
      },
      recommendationSessions: true,
      savedSizes: true,
      styleProfile: true,
      tryOnSessions: true,
      wishlist: { include: { items: true } },
    },
  });

  if (!customer) {
    return notFoundJson("Customer not found.");
  }

  await db.auditLog.create({
    data: {
      action: "customer_data_exported",
      entity: "Customer",
      entityId: customer.id,
      metadata: {
        customerId: customer.id,
        userId: session.user.id,
      },
    },
  });

  return new NextResponse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        customer,
      },
      null,
      2,
    ),
    {
      headers: {
        "Content-Disposition": `attachment; filename="aphrodite-customer-${customer.id}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
