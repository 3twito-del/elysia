import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";

export async function listAdminCatalog() {
  const [products, categories, materials, stones, branches, coupons] =
    await Promise.all([
      db.product.findMany({
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: {
          category: true,
          material: true,
          stone: true,
          variants: {
            include: {
              inventoryItems: { include: { branch: true } },
              prices: {
                orderBy: { validFrom: "desc" },
                take: 1,
              },
            },
          },
          media: {
            where: { kind: "IMAGE" },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            select: { url: true },
            take: 1,
          },
        },
      }),
      db.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      db.material.findMany({ orderBy: { name: "asc" } }),
      db.stone.findMany({ orderBy: { name: "asc" } }),
      db.branch.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }),
      db.coupon.findMany({ orderBy: { startsAt: "desc" }, take: 20 }),
    ]);

  return {
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      image: product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
      status: product.status,
      categoryName: product.category.name,
      materialName: product.material.name,
      stoneName: product.stone?.name ?? null,
      basePrice: Number(product.basePrice),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: Number(variant.prices[0]?.amount ?? product.basePrice),
        inventory: variant.inventoryItems.map((item) => ({
          branchId: item.branchId,
          branchName: item.branch.name,
          quantity: item.quantity,
          reserved: item.reserved,
          safetyStock: item.safetyStock,
        })),
      })),
    })),
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
    })),
    materials: materials.map((material) => ({
      id: material.id,
      slug: material.slug,
      name: material.name,
    })),
    stones: stones.map((stone) => ({
      id: stone.id,
      slug: stone.slug,
      name: stone.name,
    })),
    branches: branches.map((branch) => ({
      id: branch.id,
      slug: branch.slug,
      name: branch.name,
      city: branch.city,
    })),
    coupons: coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      percentOff: coupon.percentOff,
      amountOff: coupon.amountOff ? Number(coupon.amountOff) : null,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      isActive: coupon.isActive,
    })),
  };
}

export async function listAdminCustomers(input: { limit?: number } = {}) {
  const customers = await db.customer.findMany({
    orderBy: { updatedAt: "desc" },
    take: input.limit ?? 50,
    include: {
      orders: { select: { id: true, total: true } },
      wishlist: { include: { items: true } },
      addresses: true,
    },
  });

  return customers.map((customer) => ({
    id: customer.id,
    email: customer.email,
    phone: customer.phone,
    name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
    orders: customer.orders.length,
    lifetimeValue: customer.orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    ),
    wishlistItems: customer.wishlist?.items.length ?? 0,
    addresses: customer.addresses.length,
    updatedAt: customer.updatedAt,
  }));
}

export async function listAdminAppointments(input: { limit?: number } = {}) {
  const appointments = await db.appointment.findMany({
    orderBy: { startsAt: "asc" },
    take: input.limit ?? 25,
    include: {
      branch: true,
      customer: true,
    },
  });

  return appointments.map((appointment) => ({
    id: appointment.id,
    topic: appointment.topic,
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    startsAt: appointment.startsAt,
    status: appointment.status,
    notes: appointment.notes,
    branchName: appointment.branch.name,
    branchCity: appointment.branch.city,
    customerId: appointment.customerId,
  }));
}

export async function getAdminOrderDetail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      branch: true,
      customer: true,
      items: true,
      payments: true,
      shipments: true,
      returns: true,
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discountTotal),
      shipping: Number(order.shippingTotal),
      total: Number(order.total),
    },
    customer: {
      id: order.customerId,
      email: order.email,
      phone: order.phone,
      name: order.recipientName,
    },
    branch: order.branch
      ? {
          id: order.branch.id,
          name: order.branch.name,
          city: order.branch.city,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      providerStatus: payment.providerStatus,
      amount: Number(payment.amount),
    })),
    shipments: order.shipments,
    returns: order.returns,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
