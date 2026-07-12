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

type RevenueCatList<T = Record<string, unknown>> = {
  items?: T[];
  next_page?: string | null;
  object?: string;
  url?: string;
};

type RevenueCatLiveTransaction = {
  amount: number;
  amountUsd: number;
  currency: string;
  date: string;
  environment: string | null;
  id: string;
  paymentDate: string;
  paymentMethod: string;
  purchaseType: string;
  source: 'revenuecat';
  status: 'expired' | 'paid' | 'pending' | 'refunded';
  store: string | null;
  subscriptionStatus: 'expired' | 'paid' | 'pending' | 'refunded';
  userEmail: string;
};

type RevenueCatLiveSnapshot = {
  monthlyRevenue: number;
  recentActivity: RevenueCatLiveTransaction[];
  totalPurchases: number;
  totalRevenue: number;
  totalUsers: number;
  premiumUsers: number;
  transactions: RevenueCatLiveTransaction[];
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
const REVENUECAT_API_V2_BASE_URL = 'https://api.revenuecat.com/v2';
const REVENUECAT_LIVE_CACHE_TTL_MS = 60_000;

let revenueCatProjectIdCache: string | null = null;
let revenueCatLiveSnapshotCache:
  | {
      data?: RevenueCatLiveSnapshot;
      expiresAt: number;
      promise?: Promise<RevenueCatLiveSnapshot>;
    }
  | null = null;

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

  if (
    event.entitlement_ids?.includes('premium_access') ||
    event.entitlement_id === 'premium_access'
  ) {
    return 'Premium Access';
  }

  return event.product_id || event.entitlement_id || event.type || 'RevenueCat Purchase';
};

const getAmount = (event: RevenueCatEvent) => {
  if (
    typeof event.price_in_purchased_currency === 'number' &&
    Number.isFinite(event.price_in_purchased_currency)
  ) {
    return event.price_in_purchased_currency;
  }

  if (typeof event.price === 'number' && Number.isFinite(event.price)) {
    return event.price;
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

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getNestedValue = (value: unknown, path: string) => {
  return path.split('.').reduce<unknown>((current, segment) => {
    const record = toRecord(current);
    return record ? record[segment] : undefined;
  }, value);
};

const getStringValue = (value: unknown, paths: string[]) => {
  for (const path of paths) {
    const candidate = getNestedValue(value, path);

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const getNumberValue = (value: unknown, paths: string[]) => {
  for (const path of paths) {
    const candidate = getNestedValue(value, path);

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getTimestampValue = (value: unknown, paths: string[]) => {
  for (const path of paths) {
    const candidate = getNestedValue(value, path);

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string' && candidate.trim()) {
      const parsed = Date.parse(candidate);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const normalizeRevenueCatLiveStatus = (
  rawStatus: string | null,
  record: Record<string, unknown>,
): RevenueCatLiveTransaction['status'] => {
  if (getTimestampValue(record, ['refunded_at', 'revoked_at'])) {
    return 'refunded';
  }

  const normalized = rawStatus?.trim().toLowerCase();

  if (!normalized) {
    return 'paid';
  }

  if (
    normalized.includes('refund') ||
    normalized.includes('revoke') ||
    normalized.includes('cancel')
  ) {
    return 'refunded';
  }

  if (
    normalized.includes('billing') ||
    normalized.includes('grace') ||
    normalized.includes('pause') ||
    normalized.includes('pending') ||
    normalized.includes('trial')
  ) {
    return 'pending';
  }

  if (normalized.includes('expire') || normalized.includes('inactive')) {
    return 'expired';
  }

  return 'paid';
};

const mapRevenueCatStore = (value: string | null) => {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
};

const getRevenueCatCustomerEmail = (customer: Record<string, unknown>) => {
  const emailFromAttributes = getStringValue(customer, [
    'attributes.items.0.value',
  ]);

  const attributes = getNestedValue(customer, 'attributes.items');

  if (Array.isArray(attributes)) {
    for (const attribute of attributes) {
      const record = toRecord(attribute);

      if (!record) {
        continue;
      }

      const name = typeof record.name === 'string' ? record.name : '';
      const value = typeof record.value === 'string' ? record.value.trim() : '';

      if ((name === '$email' || name === 'email') && value) {
        return value.toLowerCase();
      }
    }
  }

  const fallbackId = getStringValue(customer, ['id']);

  if (emailFromAttributes && isEmailLike(emailFromAttributes)) {
    return emailFromAttributes.toLowerCase();
  }

  if (fallbackId) {
    return fallbackId;
  }

  return 'revenuecat:unknown-user';
};

const hasActiveEntitlements = (customer: Record<string, unknown>) => {
  const entitlements = getNestedValue(customer, 'active_entitlements.items');
  return Array.isArray(entitlements) && entitlements.length > 0;
};

const getRevenueCatApiKey = () => {
  const apiKey = env.REVENUECAT_SECRET_API_KEY?.trim();

  if (!apiKey) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'RevenueCat secret API key is not configured on the server.',
    );
  }

  return apiKey;
};

const getRevenueCatApiUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${REVENUECAT_API_V2_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const fetchRevenueCatApi = async <T>(path: string): Promise<T> => {
  const response = await fetch(getRevenueCatApiUrl(path), {
    headers: {
      Authorization: `Bearer ${getRevenueCatApiKey()}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    const message =
      (typeof payload.message === 'string' && payload.message) ||
      (typeof payload.type === 'string' && payload.type) ||
      `RevenueCat API request failed with status ${response.status}.`;

    if (message.includes('incompatible with RevenueCat API V1')) {
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'RevenueCat live dashboard requires a RevenueCat API v2 secret key.',
      );
    }

    throw new ApiError(StatusCodes.BAD_GATEWAY, message);
  }

  return payload as T;
};

const listRevenueCatItems = async <T>(path: string) => {
  const items: T[] = [];
  let nextPath: string | null = path;

  while (nextPath) {
    const page: RevenueCatList<T> = await fetchRevenueCatApi<RevenueCatList<T>>(nextPath);
    items.push(...(Array.isArray(page.items) ? page.items : []));

    nextPath = typeof page.next_page === 'string' && page.next_page.trim()
      ? page.next_page
      : null;
  }

  return items;
};

const getRevenueCatProjectId = async () => {
  if (revenueCatProjectIdCache) {
    return revenueCatProjectIdCache;
  }

  const projects = await listRevenueCatItems<Record<string, unknown>>('/projects?limit=100');

  if (!projects.length) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No RevenueCat projects were found.');
  }

  const preferredProject =
    projects.find((project) => getStringValue(project, ['name']) === 'Marietta Baseball Academy') ??
    projects[0];

  const projectId = getStringValue(preferredProject, ['id']);

  if (!projectId) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'RevenueCat project ID could not be resolved.');
  }

  revenueCatProjectIdCache = projectId;
  return projectId;
};

const getRevenueCatActivityAmountUsd = (record: Record<string, unknown>, displayAmount: number, currency: string) => {
  const usdAmount = getNumberValue(record, [
    'total_revenue_in_usd.gross',
    'revenue_in_usd.gross',
    'price_in_usd.gross',
    'price_in_usd',
  ]);

  if (usdAmount !== null) {
    return usdAmount;
  }

  return currency === 'USD' ? displayAmount : 0;
};

const getRevenueCatActivityAmount = (record: Record<string, unknown>) => {
  return (
    getNumberValue(record, [
      'price_in_purchased_currency',
      'price',
      'total_revenue_in_usd.gross',
      'revenue_in_usd.gross',
      'price_in_usd.gross',
      'price_in_usd',
    ]) ?? 0
  );
};

const getRevenueCatActivityCurrency = (record: Record<string, unknown>) => {
  return (
    getStringValue(record, [
      'purchased_currency',
      'currency',
    ]) ?? 'USD'
  );
};

const getRevenueCatActivityDate = (record: Record<string, unknown>) => {
  const timestamp = getTimestampValue(record, [
    'purchased_at',
    'purchased_at_ms',
    'starts_at',
    'current_period_starts_at',
    'first_seen_at',
    'updated_at',
    'created_at',
  ]);

  return new Date(timestamp ?? Date.now()).toISOString();
};

const getRevenueCatActivityType = (record: Record<string, unknown>) => {
  const productIdentifier = getStringValue(record, [
    'product_identifier',
    'product_id',
    'product.store_identifier',
    'store_identifier',
  ]);

  if (productIdentifier === 'mba_premium_lifetime') {
    return 'Unlock All Drills';
  }

  return (
    getStringValue(record, [
      'display_name',
      'name',
      'product.display_name',
      'product.name',
      'product_identifier',
      'product_id',
      'store_identifier',
    ]) ?? 'RevenueCat Purchase'
  );
};

const mapRevenueCatActivity = (
  customer: Record<string, unknown>,
  item: unknown,
  activityKind: 'purchase' | 'subscription',
): RevenueCatLiveTransaction | null => {
  const record = toRecord(item);

  if (!record) {
    return null;
  }

  const amount = getRevenueCatActivityAmount(record);
  const currency = getRevenueCatActivityCurrency(record);
  const date = getRevenueCatActivityDate(record);
  const rawStatus =
    getStringValue(record, ['status', 'state', 'auto_renewal_status']) ??
    (activityKind === 'purchase' ? 'paid' : null);
  const status = normalizeRevenueCatLiveStatus(rawStatus, record);
  const store = mapRevenueCatStore(
    getStringValue(record, ['store', 'platform', 'app.type']),
  );

  return {
    id:
      getStringValue(record, ['id', 'store_transaction_identifier', 'store_purchase_identifier']) ??
      `${getStringValue(customer, ['id']) ?? 'customer'}:${activityKind}:${date}`,
    userEmail: getRevenueCatCustomerEmail(customer),
    purchaseType: getRevenueCatActivityType(record),
    amount,
    amountUsd: getRevenueCatActivityAmountUsd(record, amount, currency),
    currency,
    date,
    paymentDate: date,
    paymentMethod: store ?? 'revenuecat',
    store,
    environment: getStringValue(record, ['environment'])?.toUpperCase() ?? null,
    source: 'revenuecat',
    status,
    subscriptionStatus: status,
  };
};

const getCustomerActivity = async (
  projectId: string,
  customer: Record<string, unknown>,
) => {
  const customerId = getStringValue(customer, ['id']);

  if (!customerId) {
    return [];
  }

  const [purchases, subscriptions] = await Promise.all([
    listRevenueCatItems<Record<string, unknown>>(
      `/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(customerId)}/purchases?limit=100`,
    ),
    listRevenueCatItems<Record<string, unknown>>(
      `/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(customerId)}/subscriptions?limit=100`,
    ),
  ]);

  return [...purchases.map((item) => mapRevenueCatActivity(customer, item, 'purchase')), ...subscriptions.map((item) => mapRevenueCatActivity(customer, item, 'subscription'))]
    .filter((item): item is RevenueCatLiveTransaction => Boolean(item));
};

const sortRevenueCatTransactions = (transactions: RevenueCatLiveTransaction[]) => {
  return [...transactions].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
};

const buildRevenueCatLiveSnapshot = async (): Promise<RevenueCatLiveSnapshot> => {
  const projectId = await getRevenueCatProjectId();
  const customers = await listRevenueCatItems<Record<string, unknown>>(
    `/projects/${encodeURIComponent(projectId)}/customers?limit=100`,
  );

  const nestedActivities = await Promise.all(
    customers.map((customer) => getCustomerActivity(projectId, customer)),
  );

  const transactions = sortRevenueCatTransactions(nestedActivities.flat());
  const activeTransactions = transactions.filter(
    (transaction) => transaction.status === 'paid' || transaction.status === 'pending',
  );
  const premiumUsersFromTransactions = new Set(
    activeTransactions.map((transaction) => transaction.userEmail),
  );
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const productionPaidTransactions = transactions.filter(
    (transaction) =>
      transaction.status === 'paid' &&
      transaction.environment === 'PRODUCTION',
  );

  return {
    totalUsers: customers.length,
    premiumUsers: customers.filter((customer) => {
      const customerEmail = getRevenueCatCustomerEmail(customer);
      return hasActiveEntitlements(customer) || premiumUsersFromTransactions.has(customerEmail);
    }).length,
    totalPurchases: activeTransactions.length,
    totalRevenue: productionPaidTransactions.reduce(
      (sum, transaction) => sum + transaction.amountUsd,
      0,
    ),
    monthlyRevenue: productionPaidTransactions
      .filter((transaction) => new Date(transaction.date) >= monthStart)
      .reduce((sum, transaction) => sum + transaction.amountUsd, 0),
    recentActivity: transactions.slice(0, 10),
    transactions,
  };
};

const getRevenueCatLiveSnapshot = async () => {
  const now = Date.now();

  if (revenueCatLiveSnapshotCache?.data && revenueCatLiveSnapshotCache.expiresAt > now) {
    return revenueCatLiveSnapshotCache.data;
  }

  if (revenueCatLiveSnapshotCache?.promise) {
    return revenueCatLiveSnapshotCache.promise;
  }

  const promise = buildRevenueCatLiveSnapshot()
    .then((data) => {
      revenueCatLiveSnapshotCache = {
        data,
        expiresAt: Date.now() + REVENUECAT_LIVE_CACHE_TTL_MS,
      };

      return data;
    })
    .catch((error) => {
      revenueCatLiveSnapshotCache = null;
      throw error;
    });

  revenueCatLiveSnapshotCache = {
    expiresAt: 0,
    promise,
  };

  return promise;
};

const invalidateRevenueCatLiveSnapshotCache = () => {
  revenueCatLiveSnapshotCache = null;
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
    invalidateRevenueCatLiveSnapshotCache();

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

  invalidateRevenueCatLiveSnapshotCache();

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
  getRevenueCatLiveSnapshot,
  invalidateRevenueCatLiveSnapshotCache,
};
