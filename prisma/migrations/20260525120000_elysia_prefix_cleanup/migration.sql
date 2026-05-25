CREATE OR REPLACE FUNCTION _elysia_retired_brand_cleanup(input text)
RETURNS text AS $$
DECLARE
  legacy_prefix text := chr(65) || chr(80) || chr(72);
  replacement_prefix text := 'ELY';
  retired_brand_one text := chr(65) || chr(112) || chr(104) || chr(114) || chr(111) || chr(100) || chr(105) || chr(116) || chr(101);
  retired_brand_two text := chr(65) || chr(102) || chr(114) || chr(111) || chr(100) || chr(105) || chr(116) || chr(101);
  retired_hebrew_one text := chr(1488) || chr(1508) || chr(1512) || chr(1493) || chr(1491) || chr(1497) || chr(1496) || chr(1492);
  retired_hebrew_two text := chr(1488) || chr(1508) || chr(1512) || chr(1491) || chr(1497) || chr(1496) || chr(1492);
  replacement_brand text := 'elysia';
  output text := input;
BEGIN
  IF output IS NULL THEN
    RETURN NULL;
  END IF;

  output := regexp_replace(
    output,
    '\m' || legacy_prefix || '([-0-9])',
    replacement_prefix || '\1',
    'g'
  );
  output := regexp_replace(
    output,
    '\m' || lower(legacy_prefix) || '([-0-9])',
    lower(replacement_prefix) || '\1',
    'g'
  );

  output := replace(output, retired_brand_one, replacement_brand);
  output := replace(output, lower(retired_brand_one), replacement_brand);
  output := replace(output, upper(retired_brand_one), replacement_brand);
  output := replace(output, retired_brand_two, replacement_brand);
  output := replace(output, lower(retired_brand_two), replacement_brand);
  output := replace(output, upper(retired_brand_two), replacement_brand);
  output := replace(output, retired_hebrew_one, replacement_brand);
  output := replace(output, retired_hebrew_two, replacement_brand);

  RETURN output;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  target text[];
  text_targets text[][] := ARRAY[
    ARRAY['Product', 'sku'],
    ARRAY['Product', 'name'],
    ARRAY['Product', 'shortDescription'],
    ARRAY['Product', 'description'],
    ARRAY['Product', 'deliveryPromise'],
    ARRAY['Product', 'returnPolicy'],
    ARRAY['Product', 'careInstructions'],
    ARRAY['Product', 'warranty'],
    ARRAY['ProductVariant', 'sku'],
    ARRAY['ProductVariant', 'name'],
    ARRAY['ProductMedia', 'alt'],
    ARRAY['Branch', 'name'],
    ARRAY['InventoryLedger', 'reason'],
    ARRAY['InventoryLedger', 'reference'],
    ARRAY['ServiceRequest', 'orderNumber'],
    ARRAY['ServiceRequest', 'productReference'],
    ARRAY['ServiceRequest', 'message'],
    ARRAY['ServiceRequest', 'adminNotes'],
    ARRAY['Cart', 'couponCode'],
    ARRAY['Cart', 'giftMessage'],
    ARRAY['Coupon', 'code'],
    ARRAY['Coupon', 'description'],
    ARRAY['Order', 'orderNumber'],
    ARRAY['OrderItem', 'name'],
    ARRAY['OrderItem', 'sku'],
    ARRAY['Payment', 'providerPaymentId'],
    ARRAY['Payment', 'providerStatus'],
    ARRAY['Payment', 'failureCode'],
    ARRAY['Shipment', 'tracking'],
    ARRAY['Shipment', 'status'],
    ARRAY['ReturnRequest', 'reason'],
    ARRAY['ReturnRequest', 'notes'],
    ARRAY['NewsletterSubscription', 'source'],
    ARRAY['NewsletterSubscription', 'consentText'],
    ARRAY['OfflineActionReceipt', 'kind'],
    ARRAY['OfflineActionReceipt', 'status'],
    ARRAY['OfflineActionReceipt', 'lastError'],
    ARRAY['PushSubscription', 'userAgent'],
    ARRAY['PushCampaign', 'title'],
    ARRAY['PushCampaign', 'body'],
    ARRAY['PushCampaign', 'targetUrl'],
    ARRAY['PushCampaign', 'lastError'],
    ARRAY['PushDelivery', 'status'],
    ARRAY['PushDelivery', 'error'],
    ARRAY['RecommendationSession', 'model'],
    ARRAY['AiRun', 'model'],
    ARRAY['AiRun', 'promptVersion'],
    ARRAY['AiRun', 'error'],
    ARRAY['AiToolCall', 'name'],
    ARRAY['AiToolCall', 'error'],
    ARRAY['AiProviderUsage', 'provider'],
    ARRAY['AiProviderUsage', 'model'],
    ARRAY['AiProviderUsage', 'purpose'],
    ARRAY['AiProviderUsage', 'status'],
    ARRAY['TryOnSession', 'inputMediaUrl'],
    ARRAY['TryOnSession', 'outputMediaUrl'],
    ARRAY['SearchEvent', 'query'],
    ARRAY['AuditLog', 'action'],
    ARRAY['AuditLog', 'entity'],
    ARRAY['AuditLog', 'entityId'],
    ARRAY['WebhookEvent', 'eventType'],
    ARRAY['WebhookEvent', 'externalId'],
    ARRAY['OutboxEvent', 'type'],
    ARRAY['OutboxEvent', 'aggregateType'],
    ARRAY['OutboxEvent', 'aggregateId'],
    ARRAY['OutboxEvent', 'idempotencyKey'],
    ARRAY['OutboxEvent', 'lastError'],
    ARRAY['JobRun', 'name'],
    ARRAY['JobRun', 'lastError'],
    ARRAY['IntegrationJob', 'provider'],
    ARRAY['IntegrationJob', 'jobType'],
    ARRAY['IntegrationJob', 'status'],
    ARRAY['IntegrationJob', 'lastError']
  ];
  json_targets text[][] := ARRAY[
    ARRAY['Branch', 'openingHours', 'jsonb'],
    ARRAY['OfflineActionReceipt', 'result', 'jsonb'],
    ARRAY['Cart', 'mergeMetadata', 'jsonb'],
    ARRAY['Order', 'shippingAddress', 'jsonb'],
    ARRAY['Payment', 'rawPayload', 'jsonb'],
    ARRAY['RecommendationSession', 'input', 'jsonb'],
    ARRAY['RecommendationSession', 'output', 'jsonb'],
    ARRAY['AiRun', 'input', 'jsonb'],
    ARRAY['AiRun', 'output', 'jsonb'],
    ARRAY['AiRun', 'metadata', 'jsonb'],
    ARRAY['AiToolCall', 'input', 'jsonb'],
    ARRAY['AiToolCall', 'output', 'jsonb'],
    ARRAY['AiProviderUsage', 'metadata', 'jsonb'],
    ARRAY['TryOnSession', 'metadata', 'jsonb'],
    ARRAY['SearchEvent', 'filters', 'jsonb'],
    ARRAY['AuditLog', 'metadata', 'jsonb'],
    ARRAY['WebhookEvent', 'payload', 'jsonb'],
    ARRAY['OutboxEvent', 'payload', 'jsonb'],
    ARRAY['JobRun', 'metadata', 'jsonb'],
    ARRAY['IntegrationJob', 'payload', 'jsonb']
  ];
BEGIN
  FOREACH target SLICE 1 IN ARRAY text_targets LOOP
    EXECUTE format(
      'UPDATE %I SET %I = _elysia_retired_brand_cleanup(%I) WHERE %I IS DISTINCT FROM _elysia_retired_brand_cleanup(%I)',
      target[1],
      target[2],
      target[2],
      target[2],
      target[2]
    );
  END LOOP;

  UPDATE "Product"
  SET "tags" = ARRAY(
    SELECT _elysia_retired_brand_cleanup(tag)
    FROM unnest("tags") AS tag
  )
  WHERE "tags" IS NOT NULL;

  FOREACH target SLICE 1 IN ARRAY json_targets LOOP
    EXECUTE format(
      'UPDATE %I SET %I = _elysia_retired_brand_cleanup(%I::text)::%s WHERE %I IS NOT NULL AND %I::text IS DISTINCT FROM _elysia_retired_brand_cleanup(%I::text)',
      target[1],
      target[2],
      target[2],
      target[3],
      target[2],
      target[2],
      target[2]
    );
  END LOOP;
END $$;

DROP FUNCTION _elysia_retired_brand_cleanup(text);
