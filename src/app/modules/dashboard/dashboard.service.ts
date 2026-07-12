import { drillCategoryModel } from '../drill-category/drill-category.model';
import { drillModel } from '../drill/drill.model';
import { revenueCatService } from '../revenuecat/revenuecat.service';

const getOverview = async () => {
  const [categoryCount, freeDrills, premiumDrills, liveSnapshot] = await Promise.all([
    drillCategoryModel.countDocuments(),
    drillModel.countDocuments({ accessLevel: 'free' }),
    drillModel.countDocuments({ accessLevel: 'premium' }),
    revenueCatService.getRevenueCatLiveSnapshot(),
  ]);

  return {
    totalPurchases: liveSnapshot.totalPurchases,
    totalRevenue: liveSnapshot.totalRevenue,
    monthlyRevenue: liveSnapshot.monthlyRevenue,
    categoryCount,
    totalDrillCategories: categoryCount,
    totalUsers: liveSnapshot.totalUsers,
    premiumUsers: liveSnapshot.premiumUsers,
    totalFreeDrills: freeDrills,
    totalPremiumDrills: premiumDrills,
    recentActivity: liveSnapshot.recentActivity,
  };
};

export const dashboardService = {
  getOverview,
};
