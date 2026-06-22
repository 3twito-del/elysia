"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import type { z } from "zod";

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
  createAdminBlogAuthorInputSchema,
  createAdminBlogCategoryInputSchema,
  createAdminBlogPostInputSchema,
  createAdminBlogTagInputSchema,
  updateAdminBlogPostInputSchema,
} from "~/lib/blog-validation";
import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import { api, type RouterOutputs } from "~/trpc/react";

type AdminBlogList = RouterOutputs["admin"]["blog"];
type BlogOptions = Pick<
  AdminBlogList,
  "authors" | "categories" | "products" | "tags"
>;
type TaxonomyMutation =
  | ReturnType<typeof api.admin.createBlogAuthor.useMutation>
  | ReturnType<typeof api.admin.createBlogCategory.useMutation>
  | ReturnType<typeof api.admin.createBlogTag.useMutation>;

type BlogPostEditorValue = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  authorId: string | null;
  categoryId: string | null;
  tagIds: string[];
  relatedProductIds: string[];
};

export function AdminBlogPostCreateForm({ options }: { options: BlogOptions }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.createBlogPost.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: async (result) => {
      await utils.admin.blog.invalidate();
      router.refresh();
      router.push(`/admin/blog/${result.id}`);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createAdminBlogPostInputSchema.safeParse(
      getBlogPostFormInput(new FormData(event.currentTarget)),
    );

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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <PostFieldset fieldErrors={fieldErrors} options={options} />
      <FormErrors errors={fieldErrors} />
      <AdminMutationStatus feedback={feedback} />
      <Button disabled={mutation.isPending} type="submit">
        <Plus aria-hidden="true" className="size-4" />
        יצירת מאמר
      </Button>
    </form>
  );
}

export function AdminBlogPostEditorForm({
  options,
  post,
}: {
  options: BlogOptions;
  post: BlogPostEditorValue;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.updateBlogPost.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: async () => {
      await utils.admin.blog.invalidate();
      router.refresh();
      setFeedback({ message: "המאמר נשמר.", tone: "success" });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updateAdminBlogPostInputSchema.safeParse({
      id: post.id,
      ...getBlogPostFormInput(new FormData(event.currentTarget)),
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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <PostFieldset
        defaults={post}
        fieldErrors={fieldErrors}
        options={options}
      />
      <FormErrors errors={fieldErrors} />
      <AdminMutationStatus feedback={feedback} />
      <Button disabled={mutation.isPending} type="submit">
        <Save aria-hidden="true" className="size-4" />
        שמירת מאמר
      </Button>
    </form>
  );
}

export function AdminBlogTaxonomyForms() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <TaxonomyForm
        fields={[
          { name: "name", placeholder: "שם כותב" },
          { name: "slug", placeholder: "slug" },
          { name: "title", optional: true, placeholder: "תפקיד" },
          { name: "imageUrl", optional: true, placeholder: "תמונת כותב" },
          {
            name: "bio",
            optional: true,
            placeholder: "ביוגרפיה",
            textarea: true,
          },
        ]}
        schema={createAdminBlogAuthorInputSchema}
        submitLabel="כותב"
        useMutation={() => api.admin.createBlogAuthor.useMutation()}
      />
      <TaxonomyForm
        fields={[
          { name: "name", placeholder: "שם קטגוריה" },
          { name: "slug", placeholder: "slug" },
          {
            name: "sortOrder",
            optional: true,
            placeholder: "סדר",
            type: "number",
          },
          {
            name: "description",
            optional: true,
            placeholder: "תיאור",
            textarea: true,
          },
        ]}
        schema={createAdminBlogCategoryInputSchema}
        submitLabel="קטגוריה"
        useMutation={() => api.admin.createBlogCategory.useMutation()}
      />
      <TaxonomyForm
        fields={[
          { name: "name", placeholder: "שם תגית" },
          { name: "slug", placeholder: "slug" },
        ]}
        schema={createAdminBlogTagInputSchema}
        submitLabel="תגית"
        useMutation={() => api.admin.createBlogTag.useMutation()}
      />
    </div>
  );
}

function PostFieldset({
  defaults,
  fieldErrors,
  options,
}: {
  defaults?: Partial<BlogPostEditorValue>;
  fieldErrors: FormFieldErrors;
  options: BlogOptions;
}) {
  return (
    <fieldset className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Field
          defaultValue={defaults?.title}
          error={fieldErrors.title}
          name="title"
          placeholder="כותרת"
        />
        <Field
          defaultValue={defaults?.slug}
          error={fieldErrors.slug}
          name="slug"
          placeholder="slug"
        />
        <select
          aria-label="סטטוס מאמר"
          autoComplete="off"
          className="glass-control h-10 rounded-md border px-3 text-sm"
          defaultValue={defaults?.status ?? "DRAFT"}
          name="status"
        >
          <option value="DRAFT">טיוטה</option>
          <option value="PUBLISHED">פורסם / מתוזמן</option>
          <option value="ARCHIVED">ארכיון</option>
        </select>
      </div>
      <Textarea
        aria-invalid={Boolean(fieldErrors.excerpt)}
        defaultValue={defaults?.excerpt ?? ""}
        name="excerpt"
        placeholder="תקציר"
        required
      />
      <Textarea
        aria-invalid={Boolean(fieldErrors.bodyMarkdown)}
        className="min-h-72 font-mono text-sm"
        defaultValue={defaults?.bodyMarkdown ?? ""}
        name="bodyMarkdown"
        placeholder="Markdown"
        required
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Select
          defaultValue={defaults?.authorId ?? ""}
          label="כותב"
          name="authorId"
          options={options.authors}
        />
        <Select
          defaultValue={defaults?.categoryId ?? ""}
          label="קטגוריה"
          name="categoryId"
          options={options.categories}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <MultiSelect
          defaultValue={defaults?.tagIds ?? []}
          label="תגיות"
          name="tagIds"
          options={options.tags}
        />
        <MultiSelect
          defaultValue={defaults?.relatedProductIds ?? []}
          label="מוצרים קשורים"
          name="relatedProductIds"
          options={options.products}
          searchable
          searchPlaceholder="חיפוש מוצרים"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field
          defaultValue={toDateTimeLocalValue(defaults?.publishedAt)}
          name="publishedAt"
          optional
          placeholder="תאריך פרסום"
          type="datetime-local"
        />
        <Field
          defaultValue={defaults?.heroImageUrl ?? ""}
          error={fieldErrors.heroImageUrl}
          name="heroImageUrl"
          optional
          placeholder="תמונת Hero"
        />
        <Field
          defaultValue={defaults?.heroImageAlt ?? ""}
          error={fieldErrors.heroImageAlt}
          name="heroImageAlt"
          optional
          placeholder="טקסט חלופי"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field
          defaultValue={defaults?.seoTitle ?? ""}
          error={fieldErrors.seoTitle}
          name="seoTitle"
          optional
          placeholder="כותרת SEO"
        />
        <Field
          defaultValue={defaults?.seoDescription ?? ""}
          error={fieldErrors.seoDescription}
          name="seoDescription"
          optional
          placeholder="תיאור SEO"
        />
      </div>
      <Label className="flex items-center gap-2">
        <input
          className="size-4"
          defaultChecked={defaults?.featured ?? false}
          name="featured"
          type="checkbox"
        />
        מאמר מוביל
      </Label>
    </fieldset>
  );
}

function TaxonomyForm({
  fields,
  schema,
  submitLabel,
  useMutation,
}: {
  fields: Array<{
    name: string;
    optional?: boolean;
    placeholder: string;
    textarea?: boolean;
    type?: string;
  }>;
  schema: z.ZodTypeAny;
  submitLabel: string;
  useMutation: () => TaxonomyMutation;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const mutation = useMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const input = Object.fromEntries(
      fields.map((field) => [
        field.name,
        getOptionalFormString(form, field.name),
      ]),
    );
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      setFeedback({
        message: getFirstZodIssueMessage(parsed.error),
        tone: "error",
      });
      return;
    }

    mutation.mutate(parsed.data as never, {
      onError: (error) =>
        setFeedback({ message: error.message, tone: "error" }),
      onSuccess: () => {
        void (async () => {
          await utils.admin.blog.invalidate();
          router.refresh();
          formElement.reset();
          setFeedback({ message: `${submitLabel} נוצרה.`, tone: "success" });
        })();
      },
    });
  }

  return (
    <form className="grid gap-3 rounded-md border p-3" onSubmit={handleSubmit}>
      {fields.map((field) =>
        field.textarea ? (
          <Textarea
            key={field.name}
            name={field.name}
            placeholder={field.placeholder}
            required={!field.optional}
          />
        ) : (
          <Field
            key={field.name}
            name={field.name}
            optional={field.optional}
            placeholder={field.placeholder}
            type={field.type}
          />
        ),
      )}
      <AdminMutationStatus feedback={feedback} />
      <Button disabled={mutation.isPending} size="sm" type="submit">
        <Plus aria-hidden="true" className="size-4" />
        {submitLabel}
      </Button>
    </form>
  );
}

function getBlogPostFormInput(form: FormData) {
  return {
    authorId: getOptionalFormString(form, "authorId"),
    bodyMarkdown: getFormString(form, "bodyMarkdown"),
    categoryId: getOptionalFormString(form, "categoryId"),
    excerpt: getFormString(form, "excerpt"),
    featured: form.has("featured"),
    heroImageAlt: getOptionalFormString(form, "heroImageAlt"),
    heroImageUrl: getOptionalFormString(form, "heroImageUrl"),
    publishedAt: getOptionalDate(form, "publishedAt"),
    relatedProductIds: getFormStringValues(form, "relatedProductIds"),
    seoDescription: getOptionalFormString(form, "seoDescription"),
    seoTitle: getOptionalFormString(form, "seoTitle"),
    slug: getFormString(form, "slug"),
    status: getFormString(form, "status"),
    tagIds: getFormStringValues(form, "tagIds"),
    title: getFormString(form, "title"),
  };
}

function Field({
  defaultValue,
  error,
  name,
  optional,
  placeholder,
  type = "text",
}: {
  defaultValue?: string | null;
  error?: string;
  name: string;
  optional?: boolean;
  placeholder: string;
  type?: string;
}) {
  return (
    <Input
      aria-invalid={Boolean(error)}
      defaultValue={defaultValue ?? ""}
      min={type === "number" ? 0 : undefined}
      name={name}
      placeholder={placeholder}
      required={!optional}
      type={type}
    />
  );
}

function Select({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <select
      aria-label={label}
      autoComplete="off"
      className="glass-control h-10 rounded-md border px-3 text-sm"
      defaultValue={defaultValue}
      name={name}
    >
      <option value="">ללא</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

function MultiSelect({
  defaultValue,
  label,
  name,
  options,
  searchable,
  searchPlaceholder,
}: {
  defaultValue: string[];
  label: string;
  name: string;
  options: Array<{ id: string; name: string }>;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState(defaultValue);
  const normalizedQuery = query.trim().toLowerCase();

  return (
    <label className="grid gap-2 text-sm">
      <span>{label}</span>
      {searchable ? (
        <Input
          aria-label={searchPlaceholder ?? label}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
      ) : null}
      <select
        aria-label={label}
        autoComplete="off"
        className="glass-control min-h-32 rounded-md border px-3 py-2 text-sm"
        multiple
        name={name}
        onChange={(event) =>
          setSelectedValues(
            Array.from(
              event.currentTarget.selectedOptions,
              (option) => option.value,
            ),
          )
        }
        value={selectedValues}
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.id);
          const isHidden =
            Boolean(normalizedQuery) &&
            !isSelected &&
            !option.name.toLowerCase().includes(normalizedQuery);

          return (
            <option hidden={isHidden} key={option.id} value={option.id}>
              {option.name}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function FormErrors({ errors }: { errors: FormFieldErrors }) {
  const list = Object.values(errors).filter((error): error is string =>
    Boolean(error),
  );

  return list.length > 0 ? (
    <StatusMessage tone="error" variant="plain">
      {list.join(" ")}
    </StatusMessage>
  ) : null;
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalFormString(form: FormData, key: string) {
  const value = getFormString(form, key);

  return value.length > 0 ? value : undefined;
}

function getFormStringValues(form: FormData, key: string) {
  return form
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getOptionalDate(form: FormData, key: string) {
  const value = getOptionalFormString(form, key);
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateTimeLocalValue(date?: Date | string | null) {
  if (!date) return "";

  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toISOString().slice(0, 16);
}
