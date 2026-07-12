import { transactionModel } from './payment.model';
import { settingsService } from '../settings/settings.service';
import { appUserModel } from '../auth/app-user.model';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';

const normalizeMoneyValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRevenueDateExpression = {
  $ifNull: ['$purchasedAt', '$createdAt'],
};

const mapTransaction = (item: Record<string, unknown>) => ({
  id: String(item._id),
  userEmail: item.userEmail,
  fullName: item.userEmail,
  purchaseType: item.purchaseType,
  subscriptionStatus: item.status || 'paid',
  status: item.status || 'paid',
  amount: normalizeMoneyValue(item.amount),
  paymentDate: item.purchasedAt || item.createdAt,
  date: item.purchasedAt || item.createdAt,
  paymentMethod: item.paymentMethod || item.store || 'manual',
  store: item.store || null,
  environment: item.environment || null,
  currency: item.currency || 'USD',
  source:
    item.revenueCatEventId || item.paymentMethod === 'revenuecat'
      ? 'revenuecat'
      : item.store || item.paymentMethod || 'manual',
});

const PRODUCTION_REVENUECAT_FILTER = {
  revenueCatEventId: { $ne: null },
  environment: 'PRODUCTION',
};

const PURCHASE_COUNT_FILTER = {
  ...PRODUCTION_REVENUECAT_FILTER,
  status: { $in: ['paid', 'pending'] },
};

const REVENUE_FILTER = {
  ...PRODUCTION_REVENUECAT_FILTER,
  status: 'paid',
};

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const price = await settingsService.getUnlockPrice();
  const filter: Record<string, unknown> = {};
  const status = typeof query.status === 'string' ? query.status.toLowerCase() : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  if (status && status !== 'all') filter.status = status;
  if (search) {
    filter.$or = [
      { userEmail: { $regex: search, $options: 'i' } },
      { purchaseType: { $regex: search, $options: 'i' } },
      { paymentMethod: { $regex: search, $options: 'i' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    transactionModel.countDocuments(filter),
  ]);

  return {
    fullUnlockPrice: price,
    transactions: transactions.map((item) => mapTransaction(item as unknown as Record<string, unknown>)),
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getSummary = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalPurchases, revenueAgg, monthlyRevenueAgg] = await Promise.all([
    transactionModel.countDocuments(PURCHASE_COUNT_FILTER),
    transactionModel.aggregate([
      { $match: REVENUE_FILTER },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    transactionModel.aggregate([
      {
        $match: {
          ...REVENUE_FILTER,
          $expr: { $gte: [getRevenueDateExpression, monthStart] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    totalPurchases,
    totalRevenue: normalizeMoneyValue(revenueAgg[0]?.total),
    monthlyRevenue: normalizeMoneyValue(monthlyRevenueAgg[0]?.total),
  };
};

const completePurchase = async (payload: {
  email: string;
  country: string;
  purchaseType?: string;
}) => {
  const price = await settingsService.getUnlockPrice();
  const email = payload.email.toLowerCase();

  await appUserModel.findOneAndUpdate(
    { email },
    {
      email,
      isPremium: true,
      premiumUnlockedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const transaction = await transactionModel.create({
    userEmail: email,
    purchaseType: payload.purchaseType || 'Unlock All Drills',
    amount: price,
    country: payload.country,
    status: 'paid',
    paymentMethod: 'manual',
  });

  return {
    success: true,
    transactionId: String(transaction._id),
    amount: transaction.amount,
  };
};

const updatePrice = async (price: number) => {
  await settingsService.updateUnlockPrice(price);
};

export const paymentService = {
  getAll,
  getSummary,
  completePurchase,
  updatePrice,
};
