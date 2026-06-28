import { drillCategoryModel } from '../drill-category/drill-category.model';
import { drillModel } from '../drill/drill.model';
import { transactionModel } from '../payment/payment.model';
import { appUserModel } from '../auth/app-user.model';

const getOverview = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    categoryCount,
    totalUsers,
    freeDrills,
    premiumDrills,
    transactions,
    totalPurchases,
    monthlyRevenueAgg,
  ] = await Promise.all([
    drillCategoryModel.countDocuments(),
    appUserModel.countDocuments(),
    drillModel.countDocuments({ accessLevel: 'free' }),
    drillModel.countDocuments({ accessLevel: 'premium' }),
    transactionModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('userEmail purchaseType amount status paymentMethod createdAt')
      .lean(),
    transactionModel.countDocuments(),
    transactionModel.aggregate([
      { $match: { createdAt: { $gte: monthStart }, status: { $ne: 'failed' } } },
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
    monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
    categoryCount,
    totalDrillCategories: categoryCount,
    totalUsers,
    totalFreeDrills: freeDrills,
    totalPremiumDrills: premiumDrills,
    recentActivity: transactions.map((item) => ({
      id: String(item._id),
      userEmail: item.userEmail,
      purchaseType: item.purchaseType,
      amount: item.amount,
      status: item.status || 'paid',
      paymentMethod: item.paymentMethod || 'manual',
      date: item.createdAt,
    })),
  };
};

export const dashboardService = {
  getOverview,
};
