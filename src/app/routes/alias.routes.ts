import { Router } from 'express';

import { adminController } from '../modules/admin/admin.controller';
import { authController } from '../modules/auth/auth.controller';
import { dashboardController } from '../modules/dashboard/dashboard.controller';
import { drillCategoryController } from '../modules/drill-category/drill-category.controller';
import { drillController } from '../modules/drill/drill.controller';
import { paymentController } from '../modules/payment/payment.controller';
import { reportController } from '../modules/report/report.controller';
import { reportValidation } from '../modules/report/report.validation';
import { settingsController } from '../modules/settings/settings.controller';
import { situationController } from '../modules/situation/situation.controller';
import { uploadController } from '../modules/upload/upload.controller';
import { uploadMiddleware } from '../modules/upload/upload.middleware';
import { drillCategoryValidation } from '../modules/drill-category/drill-category.validation';
import { drillValidation } from '../modules/drill/drill.validation';
import { situationValidation } from '../modules/situation/situation.validation';
import { settingsValidation } from '../modules/settings/settings.validation';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAuth } from '../middlewares/auth';
import { catchAsync } from '../utils/catchAsync';
import { response } from '../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { situationService } from '../modules/situation/situation.service';
import { settingsService } from '../modules/settings/settings.service';

export const adminAliasRoutes = Router();
export const appAliasRoutes = Router();

adminAliasRoutes.post('/auth/login', authController.loginAdmin);
adminAliasRoutes.patch('/auth/change-password', requireAuth('admin'), adminController.changePassword);
adminAliasRoutes.get('/profile', requireAuth('admin'), adminController.getProfile);
adminAliasRoutes.patch('/profile', requireAuth('admin'), adminController.updateProfile);
adminAliasRoutes.get('/dashboard/stats', requireAuth('admin'), dashboardController.getOverview);

adminAliasRoutes.get('/drill-categories', requireAuth('admin'), drillCategoryController.getAll);
adminAliasRoutes.post(
  '/drill-categories',
  requireAuth('admin'),
  validateRequest(drillCategoryValidation.save),
  drillCategoryController.create,
);
adminAliasRoutes.get('/drill-categories/:id', requireAuth('admin'), drillCategoryController.getById);
adminAliasRoutes.patch(
  '/drill-categories/:id',
  requireAuth('admin'),
  validateRequest(drillCategoryValidation.save),
  drillCategoryController.update,
);
adminAliasRoutes.delete('/drill-categories/:id', requireAuth('admin'), drillCategoryController.remove);

adminAliasRoutes.get('/drills', requireAuth('admin'), drillController.getAll);
adminAliasRoutes.post('/drills', requireAuth('admin'), validateRequest(drillValidation.save), drillController.create);
adminAliasRoutes.get('/drills/:id', requireAuth('admin'), drillController.getById);
adminAliasRoutes.patch('/drills/:id', requireAuth('admin'), validateRequest(drillValidation.save), drillController.update);
adminAliasRoutes.delete('/drills/:id', requireAuth('admin'), drillController.remove);

adminAliasRoutes.get('/situations', requireAuth('admin'), situationController.getAll);
adminAliasRoutes.post('/situations', requireAuth('admin'), validateRequest(situationValidation.save), situationController.create);
adminAliasRoutes.get('/situations/:id', requireAuth('admin'), situationController.getById);
adminAliasRoutes.patch('/situations/:id', requireAuth('admin'), validateRequest(situationValidation.save), situationController.update);
adminAliasRoutes.delete('/situations/:id', requireAuth('admin'), situationController.remove);

adminAliasRoutes.get('/reports', requireAuth('admin'), reportController.getAll);
adminAliasRoutes.get('/reports/:id', requireAuth('admin'), reportController.getById);
adminAliasRoutes.patch(
  '/reports/:id/status',
  requireAuth('admin'),
  validateRequest(reportValidation.updateStatus),
  reportController.updateStatus,
);

adminAliasRoutes.get('/cms', requireAuth('admin'), settingsController.getAdminSettings);
const updateCmsSection = (section: 'privacyPolicy' | 'terms' | 'aboutUs') =>
  catchAsync(async (req, res) => {
    await settingsService.updateContentSection(section, req.body.value ?? req.body.content ?? '');
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Content updated successfully',
    });
  });

adminAliasRoutes.patch(
  '/cms/privacy-policy',
  requireAuth('admin'),
  validateRequest(settingsValidation.updateContent),
  updateCmsSection('privacyPolicy'),
);
adminAliasRoutes.patch(
  '/cms/terms-and-conditions',
  requireAuth('admin'),
  validateRequest(settingsValidation.updateContent),
  updateCmsSection('terms'),
);
adminAliasRoutes.patch(
  '/cms/about-us',
  requireAuth('admin'),
  validateRequest(settingsValidation.updateContent),
  updateCmsSection('aboutUs'),
);

adminAliasRoutes.get('/earnings', requireAuth('admin'), paymentController.getAll);
adminAliasRoutes.get('/earnings/summary', requireAuth('admin'), paymentController.getSummary);
adminAliasRoutes.post('/uploads/file', requireAuth('admin'), uploadMiddleware.single('file'), uploadController.uploadFile);

appAliasRoutes.get(
  '/home',
  catchAsync(async (_req, res) => {
    const [settings, featuredSituations] = await Promise.all([
      settingsService.getPublicAppSettings(),
      situationService.getFeatured(),
    ]);

    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'Home content fetched successfully',
      data: {
        ...settings,
        featuredSituations,
      },
    });
  }),
);
appAliasRoutes.get('/drill-categories', drillCategoryController.getAll);
appAliasRoutes.get('/drills', drillController.getAll);
appAliasRoutes.get('/situations', situationController.getAll);
const getCmsSection = (section: 'privacyPolicy' | 'terms' | 'aboutUs') =>
  catchAsync(async (_req, res) => {
    const settings = await settingsService.getAdminSettings();
    response.success(res, {
      statusCode: StatusCodes.OK,
      message: 'CMS content fetched successfully',
      data: {
        key: section,
        content: settings[section],
      },
    });
  });

appAliasRoutes.get('/cms/privacy-policy', getCmsSection('privacyPolicy'));
appAliasRoutes.get('/cms/terms-and-conditions', getCmsSection('terms'));
appAliasRoutes.get('/cms/about-us', getCmsSection('aboutUs'));
