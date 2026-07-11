import { drillCategoryModel } from '../drill-category/drill-category.model';
import { drillModel } from '../drill/drill.model';
import { transactionModel } from '../payment/payment.model';
import { appUserModel } from '../auth/app-user.model';

const getOverview = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const purchaseCountFilter = { status: { $in: ['paid', 'pending'] } };
  const revenueFilter = { status: 'paid' };
  const [
    categoryCount,
    totalUsers,
    premiumUsers,
    freeDrills,
    premiumDrills,
    transactions,
    totalPurchases,
    totalRevenueAgg,
    monthlyRevenueAgg,
  ] = await Promise.all([
    drillCategoryModel.countDocuments(),
    appUserModel.countDocuments(),
    appUserModel.countDocuments({ isPremium: true }),
    drillModel.countDocuments({ accessLevel: 'free' }),
    drillModel.countDocuments({ accessLevel: 'premium' }),
    transactionModel
      .find(purchaseCountFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userEmail purchaseType amount status paymentMethod store purchasedAt createdAt')
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
      { $match: { ...revenueFilter, createdAt: { $gte: monthStart } } },
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
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
    categoryCount,
    totalDrillCategories: categoryCount,
    totalUsers,
    premiumUsers,
    totalFreeDrills: freeDrills,
    totalPremiumDrills: premiumDrills,
    recentActivity: transactions.map((item) => ({
      id: String(item._id),
      userEmail: item.userEmail,
      purchaseType: item.purchaseType,
      amount: item.amount,
      status: item.status || 'paid',
      paymentMethod: item.paymentMethod || item.store || 'manual',
      date: item.purchasedAt || item.createdAt,
    })),
  };
};

export const dashboardService = {
  getOverview,
};
