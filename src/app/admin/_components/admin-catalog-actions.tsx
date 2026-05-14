"use client";

import { useState, type FormEvent } from "react";
import type { ProductStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";

import {
  AdminMutationStatus,
  type AdminMutationFeedback,
} from "./admin-mutation-status";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import {
  createAdminCouponInputSchema,
  createAdminProductInputSchema,
  updateAdminInventoryInputSchema,
} from "~/lib/admin-validation";
import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import { api, type RouterOutputs } from "~/trpc/react";

type AdminCatalog = RouterOutputs["admin"]["catalog"];
type Product = AdminCatalog["products"][number];
type Variant = Pick<Product["variants"][number], "id" | "name" | "sku">;
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
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const mutation = api.admin.updateProductStatus.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () =>
      setFeedback({ message: "מעדכן סטטוס מוצר...", tone: "neutral" }),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "סטטוס המוצר עודכן.", tone: "success" });
    },
  });
  const nextStatus = status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

  return (
    <div className="grid gap-1">
      <Button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ productId, status: nextStatus })}
        size="sm"
        type="button"
        variant="outline"
      >
        {mutation.isPending
          ? "מעדכן..."
          : nextStatus === "ACTIVE"
            ? "הפעלה"
            : "ארכוב"}
      </Button>
      <AdminMutationStatus feedback={feedback} />
    </div>
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
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.updateInventory.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback({ message: "שומר מלאי...", tone: "neutral" }),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "המלאי נשמר.", tone: "success" });
    },
  });

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-2">
        <Input
          aria-label={`כמות מלאי עבור ${variant.name}`}
          aria-invalid={Boolean(fieldErrors.quantity)}
          className="h-9 w-20"
          disabled={mutation.isPending}
          min={0}
          onChange={(event) => setValue(Number(event.currentTarget.value))}
          type="number"
          value={value}
        />
        <Input
          aria-label={`מלאי ביטחון עבור ${variant.name}`}
          aria-invalid={Boolean(fieldErrors.safetyStock)}
          className="h-9 w-16"
          disabled={mutation.isPending}
          min={0}
          onChange={(event) => setSafety(Number(event.currentTarget.value))}
          title="מלאי ביטחון"
          type="number"
          value={safety}
        />
        <Button
          disabled={mutation.isPending}
          onClick={() => {
            const parsed = updateAdminInventoryInputSchema.safeParse({
              branchId,
              quantity: value,
              safetyStock: safety,
              variantId: variant.id,
            });

            if (!parsed.success) {
              setFieldErrors(getZodFieldErrors(parsed.error));
              setFeedback({
                message: getFirstZodIssueMessage(parsed.error),
                tone: "error",
              });
              return;
            }

            setFieldErrors({});
            mutation.mutate(parsed.data);
          }}
          size="icon"
          type="button"
          variant="outline"
        >
          <Save className="size-4" />
          <span className="sr-only">
            {mutation.isPending ? "שומר מלאי" : "שמירת מלאי"}
          </span>
        </Button>
      </div>
      <AdminMutationStatus feedback={feedback} />
    </div>
  );
}

export function AdminCouponStatusAction({ coupon }: { coupon: Coupon }) {
  const utils = api.useUtils();
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const mutation = api.admin.updateCouponStatus.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback({ message: "מעדכן קופון...", tone: "neutral" }),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "הקופון עודכן.", tone: "success" });
    },
  });

  return (
    <div className="grid gap-1">
      <Button
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate({ couponId: coupon.id, isActive: !coupon.isActive })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        {mutation.isPending ? "מעדכן..." : coupon.isActive ? "כיבוי" : "הפעלה"}
      </Button>
      <AdminMutationStatus feedback={feedback} />
    </div>
  );
}

export function AdminCouponCreateForm() {
  const utils = api.useUtils();
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.createCoupon.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback({ message: "יוצר קופון...", tone: "neutral" }),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "הקופון נוצר.", tone: "success" });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const percentOff = getFormNumber(form, "percentOff");
    const amountOff = getFormNumber(form, "amountOff");
    const maxUses = getFormNumber(form, "maxUses");

    const parsed = createAdminCouponInputSchema.safeParse({
      amountOff: amountOff > 0 ? amountOff : undefined,
      code: getFormString(form, "code"),
      description: getOptionalFormString(form, "description"),
      maxUses: maxUses > 0 ? maxUses : undefined,
      percentOff: percentOff > 0 ? percentOff : undefined,
      startsAt: new Date(),
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      setFeedback({
        message: getFirstZodIssueMessage(parsed.error),
        tone: "error",
      });
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data, {
      onSuccess: () => formElement.reset(),
    });
  }

  return (
    <form className="grid gap-3 md:grid-cols-5" onSubmit={handleSubmit}>
      <Input
        aria-invalid={Boolean(fieldErrors.code)}
        disabled={mutation.isPending}
        name="code"
        placeholder="קוד"
        required
      />
      <Input
        aria-invalid={Boolean(fieldErrors.description)}
        disabled={mutation.isPending}
        name="description"
        placeholder="תיאור"
      />
      <Input
        aria-invalid={Boolean(fieldErrors.percentOff)}
        disabled={mutation.isPending}
        max={100}
        min={1}
        name="percentOff"
        placeholder="%"
        type="number"
      />
      <Input
        aria-invalid={Boolean(fieldErrors.amountOff)}
        disabled={mutation.isPending}
        min={1}
        name="amountOff"
        placeholder="₪"
        type="number"
      />
      <Button disabled={mutation.isPending} type="submit">
        <Plus className="size-4" />
        {mutation.isPending ? "יוצר..." : "קופון"}
      </Button>
      <div className="md:col-span-5">
        <AdminMutationStatus feedback={feedback} />
      </div>
    </form>
  );
}

export function AdminProductCreateForm({ catalog }: { catalog: AdminCatalog }) {
  const utils = api.useUtils();
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.createProduct.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback({ message: "יוצר מוצר...", tone: "neutral" }),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "המוצר נוצר ונשמר בקטלוג.", tone: "success" });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const branchInventory = catalog.branches.map((branch) => ({
      branchId: branch.id,
      quantity: getFormNumber(form, `quantity_${branch.id}`),
      safetyStock: getFormNumber(form, `safety_${branch.id}`),
    }));

    const parsed = createAdminProductInputSchema.safeParse({
      basePrice: getFormNumber(form, "basePrice"),
      branchInventory,
      categoryId: getFormString(form, "categoryId"),
      description: getFormString(form, "description"),
      imageUrl: getOptionalFormString(form, "imageUrl"),
      materialId: getFormString(form, "materialId"),
      name: getFormString(form, "name"),
      shortDescription: getFormString(form, "shortDescription"),
      sku: getFormString(form, "sku"),
      slug: getFormString(form, "slug"),
      stoneId: getOptionalFormString(form, "stoneId"),
      variantName: getOptionalFormString(form, "variantName") ?? "ברירת מחדל",
      variantSku: getFormString(form, "variantSku"),
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      setFeedback({
        message: getFirstZodIssueMessage(parsed.error),
        tone: "error",
      });
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data, {
      onSuccess: () => formElement.reset(),
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <fieldset className="grid gap-4" disabled={mutation.isPending}>
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
          <Field name="variantSku" placeholder="מק״ט וריאציה" />
          <Field name="variantName" placeholder="שם וריאציה" />
        </div>
        <Field name="imageUrl" optional placeholder="כתובת תמונה" />
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
                  placeholder="מלאי ביטחון"
                  type="number"
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      {getFieldErrorList(fieldErrors).length > 0 ? (
        <StatusMessage tone="error" variant="plain">
          {getFieldErrorList(fieldErrors).join(" ")}
        </StatusMessage>
      ) : null}
      {mutation.error ? (
        <StatusMessage tone="error" variant="plain">
          {mutation.error.message}
        </StatusMessage>
      ) : null}
      <AdminMutationStatus feedback={feedback} />
      <Button disabled={mutation.isPending} type="submit">
        <Plus className="size-4" />
        {mutation.isPending ? "יוצר מוצר..." : "יצירת מוצר"}
      </Button>
    </form>
  );
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalFormString(form: FormData, key: string) {
  const value = getFormString(form, key);

  return value.length > 0 ? value : undefined;
}

function getFormNumber(form: FormData, key: string) {
  const value = getFormString(form, key);
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getFieldErrorList(errors: FormFieldErrors) {
  return Object.values(errors).filter((error): error is string =>
    Boolean(error),
  );
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
      min={type === "number" ? 0 : undefined}
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
