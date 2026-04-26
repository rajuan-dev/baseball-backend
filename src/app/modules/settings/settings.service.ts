import { StatusCodes } from 'http-status-codes';
import sanitizeHtml from 'sanitize-html';

import { ApiError } from '../../errors/ApiError';
import { buildPublicFileUrl } from '../../utils/fileUrl';

import { settingsModel } from './settings.model';

type ContentSection = 'privacyPolicy' | 'terms' | 'aboutUs';

const contentSectionMap: Record<string, ContentSection> = {
  privacyPolicy: 'privacyPolicy',
  privacy_policy: 'privacyPolicy',
  terms: 'terms',
  terms_conditions: 'terms',
  aboutUs: 'aboutUs',
  about_us: 'aboutUs',
};

const sanitizeCmsHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'span',
      'h1',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'blockquote',
    ],
    allowedAttributes: {
      '*': ['style'],
    },
    allowedStyles: {
      '*': {
        'font-size': [/^\d{1,2}px$/],
        'text-align': [/^(left|center|right|justify)$/],
      },
    },
    disallowedTagsMode: 'discard',
  });

const resolveContentSection = (section: string): ContentSection => {
  const key = contentSectionMap[section];
  if (!key) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid content section');
  }

  return key;
};

const htmlToLines = (html: string) =>
  sanitizeHtml(html.replace(/<\/(p|li|h[1-3]|blockquote)>/gi, '\n'), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

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
    situationImageUri: buildPublicFileUrl(settings.situationImageUri),
    situationImageUrl: buildPublicFileUrl(settings.situationImageUri),
  };
};

const getLegalPages = async () => {
  const settings = await getSettingsDocument();
  return {
    privacyPolicy: htmlToLines(settings.privacyPolicy),
    privacyPolicyHtml: settings.privacyPolicy,
    terms: htmlToLines(settings.terms),
    termsHtml: settings.terms,
    aboutUs: {
      headline: settings.appVersion,
      body: settings.aboutUs,
      bodyHtml: settings.aboutUs,
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
    updatedAt: settings.updatedAt?.toISOString() ?? null,
  };
};

const updateContentSection = async (section: string, value: string) => {
  const key = resolveContentSection(section);
  await settingsModel.updateOne({}, { [key]: sanitizeCmsHtml(value) }, { upsert: true });
  return getAdminSettings();
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
