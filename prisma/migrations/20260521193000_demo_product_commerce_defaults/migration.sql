UPDATE "Product"
SET
  "commerceHighlights" = ARRAY['פרטים מאומתים לפני הזמנה', 'נבדק בקפידה לפני מסירה']::TEXT[],
  "deliveryPromise" = COALESCE("deliveryPromise", 'מסירה עד הבית לאחר אישור הפרטים.'),
  "returnPolicy" = COALESCE("returnPolicy", 'החלפה או החזרה בתיאום אישי ובהתאם למדיניות Elysia.')
WHERE cardinality("commerceHighlights") = 0;

UPDATE "Product"
SET
  "availabilityMode" = 'MADE_TO_ORDER',
  "commerceHighlights" = ARRAY['פרטי ההתאמה יאושרו מראש', 'הכנה אישית במידה ובגוון']::TEXT[]
WHERE "slug" = 'muse-pearl-earrings';

UPDATE "Product"
SET
  "availabilityMode" = 'CONSULTATION',
  "commerceHighlights" = ARRAY['שיחת התאמה לפני הבחירה', 'אבן שנבחנה בקפידה']::TEXT[]
WHERE "slug" = 'venus-line-ring';
