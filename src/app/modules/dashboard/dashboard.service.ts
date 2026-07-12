import { drillCategoryModel } from '../drill-category/drill-category.model';
import { drillModel } from '../drill/drill.model';
import { transactionModel } from '../payment/payment.model';

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

const getOverview = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activityFilter = { status: { $in: ['paid', 'pending'] } };
  const productionRevenueCatFilter = {
    revenueCatEventId: { $ne: null },
    environment: 'PRODUCTION',
  };
  const purchaseCountFilter = {
    ...productionRevenueCatFilter,
    status: { $in: ['paid', 'pending'] },
  };
  const revenueFilter = {
    ...productionRevenueCatFilter,
    status: 'paid',
  };
  const revenueCatUserFilter = {
    revenueCatEventId: { $ne: null },
  };
  const revenueCatPremiumUserFilter = {
    ...revenueCatUserFilter,
    status: { $in: ['paid', 'pending'] },
  };
  const [
    categoryCount,
    revenueCatUsers,
    revenueCatPremiumUsers,
    freeDrills,
    premiumDrills,
    transactions,
    totalPurchases,
    totalRevenueAgg,
    monthlyRevenueAgg,
  ] = await Promise.all([
    drillCategoryModel.countDocuments(),
    transactionModel.distinct('userEmail', revenueCatUserFilter),
    transactionModel.distinct('userEmail', revenueCatPremiumUserFilter),
    drillModel.countDocuments({ accessLevel: 'free' }),
    drillModel.countDocuments({ accessLevel: 'premium' }),
    transactionModel
      .find(activityFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'userEmail purchaseType amount status paymentMethod store environment currency revenueCatEventId purchasedAt createdAt',
      )
      .lean(),
    transactionModel.countDocuments(purchaseCountFilter),
    transactionModel.aggregate([
      { $match: revenueFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    transactionModel.aggregate([
      {
        $match: {
          ...revenueFilter,
          $expr: { $gte: [getRevenueDateExpression, monthStart] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  return {
    totalPurchases,
    totalRevenue: normalizeMoneyValue(totalRevenueAgg[0]?.total),
    monthlyRevenue: normalizeMoneyValue(monthlyRevenueAgg[0]?.total),
    categoryCount,
    totalDrillCategories: categoryCount,
    totalUsers: revenueCatUsers.length,
    premiumUsers: revenueCatPremiumUsers.length,
    totalFreeDrills: freeDrills,
    totalPremiumDrills: premiumDrills,
    recentActivity: transactions.map((item) => ({
      id: String(item._id),
      userEmail: item.userEmail,
      purchaseType: item.purchaseType,
      amount: normalizeMoneyValue(item.amount),
      status: item.status || 'paid',
      paymentMethod: item.paymentMethod || item.store || 'manual',
      store: item.store || null,
      environment: item.environment || null,
      currency: item.currency || 'USD',
      source:
        item.revenueCatEventId || item.paymentMethod === 'revenuecat'
          ? 'revenuecat'
          : item.paymentMethod || item.store || 'manual',
      date: item.purchasedAt || item.createdAt,
    })),
  };
};

export const dashboardService = {
  getOverview,
};
