import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../errors/ApiError';

import { settingsModel } from './settings.model';

const getSettingsDocument = async () => {
  const settings = await settingsModel.findOne().lean();
  if (!settings) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Settings not found');
  }

  return settings;
};

const getPublicAppSettings = async () => {
  const settings = await getSettingsDocument();
  return {
    homeEyebrow: settings.homeEyebrow,
    homeTitle: settings.homeTitle,
    homePrimaryCta: settings.homePrimaryCta,
    homeSecondaryCta: settings.homeSecondaryCta,
    featuredSectionTitle: settings.featuredSectionTitle,
    featuredSectionSubtitle: settings.featuredSectionSubtitle,
    situationImageUri: settings.situationImageUri,
  };
};

const getLegalPages = async () => {
  const settings = await getSettingsDocument();
  return {
    privacyPolicy: settings.privacyPolicy
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    terms: settings.terms
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    aboutUs: {
      headline: settings.appVersion,
      body: settings.aboutUs,
      company: ['Marietta Baseball Academy, LLC', 'Atlanta, GA'],
      contact: ['www.mbaseballacademy.com', 'support@mbaseballacademy.com'],
    },
  };
};

const getAdminSettings = async () => {
  const settings = await getSettingsDocument();
  return {
    privacyPolicy: settings.privacyPolicy,
    terms: settings.terms,
    aboutUs: settings.aboutUs,
  };
};

const updateContentSection = async (
  key: 'privacyPolicy' | 'terms' | 'aboutUs',
  value: string,
) => {
  await settingsModel.updateOne({}, { [key]: value }, { upsert: true });
};

const updateAppSettings = async (
  payload: Partial<{
    homeEyebrow: string;
    homeTitle: string;
    homePrimaryCta: string;
    homeSecondaryCta: string;
    featuredSectionTitle: string;
    featuredSectionSubtitle: string;
    situationImageUri: string | null;
  }>,
) => {
  await settingsModel.updateOne({}, payload, { upsert: true });
  return getPublicAppSettings();
};

const getUnlockPrice = async (): Promise<number> => {
  const settings = await getSettingsDocument();
  return settings.fullUnlockPrice;
};

const updateUnlockPrice = async (price: number) => {
  await settingsModel.updateOne({}, { fullUnlockPrice: price }, { upsert: true });
  return price;
};

export const settingsService = {
  getPublicAppSettings,
  getLegalPages,
  getAdminSettings,
  updateContentSection,
  updateAppSettings,
  getUnlockPrice,
  updateUnlockPrice,
};
