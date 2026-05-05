"use client";

import { useState, type FormEvent } from "react";
import type { ProductStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type AdminCatalog = RouterOutputs["admin"]["catalog"];
type Product = AdminCatalog["products"][number];
type Variant = Product["variants"][number];
type Coupon = AdminCatalog["coupons"][number];

export function AdminProductStatusAction({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const mutation = api.admin.updateProductStatus.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
    },
  });
  const nextStatus = status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

  return (
    <Button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate({ productId, status: nextStatus })}
      size="sm"
      type="button"
      variant="outline"
    >
      {nextStatus === "ACTIVE" ? "הפעלה" : "ארכוב"}
    </Button>
  );
}

export function AdminInventoryEditor({
  branchId,
  quantity,
  safetyStock,
  variant,
}: {
  branchId: string;
  quantity: number;
  safetyStock: number;
  variant: Variant;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const [value, setValue] = useState(quantity);
  const [safety, setSafety] = useState(safetyStock);
  const mutation = api.admin.updateInventory.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 w-20"
        min={0}
        onChange={(event) => setValue(Number(event.currentTarget.value))}
        type="number"
        value={value}
      />
      <Input
        className="h-9 w-16"
        min={0}
        onChange={(event) => setSafety(Number(event.currentTarget.value))}
        title="Safety stock"
        type="number"
        value={safety}
      />
      <Button
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate({
            branchId,
            variantId: variant.id,
            quantity: value,
            safetyStock: safety,
          })
        }
        size="icon"
        type="button"
        variant="outline"
      >
        <Save className="size-4" />
        <span className="sr-only">שמירה</span>
      </Button>
    </div>
  );
}

export function AdminCouponStatusAction({ coupon }: { coupon: Coupon }) {
  const utils = api.useUtils();
  const router = useRouter();
  const mutation = api.admin.updateCouponStatus.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
    },
  });

  return (
    <Button
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ couponId: coupon.id, isActive: !coupon.isActive })
      }
      size="sm"
      type="button"
      variant="outline"
    >
      {coupon.isActive ? "כיבוי" : "הפעלה"}
    </Button>
  );
}

export function AdminCouponCreateForm() {
  const utils = api.useUtils();
  const router = useRouter();
  const mutation = api.admin.createCoupon.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const percentOff = getFormNumber(form, "percentOff");
    const amountOff = getFormNumber(form, "amountOff");

    mutation.mutate({
      code: getFormString(form, "code"),
      description: getFormString(form, "description") || undefined,
      percentOff: percentOff > 0 ? percentOff : undefined,
      amountOff: amountOff > 0 ? amountOff : undefined,
      startsAt: new Date(),
      maxUses: getFormNumber(form, "maxUses") || undefined,
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3 md:grid-cols-5" onSubmit={handleSubmit}>
      <Input name="code" placeholder="קוד" required />
      <Input name="description" placeholder="תיאור" />
      <Input
        min={1}
        max={100}
        name="percentOff"
        placeholder="%"
        type="number"
      />
      <Input min={1} name="amountOff" placeholder="₪" type="number" />
      <Button disabled={mutation.isPending} type="submit">
        <Plus className="size-4" />
        קופון
      </Button>
    </form>
  );
}

export function AdminProductCreateForm({ catalog }: { catalog: AdminCatalog }) {
  const utils = api.useUtils();
  const router = useRouter();
  const mutation = api.admin.createProduct.useMutation({
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const branchInventory = catalog.branches.map((branch) => ({
      branchId: branch.id,
      quantity: getFormNumber(form, `quantity_${branch.id}`),
      safetyStock: getFormNumber(form, `safety_${branch.id}`),
    }));

    mutation.mutate({
      slug: getFormString(form, "slug"),
      sku: getFormString(form, "sku"),
      name: getFormString(form, "name"),
      shortDescription: getFormString(form, "shortDescription"),
      description: getFormString(form, "description"),
      categoryId: getFormString(form, "categoryId"),
      materialId: getFormString(form, "materialId"),
      stoneId: getFormString(form, "stoneId") || undefined,
      basePrice: getFormNumber(form, "basePrice"),
      imageUrl: getFormString(form, "imageUrl") || undefined,
      variantSku: getFormString(form, "variantSku"),
      variantName: getFormString(form, "variantName") || "Default",
      branchInventory,
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="name" placeholder="שם מוצר" />
        <Field name="slug" placeholder="slug" />
        <Field name="sku" placeholder="SKU" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Select name="categoryId" options={catalog.categories} />
        <Select name="materialId" options={catalog.materials} />
        <Select name="stoneId" options={catalog.stones} optional />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field name="basePrice" placeholder="מחיר" type="number" />
        <Field name="variantSku" placeholder="Variant SKU" />
        <Field name="variantName" placeholder="שם וריאציה" />
      </div>
      <Field name="imageUrl" optional placeholder="Image URL" />
      <Textarea name="shortDescription" placeholder="תיאור קצר" required />
      <Textarea name="description" placeholder="תיאור מלא" required />
      <div className="grid gap-3 md:grid-cols-2">
        {catalog.branches.map((branch) => (
          <div className="glass-inset rounded-md border p-3" key={branch.id}>
            <Label>{branch.name}</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                min={0}
                name={`quantity_${branch.id}`}
                placeholder="מלאי"
                type="number"
              />
              <Input
                min={0}
                name={`safety_${branch.id}`}
                placeholder="Safety"
                type="number"
              />
            </div>
          </div>
        ))}
      </div>
      {mutation.error ? (
        <StatusMessage tone="error" variant="plain">
          {mutation.error.message}
        </StatusMessage>
      ) : null}
      <Button disabled={mutation.isPending} type="submit">
        <Plus className="size-4" />
        יצירת מוצר
      </Button>
    </form>
  );
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key);

  return typeof value === "string" ? value : "";
}

function getFormNumber(form: FormData, key: string) {
  const value = getFormString(form, key);

  return value ? Number(value) : 0;
}

function Field({
  name,
  optional,
  placeholder,
  type = "text",
}: {
  name: string;
  optional?: boolean;
  placeholder: string;
  type?: string;
}) {
  return (
    <Input
      name={name}
      placeholder={placeholder}
      required={!optional}
      type={type}
    />
  );
}

function Select({
  name,
  options,
  optional,
}: {
  name: string;
  options: Array<{ id: string; name: string }>;
  optional?: boolean;
}) {
  return (
    <select
      className="glass-control h-10 rounded-md border px-3 text-sm"
      name={name}
      required={!optional}
    >
      {optional ? <option value="">ללא</option> : null}
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
