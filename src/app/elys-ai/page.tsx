import { ElysAiConcierge } from "~/app/elys-ai/_components/elys-ai-concierge";
import { SiteHeader } from "~/components/site-header";

export const metadata = {
  title: "elys-ai | התאמת תכשיטים אישית",
  description:
    "elys-ai עוזרת לבחור תכשיט לפי סגנון, אירוע, מחיר ומידה מתוך הקולקציה הזמינה של Elysia.",
};

export default function ElysAiPage() {
  return (
    <main className="elysia-page elys-ai-page min-h-screen overflow-x-clip">
      <SiteHeader />
      <section
        className="mx-auto grid max-w-5xl gap-5 px-[var(--ui-page-x)] pt-12 pb-8 text-center sm:pt-16 lg:px-[var(--ui-page-x-wide)] lg:pt-20"
        id="page-hero"
      >
        <span className="text-muted-foreground text-xs font-medium uppercase">
          Elysia personal concierge
        </span>
        <h1 className="text-4xl font-semibold sm:text-6xl">
          בחירה אישית, בקצב שלך
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-8 sm:text-lg">
          elys-ai מחברת בין הסגנון, האירוע והתקציב שלך לבין תכשיטים זמינים
          מהקולקציה — בלי צורך בחשבון.
        </p>
      </section>
      <div className="mx-auto max-w-6xl px-[var(--ui-page-x)] pb-[var(--ui-section-y)] lg:px-[var(--ui-page-x-wide)]">
        <ElysAiConcierge />
      </div>
    </main>
  );
}
