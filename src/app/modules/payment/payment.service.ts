import { appUserModel } from '../auth/app-user.model';
import { revenueCatService } from '../revenuecat/revenuecat.service';
import { settingsService } from '../settings/settings.service';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { transactionModel } from './payment.model';

const getAll = async (query: {
  page?: unknown;
  limit?: unknown;
  status?: unknown;
  search?: unknown;
} = {}) => {
  const { page, limit, skip } = getPagination(query);
  const price = await settingsService.getUnlockPrice();
  const status = typeof query.status === 'string' ? query.status.toLowerCase() : '';
  const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
  const liveSnapshot = await revenueCatService.getRevenueCatLiveSnapshot();

  const filteredTransactions = liveSnapshot.transactions.filter((transaction) => {
    if (status && status !== 'all' && transaction.status !== status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      transaction.userEmail,
      transaction.purchaseType,
      transaction.paymentMethod,
      transaction.store,
      transaction.environment,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  const pagedTransactions = filteredTransactions.slice(skip, skip + limit);

  return {
    fullUnlockPrice: price,
    transactions: pagedTransactions,
    pagination: buildPaginationMeta(page, limit, filteredTransactions.length),
  };
};

const getSummary = async () => {
  const liveSnapshot = await revenueCatService.getRevenueCatLiveSnapshot();

  return {
    totalPurchases: liveSnapshot.totalPurchases,
    totalRevenue: liveSnapshot.totalRevenue,
    monthlyRevenue: liveSnapshot.monthlyRevenue,
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

  revenueCatService.invalidateRevenueCatLiveSnapshotCache();

  return {
    success: true,
    transactionId: String(transaction._id),
    amount: transaction.amount,
  };
};

const updatePrice = async (price: number) => {
  await settingsService.updateUnlockPrice(price);
  return price;
};

export const paymentService = {
  getAll,
  getSummary,
  completePurchase,
  updatePrice,
};
