export const pushCampaignSegments = [
  "MARKETING_OPT_IN",
  "TRANSACTIONAL_OPT_IN",
  "ALL_ACTIVE",
] as const;

export type PushCampaignSegment = (typeof pushCampaignSegments)[number];

export function createPushCampaignDryRunPreview(input: {
  audienceCount: number;
  body: string;
  configured: boolean;
  segment: PushCampaignSegment;
  targetUrl: string;
  title: string;
}) {
  let normalizedTargetUrl = input.targetUrl.trim();
  let targetUrlValid = true;

  try {
    normalizedTargetUrl = normalizeInternalPushTargetUrl(input.targetUrl);
  } catch {
    targetUrlValid = false;
  }

  return {
    audienceCount: input.audienceCount,
    canSend: input.configured && input.audienceCount > 0 && targetUrlValid,
    invalidTargetCase: targetUrlValid ? null : "Push target URL is invalid.",
    missingSubscriptionCase:
      input.audienceCount === 0
        ? "No active push subscriptions match this segment."
        : null,
    payload: {
      body: input.body.trim(),
      segment: input.segment,
      targetUrl: normalizedTargetUrl,
      title: input.title.trim(),
    },
  };
}

export function normalizeInternalPushTargetUrl(
  value: string,
  baseUrl = "https://elysia.co.il",
) {
  const url = new URL(value, baseUrl);
  const base = new URL(baseUrl);

  if (url.origin !== base.origin) {
    throw new Error("Push target URL must stay on Elysia.");
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
