import { drillCategoryModel } from '../drill-category/drill-category.model';
import { transactionModel } from '../payment/payment.model';

const getOverview = async () => {
  const [categoryCount, transactions] = await Promise.all([
    drillCategoryModel.countDocuments(),
    transactionModel.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const totalPurchases = await transactionModel.countDocuments();
  const monthlyRevenueAgg = await transactionModel.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return {
    totalPurchases,
    monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
    categoryCount,
    recentActivity: transactions.map((item) => ({
      id: String(item._id),
      userEmail: item.userEmail,
      purchaseType: item.purchaseType,
      amount: item.amount,
      date: item.createdAt,
    })),
  };
};

export const dashboardService = {
  getOverview,
};
