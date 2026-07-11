import { Router } from 'express';

import { adminRoutes } from '../modules/admin/admin.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { drillCategoryRoutes } from '../modules/drill-category/drill-category.routes';
import { drillRoutes } from '../modules/drill/drill.routes';
import { healthRoutes } from '../modules/health/health.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { paymentRoutes } from '../modules/payment/payment.routes';
import { revenueCatRoutes } from '../modules/revenuecat/revenuecat.routes';
import { reportRoutes } from '../modules/report/report.routes';
import { settingsRoutes } from '../modules/settings/settings.routes';
import { situationController } from '../modules/situation/situation.controller';
import { situationRoutes } from '../modules/situation/situation.routes';
import { uploadRoutes } from '../modules/upload/upload.routes';

export const router = Router();

router.use('/health', healthRoutes);
router.get('/featured-situations', situationController.getFeatured);
router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/settings', settingsRoutes);
router.use('/situations', situationRoutes);
router.use('/drill-categories', drillCategoryRoutes);
router.use('/drills', drillRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/revenuecat', revenueCatRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/uploads', uploadRoutes);
