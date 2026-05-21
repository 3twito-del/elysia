UPDATE "Product"
SET
  "commerceHighlights" = ARRAY['מחיר גלוי לפני שמירה', 'בדיקת איכות לפני מסירה']::TEXT[],
  "deliveryPromise" = COALESCE("deliveryPromise", 'משלוח עד הבית לאחר אימות פרטי ההזמנה.'),
  "returnPolicy" = COALESCE("returnPolicy", 'החלפה או החזרה מתואמת לפי מדיניות האתר.')
WHERE cardinality("commerceHighlights") = 0;

UPDATE "Product"
SET
  "availabilityMode" = 'MADE_TO_ORDER',
  "commerceHighlights" = ARRAY['מחיר גלוי לפני התאמה', 'ייצור לפי מידה וגוון']::TEXT[]
WHERE "slug" = 'muse-pearl-earrings';

UPDATE "Product"
SET
  "availabilityMode" = 'CONSULTATION',
  "commerceHighlights" = ARRAY['ייעוץ התאמה לפני שמירה', 'בחירת אבן מאומתת']::TEXT[]
WHERE "slug" = 'venus-line-ring';
