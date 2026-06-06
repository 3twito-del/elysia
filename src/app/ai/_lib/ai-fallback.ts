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
        "ניתן להמשיך דרך החיפוש, מדריך המידות או פנייה לשירות.",
      kind: "quota",
      serviceMessage:
        "כלי ההתאמה היה עמוס. אבקש עזרה בבחירת תכשיט או מתנה.",
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
        "ניתן להמשיך במסלולי הבחירה הרגילים או להשאיר פנייה.",
      kind: "unavailable",
      serviceMessage:
        "כלי ההתאמה לא היה זמין. אבקש עזרה ידנית בבחירת תכשיט.",
      title: "ההתאמה החכמה אינה זמינה כרגע",
    };
  }

  return {
    detail:
      "ניתן להמשיך לחיפוש, לבדוק מידות או לפתוח פנייה קצרה.",
    kind: "unknown",
    serviceMessage:
      "כלי ההתאמה לא השלים את הבקשה. אבקש עזרה בבחירת תכשיט.",
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
