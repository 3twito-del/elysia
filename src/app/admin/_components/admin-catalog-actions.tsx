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
  createAdminCouponClientInputSchema,
  createAdminProductInputSchema,
  updateAdminInventoryInputSchema,
  updateAdminProductCommerceInputSchema,
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
  publishBlockers,
  productId,
  status,
}: {
  publishBlockers: string[];
  productId: string;
  status: ProductStatus;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const mutation = api.admin.updateProductStatus.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "סטטוס המוצר עודכן.", tone: "success" });
    },
  });
  const nextStatus = status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  const activationBlocked =
    nextStatus === "ACTIVE" && publishBlockers.length > 0;

  return (
    <div className="grid gap-1">
      <Button
        disabled={mutation.isPending || activationBlocked}
        onClick={() => mutation.mutate({ productId, status: nextStatus })}
        size="sm"
        title={
          activationBlocked
            ? `חסרים לפרסום: ${publishBlockers.join(", ")}`
            : undefined
        }
        type="button"
        variant="outline"
      >
        {nextStatus === "ACTIVE" ? "הפעלה" : "ארכוב"}
      </Button>
      {publishBlockers.length > 0 ? (
        <details className="max-w-64 text-xs">
          <summary className="text-muted-foreground cursor-pointer">
            {publishBlockers.length} חסמי פרסום
          </summary>
          <p className="mt-1 leading-5">{publishBlockers.join(", ")}</p>
        </details>
      ) : null}
      <AdminMutationStatus feedback={feedback} />
    </div>
  );
}

export function AdminProductCommerceForm({ product }: { product: Product }) {
  const utils = api.useUtils();
  const router = useRouter();
  const variant = product.variants[0];
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.updateProductCommerce.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: async () => {
      await utils.admin.catalog.invalidate();
      router.refresh();
      setFeedback({ message: "שכבת המסחר נשמרה.", tone: "success" });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const compareAt = getFormNumber(form, "compareAt");
    const parsed = updateAdminProductCommerceInputSchema.safeParse({
      availabilityMode: getFormString(form, "availabilityMode"),
      careInstructions: getOptionalFormString(form, "careInstructions"),
      commerceHighlights: getFormLines(form, "commerceHighlights"),
      compareAt: compareAt > 0 ? compareAt : undefined,
      countryOfManufacture: getOptionalFormString(form, "countryOfManufacture"),
      deliveryPromise: getOptionalFormString(form, "deliveryPromise"),
      factSourceReference: getOptionalFormString(form, "factSourceReference"),
      manufacturerOrImporter: getOptionalFormString(
        form,
        "manufacturerOrImporter",
      ),
      materialDetails: getOptionalFormString(form, "materialDetails"),
      measurements: getOptionalFormString(form, "measurements"),
      policySourceReference: getOptionalFormString(
        form,
        "policySourceReference",
      ),
      productId: product.id,
      returnPolicy: getOptionalFormString(form, "returnPolicy"),
      stoneDetails: getOptionalFormString(form, "stoneDetails"),
      variantId: variant?.id,
      variantMetalColor: getOptionalFormString(form, "variantMetalColor"),
      variantSize: getOptionalFormString(form, "variantSize"),
      variantStoneColor: getOptionalFormString(form, "variantStoneColor"),
      verifyFacts: form.has("verifyFacts"),
      verifyPolicies: form.has("verifyPolicies"),
      warranty: getOptionalFormString(form, "warranty"),
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
  }

  return (
    <details className="mt-2 text-sm">
      <summary className="text-muted-foreground cursor-pointer underline-offset-4 hover:underline">
        מסחר
      </summary>
      <form className="mt-3 grid min-w-72 gap-3" onSubmit={handleSubmit}>
        <fieldset className="grid gap-3" disabled={mutation.isPending}>
          <AvailabilitySelect defaultValue={product.availabilityMode} />
          <Textarea
            aria-label="הבטחות מסחר"
            defaultValue={product.commerceHighlights.join("\n")}
            name="commerceHighlights"
            placeholder="משלוח מתואם עד הבית"
          />
          <Input
            aria-label="הבטחת משלוח"
            defaultValue={product.deliveryPromise ?? ""}
            name="deliveryPromise"
            placeholder="הבטחת משלוח"
          />
          <Input
            aria-label="מדיניות החזרה"
            defaultValue={product.returnPolicy ?? ""}
            name="returnPolicy"
            placeholder="מדיניות החזרה"
          />
          <Textarea
            aria-label="אחריות"
            defaultValue={product.warranty ?? ""}
            name="warranty"
            placeholder="אחריות"
          />
          <Textarea
            aria-label="הנחיות טיפול"
            defaultValue={product.careInstructions ?? ""}
            name="careInstructions"
            placeholder="הנחיות טיפול"
          />
          <Input
            aria-label="אסמכתת מדיניות"
            defaultValue={product.policySourceReference ?? ""}
            name="policySourceReference"
            placeholder="אסמכתת מדיניות"
          />
          <Label
            className="flex items-start gap-2 leading-5"
            htmlFor={`verifyPolicies-${product.id}`}
          >
            <input
              className="mt-0.5 size-4"
              defaultChecked={Boolean(product.policyVerifiedAt)}
              id={`verifyPolicies-${product.id}`}
              name="verifyPolicies"
              type="checkbox"
            />
            אימות מדיניות המשלוח, ההחזרה, הטיפול והאחריות מול האסמכתה
          </Label>
          <div className="grid gap-2 border-t pt-3">
            <Input
              aria-label="מדינת ייצור"
              defaultValue={product.countryOfManufacture ?? ""}
              name="countryOfManufacture"
              placeholder="מדינת ייצור"
            />
            <Input
              aria-label="יצרן או יבואן"
              defaultValue={product.manufacturerOrImporter ?? ""}
              name="manufacturerOrImporter"
              placeholder="יצרן או יבואן"
            />
            <Textarea
              aria-label="פרטי חומר"
              defaultValue={product.materialDetails ?? ""}
              name="materialDetails"
              placeholder="פרטי חומר, טוהר וציפוי"
            />
            <Textarea
              aria-label="מידות מוצר"
              defaultValue={product.measurements ?? ""}
              name="measurements"
              placeholder="מידות ומשקל"
            />
            <Textarea
              aria-label="פרטי אבן"
              defaultValue={product.stoneDetails ?? ""}
              name="stoneDetails"
              placeholder="פרטי אבן"
            />
            <Input
              aria-label="אסמכתת עובדות"
              defaultValue={product.factSourceReference ?? ""}
              name="factSourceReference"
              placeholder="אסמכתת עובדות"
            />
            <Label
              className="flex items-start gap-2 leading-5"
              htmlFor={`verifyFacts-${product.id}`}
            >
              <input
                className="mt-0.5 size-4"
                defaultChecked={Boolean(product.factVerifiedAt)}
                id={`verifyFacts-${product.id}`}
                name="verifyFacts"
                type="checkbox"
              />
              אימות פרטי המוצר מול האסמכתה
            </Label>
          </div>
          {variant ? (
            <div className="grid gap-2">
              <Input
                aria-label="מחיר לפני הנחה"
                defaultValue={variant.compareAt ?? ""}
                min={0}
                name="compareAt"
                placeholder="מחיר לפני הנחה"
                type="number"
              />
              <Input
                aria-label="מידת וריאציה"
                defaultValue={variant.size ?? ""}
                name="variantSize"
                placeholder="מידה"
              />
              <Input
                aria-label="גוון מתכת"
                defaultValue={variant.metalColor ?? ""}
                name="variantMetalColor"
                placeholder="גוון מתכת"
              />
              <Input
                aria-label="גוון אבן"
                defaultValue={variant.stoneColor ?? ""}
                name="variantStoneColor"
                placeholder="גוון אבן"
              />
            </div>
          ) : null}
        </fieldset>
        {getFieldErrorList(fieldErrors).length > 0 ? (
          <StatusMessage tone="error" variant="plain">
            {getFieldErrorList(fieldErrors).join(" ")}
          </StatusMessage>
        ) : null}
        <AdminMutationStatus feedback={feedback} />
        <Button disabled={mutation.isPending} size="sm" type="submit">
          <Save aria-hidden="true" className="size-4" />
          שמירת מסחר
        </Button>
      </form>
    </details>
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
    onMutate: () => setFeedback(undefined),
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
          <Save aria-hidden="true" className="size-4" />
          <span className="sr-only">שמירת מלאי</span>
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
    onMutate: () => setFeedback(undefined),
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
        {coupon.isActive ? "כיבוי" : "הפעלה"}
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
    onMutate: () => setFeedback(undefined),
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

    const parsed = createAdminCouponClientInputSchema.safeParse({
      amountOff: amountOff > 0 ? amountOff : undefined,
      code: getFormString(form, "code"),
      description: getOptionalFormString(form, "description"),
      maxUses: maxUses > 0 ? maxUses : undefined,
      percentOff: percentOff > 0 ? percentOff : undefined,
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
        aria-label="קוד קופון"
        aria-invalid={Boolean(fieldErrors.code)}
        disabled={mutation.isPending}
        name="code"
        placeholder="קוד"
        required
      />
      <Input
        aria-label="תיאור קופון"
        aria-invalid={Boolean(fieldErrors.description)}
        disabled={mutation.isPending}
        name="description"
        placeholder="תיאור"
      />
      <Input
        aria-label="אחוז הנחה"
        aria-invalid={Boolean(fieldErrors.percentOff)}
        disabled={mutation.isPending}
        max={100}
        min={1}
        name="percentOff"
        placeholder="%"
        type="number"
      />
      <Input
        aria-label="סכום הנחה"
        aria-invalid={Boolean(fieldErrors.amountOff)}
        disabled={mutation.isPending}
        min={1}
        name="amountOff"
        placeholder="₪"
        type="number"
      />
      <Button disabled={mutation.isPending} type="submit">
        <Plus aria-hidden="true" className="size-4" />
        קופון
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
    onMutate: () => setFeedback(undefined),
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
    const compareAt = getFormNumber(form, "compareAt");

    const parsed = createAdminProductInputSchema.safeParse({
      availabilityMode: getFormString(form, "availabilityMode"),
      basePrice: getFormNumber(form, "basePrice"),
      branchInventory,
      categoryId: getFormString(form, "categoryId"),
      careInstructions: getOptionalFormString(form, "careInstructions"),
      commerceHighlights: getFormLines(form, "commerceHighlights"),
      compareAt: compareAt > 0 ? compareAt : undefined,
      description: getFormString(form, "description"),
      deliveryPromise: getOptionalFormString(form, "deliveryPromise"),
      countryOfManufacture: getOptionalFormString(form, "countryOfManufacture"),
      factSourceReference: getOptionalFormString(form, "factSourceReference"),
      imageUrl: getOptionalFormString(form, "imageUrl"),
      manufacturerOrImporter: getOptionalFormString(
        form,
        "manufacturerOrImporter",
      ),
      materialId: getFormString(form, "materialId"),
      materialDetails: getOptionalFormString(form, "materialDetails"),
      measurements: getOptionalFormString(form, "measurements"),
      name: getFormString(form, "name"),
      policySourceReference: getOptionalFormString(
        form,
        "policySourceReference",
      ),
      returnPolicy: getOptionalFormString(form, "returnPolicy"),
      shortDescription: getFormString(form, "shortDescription"),
      sku: getFormString(form, "sku"),
      slug: getFormString(form, "slug"),
      stoneId: getOptionalFormString(form, "stoneId"),
      stoneDetails: getOptionalFormString(form, "stoneDetails"),
      variantMetalColor: getOptionalFormString(form, "variantMetalColor"),
      variantName: getOptionalFormString(form, "variantName") ?? "ברירת מחדל",
      variantSize: getOptionalFormString(form, "variantSize"),
      variantSku: getFormString(form, "variantSku"),
      variantStoneColor: getOptionalFormString(form, "variantStoneColor"),
      verifyFacts: form.has("verifyFacts"),
      verifyPolicies: form.has("verifyPolicies"),
      warranty: getOptionalFormString(form, "warranty"),
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
        <div className="grid gap-3 md:grid-cols-4">
          <AvailabilitySelect defaultValue="READY_TO_ORDER" />
          <Field
            name="compareAt"
            optional
            placeholder="מחיר לפני הנחה"
            type="number"
          />
          <Field name="variantSize" optional placeholder="מידה" />
          <Field name="variantMetalColor" optional placeholder="גוון מתכת" />
          <Field name="variantStoneColor" optional placeholder="גוון אבן" />
        </div>
        <Textarea
          name="commerceHighlights"
          placeholder="הבטחות מסחר, שורה לכל הבטחה"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Field name="deliveryPromise" optional placeholder="הבטחת משלוח" />
          <Field name="returnPolicy" optional placeholder="מדיניות החזרה" />
        </div>
        <Textarea name="warranty" placeholder="אחריות" />
        <Textarea name="careInstructions" placeholder="הנחיות טיפול" />
        <Field
          name="policySourceReference"
          optional
          placeholder="אסמכתת מדיניות"
        />
        <Label
          className="flex items-start gap-2 leading-5"
          htmlFor="verifyPolicies"
        >
          <input
            className="mt-0.5 size-4"
            id="verifyPolicies"
            name="verifyPolicies"
            type="checkbox"
          />
          אימות מדיניות המשלוח, ההחזרה, הטיפול והאחריות מול האסמכתה
        </Label>
        <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
          <Field
            name="countryOfManufacture"
            optional
            placeholder="מדינת ייצור"
          />
          <Field
            name="manufacturerOrImporter"
            optional
            placeholder="יצרן או יבואן"
          />
          <Textarea
            name="materialDetails"
            placeholder="פרטי חומר, טוהר וציפוי"
          />
          <Textarea name="measurements" placeholder="מידות ומשקל" />
          <Textarea name="stoneDetails" placeholder="פרטי אבן" />
          <Field
            name="factSourceReference"
            optional
            placeholder="אסמכתת עובדות"
          />
        </div>
        <Label
          className="flex items-start gap-2 leading-5"
          htmlFor="verifyFacts"
        >
          <input
            className="mt-0.5 size-4"
            id="verifyFacts"
            name="verifyFacts"
            type="checkbox"
          />
          אימות פרטי המוצר מול האסמכתה
        </Label>
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
        <div className="grid gap-2">
          <Field name="imageUrl" optional placeholder="כתובת תמונה" />
          <p
            className="text-muted-foreground text-xs leading-5"
            data-testid="admin-catalog-image-validation-summary"
          >
            תמונת מוצר צריכה להיות JPG, PNG, WebP, GIF או AVIF, עד 5MB. שם המוצר
            משמש כטקסט חלופי בתצוגת הקטלוג.
          </p>
        </div>
        <Textarea name="shortDescription" placeholder="תיאור קצר" required />
        <Textarea name="description" placeholder="תיאור מלא" required />
        <div className="grid gap-3 md:grid-cols-2">
          {catalog.branches.map((branch) => (
            <div className="glass-inset rounded-md border p-3" key={branch.id}>
              <Label>{branch.name}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  aria-label={`מלאי התחלתי עבור ${branch.name}`}
                  min={0}
                  name={`quantity_${branch.id}`}
                  placeholder="מלאי"
                  type="number"
                />
                <Input
                  aria-label={`מלאי ביטחון עבור ${branch.name}`}
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
      <AdminMutationStatus feedback={feedback} />
      <Button disabled={mutation.isPending} type="submit">
        <Plus aria-hidden="true" className="size-4" />
        יצירת מוצר
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

function getFormLines(form: FormData, key: string) {
  return getFormString(form, key)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
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
      aria-label={placeholder}
      min={type === "number" ? 0 : undefined}
      name={name}
      placeholder={placeholder}
      required={!optional}
      type={type}
    />
  );
}

function AvailabilitySelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      aria-label="מצב בחירה"
      autoComplete="off"
      className="glass-control h-10 rounded-md border px-3 text-sm"
      defaultValue={defaultValue}
      name="availabilityMode"
      required
    >
      <option value="READY_TO_ORDER">זמין</option>
      <option value="MADE_TO_ORDER">בהזמנה אישית</option>
      <option value="CONSULTATION">לייעוץ</option>
    </select>
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
      aria-label={getSelectAriaLabel(name)}
      autoComplete="off"
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

function getSelectAriaLabel(name: string) {
  if (name === "categoryId") return "קטגוריית מוצר";
  if (name === "materialId") return "חומר מוצר";
  if (name === "stoneId") return "אבן מוצר";

  return name;
}
