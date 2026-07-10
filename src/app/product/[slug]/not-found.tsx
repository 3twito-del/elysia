import { NotFoundState } from "~/components/not-found-state";

export default function ProductNotFound() {
  return (
    <NotFoundState
      description="ייתכן שהקישור השתנה או שהפריט אינו זמין עוד. אפשר להמשיך לחיפוש."
      hiddenTitle="התכשיט לא נמצא"
      testId="product-not-found"
      title="התכשיט לא נמצא"
    />
  );
}
