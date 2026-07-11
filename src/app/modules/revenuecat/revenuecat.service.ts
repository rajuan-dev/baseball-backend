import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { ApiError } from '../../errors/ApiError';
import { appUserModel } from '../auth/app-user.model';
import { transactionModel } from '../payment/payment.model';

type RevenueCatSubscriberAttribute = {
  value?: string | null;
  updated_at_ms?: number | null;
};

type RevenueCatEvent = {
  aliases?: string[];
  app_id?: string;
  app_user_id?: string | null;
  country_code?: string | null;
  currency?: string | null;
  entitlement_id?: string | null;
  entitlement_ids?: string[];
  environment?: string | null;
  event_timestamp_ms?: number | null;
  expiration_at_ms?: number | null;
  id?: string | null;
  original_app_user_id?: string | null;
  original_transaction_id?: string | null;
  presented_offering_id?: string | null;
  price?: number | null;
  price_in_purchased_currency?: number | null;
  product_id?: string | null;
  purchased_at_ms?: number | null;
  store?: string | null;
  subscriber_attributes?: Record<string, RevenueCatSubscriberAttribute> | null;
  transaction_id?: string | null;
  type?: string | null;
};

type RevenueCatWebhookPayload = {
  api_version?: string;
  event?: RevenueCatEvent;
};

const PURCHASE_CREATION_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
]);

const ACTIVATE_PREMIUM_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'REFUND_REVERSED',
]);

const DEACTIVATE_PREMIUM_EVENTS = new Set([
  'EXPIRATION',
]);

const REFUND_STATUS_EVENTS = new Set([
  'CANCELLATION',
]);

const PENDING_STATUS_EVENTS = new Set([
  'BILLING_ISSUE',
  'SUBSCRIPTION_PAUSED',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeAuthorizationValue = (value: string) => value.trim();

const normalizeExpectedAuthorizationValues = () => {
  const token = env.REVENUECAT_WEBHOOK_AUTH_TOKEN?.trim();

  if (!token) {
    return [];
  }

  return [token, `Bearer ${token}`].map(normalizeAuthorizationValue);
};

const getMsDate = (value?: number | null) => {
  if (!value || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value);
};

const isEmailLike = (value: string | null | undefined) =>
  Boolean(value && EMAIL_PATTERN.test(value.trim()));

const getSubscriberAttributeValue = (
  attributes: Record<string, RevenueCatSubscriberAttribute> | null | undefined,
  key: string,
) => {
  const value = attributes?.[key]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const getResolvedUserEmail = (event: RevenueCatEvent) => {
  const subscriberEmail =
    getSubscriberAttributeValue(event.subscriber_attributes, '$email') ??
    getSubscriberAttributeValue(event.subscriber_attributes, 'email');

  if (isEmailLike(subscriberEmail)) {
    return subscriberEmail!.toLowerCase();
  }

  const candidateIds = [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
  ];

  const emailLikeId = candidateIds.find((value) => isEmailLike(value));

  if (emailLikeId) {
    return emailLikeId.toLowerCase();
  }

  const fallbackId =
    event.original_app_user_id?.trim() ||
    event.app_user_id?.trim() ||
    event.aliases?.find((value) => value.trim())?.trim();

  if (fallbackId) {
    return `revenuecat:${fallbackId}`;
  }

  return 'revenuecat:unknown-user';
};

const getPurchaseType = (event: RevenueCatEvent) => {
  if (event.product_id === 'mba_premium_lifetime') {
    return 'Unlock All Drills';
  }

  if (event.entitlement_ids?.includes('premium_access') || event.entitlement_id === 'premium_access') {
    return 'Premium Access';
  }

  return event.product_id || event.entitlement_id || event.type || 'RevenueCat Purchase';
};

const getAmount = (event: RevenueCatEvent) => {
  if (typeof event.price === 'number' && Number.isFinite(event.price)) {
    return event.price;
  }

  if (
    typeof event.price_in_purchased_currency === 'number' &&
    Number.isFinite(event.price_in_purchased_currency)
  ) {
    return event.price_in_purchased_currency;
  }

  return 0;
};

const mapPaymentMethod = (event: RevenueCatEvent) => {
  const store = event.store?.toLowerCase();

  if (!store) {
    return 'revenuecat';
  }

  return store;
};

const getStatusForEvent = (eventType: string) => {
  if (REFUND_STATUS_EVENTS.has(eventType)) {
    return 'refunded' as const;
  }

  if (PENDING_STATUS_EVENTS.has(eventType)) {
    return 'pending' as const;
  }

  return 'paid' as const;
};

const updatePremiumAccessState = async (event: RevenueCatEvent, userEmail: string) => {
  const eventType = event.type ?? '';

  if (ACTIVATE_PREMIUM_EVENTS.has(eventType)) {
    await appUserModel.findOneAndUpdate(
      { email: userEmail },
      {
        email: userEmail,
        isPremium: true,
        isActive: true,
        premiumUnlockedAt: getMsDate(event.purchased_at_ms) ?? new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return;
  }

  if (DEACTIVATE_PREMIUM_EVENTS.has(eventType)) {
    await appUserModel.findOneAndUpdate(
      { email: userEmail },
      {
        email: userEmail,
        isPremium: false,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
};

const createTransactionFromEvent = async (event: RevenueCatEvent, userEmail: string) => {
  const eventType = event.type ?? 'UNKNOWN';

  if (!PURCHASE_CREATION_EVENTS.has(eventType)) {
    return null;
  }

  if (event.id) {
    const existing = await transactionModel.findOne({ revenueCatEventId: event.id }).lean();

    if (existing) {
      return {
        transactionId: String(existing._id),
        action: 'duplicate',
      } as const;
    }
  }

  const transaction = await transactionModel.create({
    userEmail,
    purchaseType: getPurchaseType(event),
    amount: getAmount(event),
    country: event.country_code || 'Unknown',
    status: getStatusForEvent(eventType),
    paymentMethod: mapPaymentMethod(event),
    currency: event.currency || null,
    store: event.store || null,
    environment: event.environment || null,
    productId: event.product_id || null,
    entitlementId: event.entitlement_id || event.entitlement_ids?.[0] || null,
    eventType,
    transactionId: event.transaction_id || null,
    originalTransactionId: event.original_transaction_id || event.transaction_id || null,
    revenueCatEventId: event.id || null,
    revenueCatAppUserId: event.app_user_id || null,
    originalAppUserId: event.original_app_user_id || null,
    aliases: event.aliases ?? [],
    purchasedAt: getMsDate(event.purchased_at_ms),
    expiresAt: getMsDate(event.expiration_at_ms),
    rawEvent: event,
  });

  return {
    transactionId: String(transaction._id),
    action: 'created',
  } as const;
};

const updateExistingTransactionFromEvent = async (event: RevenueCatEvent) => {
  const eventType = event.type ?? '';

  if (
    PURCHASE_CREATION_EVENTS.has(eventType) ||
    (!REFUND_STATUS_EVENTS.has(eventType) &&
      !PENDING_STATUS_EVENTS.has(eventType) &&
      !ACTIVATE_PREMIUM_EVENTS.has(eventType) &&
      !DEACTIVATE_PREMIUM_EVENTS.has(eventType))
  ) {
    return null;
  }

  const query =
    (event.original_transaction_id && { originalTransactionId: event.original_transaction_id }) ||
    (event.transaction_id && { transactionId: event.transaction_id }) ||
    null;

  if (!query) {
    return null;
  }

  const updated = await transactionModel
    .findOneAndUpdate(
      query,
      {
        $set: {
          status: getStatusForEvent(eventType),
          eventType,
          expiresAt: getMsDate(event.expiration_at_ms),
          rawEvent: event,
        },
      },
      { new: true },
    )
    .lean();

  if (!updated) {
    return null;
  }

  return {
    transactionId: String(updated._id),
    action: 'updated',
  } as const;
};

const verifyWebhookAuthorization = (authorizationHeader: string | undefined) => {
  const expectedValues = normalizeExpectedAuthorizationValues();

  if (expectedValues.length === 0) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'RevenueCat webhook auth token is not configured on the server.',
    );
  }

  const actualValue = authorizationHeader?.trim();

  if (!actualValue || !expectedValues.includes(actualValue)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized RevenueCat webhook request.');
  }
};

const processWebhook = async (payload: RevenueCatWebhookPayload) => {
  const event = payload.event;

  if (!event?.type) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'RevenueCat webhook payload is missing event.type.');
  }

  if (event.type === 'TEST') {
    return {
      action: 'ignored',
      eventType: event.type,
      reason: 'test_event',
    };
  }

  const resolvedUserEmail = getResolvedUserEmail(event);

  await updatePremiumAccessState(event, resolvedUserEmail);

  const createdTransaction = await createTransactionFromEvent(event, resolvedUserEmail);
  const updatedTransaction = createdTransaction
    ? null
    : await updateExistingTransactionFromEvent(event);

  return {
    action: createdTransaction?.action ?? updatedTransaction?.action ?? 'ignored',
    eventType: event.type,
    userEmail: resolvedUserEmail,
    transactionId: createdTransaction?.transactionId ?? updatedTransaction?.transactionId ?? null,
  };
};

export const revenueCatService = {
  verifyWebhookAuthorization,
  processWebhook,
};
