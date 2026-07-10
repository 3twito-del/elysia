import { NotFoundState } from "~/components/not-found-state";

export default function CategoryNotFound() {
  return (
    <NotFoundState
      description="ייתכן שהקישור השתנה או שהקטגוריה אינה פעילה. אפשר להמשיך לחיפוש."
      hiddenTitle="הקטגוריה לא נמצאה"
      testId="category-not-found"
      title="הקטגוריה לא נמצאה"
    />
  );
}
