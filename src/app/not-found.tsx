import { NotFoundState } from "~/components/not-found-state";

export default function GlobalNotFound() {
  return (
    <NotFoundState
      description="ייתכן שהקישור השתנה או שהעמוד הוסר. אפשר להמשיך לחיפוש."
      hiddenTitle="העמוד לא נמצא"
      testId="global-not-found"
      title="העמוד לא נמצא"
    />
  );
}
