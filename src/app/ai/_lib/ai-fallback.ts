export type AiFallbackKind = "quota" | "unavailable" | "unknown";

export type AiFallbackCopy = {
  detail: string;
  kind: AiFallbackKind;
  serviceMessage: string;
  title: string;
};

export function getAiFallbackCopy(reason?: string | null): AiFallbackCopy {
  const normalized = reason?.toLowerCase() ?? "";

  if (
    /quota|rate.?limit|too many|429|resource_exhausted|insufficient/u.test(
      normalized,
    )
  ) {
    return {
      detail:
        "אפשר להמשיך דרך החיפוש, מדריך המידות או פנייה לשירות בזמן שהכלי מתפנה.",
      kind: "quota",
      serviceMessage:
        "כלי ההתאמה החכמה היה עמוס. אשמח לעזרה בבחירת תכשיט או מתנה.",
      title: "כלי ההתאמה עמוס כרגע",
    };
  }

  if (
    /missing|unavailable|provider|gateway|api[_ -]?key|oidc|configured|free-tier|not ready/u.test(
      normalized,
    )
  ) {
    return {
      detail:
        "אפשר להמשיך במסלולי הבחירה הרגילים, או להשאיר פנייה ונחזור עם התאמה ידנית.",
      kind: "unavailable",
      serviceMessage:
        "כלי ההתאמה החכמה לא היה זמין. אשמח לעזרה ידנית בבחירת תכשיט.",
      title: "ההתאמה החכמה אינה זמינה כרגע",
    };
  }

  return {
    detail:
      "הבחירה לא נעצרה. אפשר להמשיך לחיפוש, לבדוק מידות או לפתוח פנייה קצרה לשירות.",
    kind: "unknown",
    serviceMessage:
      "כלי ההתאמה החכמה לא השלים את הבקשה. אשמח לעזרה בבחירת תכשיט.",
    title: "לא הצלחנו להשלים את ההתאמה",
  };
}

export function createAiFallbackServiceHref(reason?: string | null) {
  const copy = getAiFallbackCopy(reason);
  const params = new URLSearchParams({
    topic: "general",
    message: copy.serviceMessage,
  });

  return `/service?${params.toString()}`;
}
