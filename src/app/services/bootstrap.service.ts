import { drillCategoryModel } from '../modules/drill-category/drill-category.model';
import { drillModel } from '../modules/drill/drill.model';
import { notificationModel } from '../modules/notification/notification.model';
import { reportModel } from '../modules/report/report.model';
import { settingsModel } from '../modules/settings/settings.model';
import { situationModel } from '../modules/situation/situation.model';

const settingsParagraph =
  'Marietta Baseball Academy provides structured defensive situations, premium drill access, and coach-facing content management. Policies and support content can be updated from the dashboard.';

const seedApplicationData = async (): Promise<void> => {
  const settingsCount = await settingsModel.countDocuments();
  if (!settingsCount) {
    await settingsModel.create({
      homeEyebrow: 'EVERY PLAYER HAS A ROLE ON EVERY PLAY',
      homeTitle: 'DEFENSIVE SITUATIONS',
      homePrimaryCta: 'FEATURED SITUATIONS',
      homeSecondaryCta: 'SPECIFIC SITUATIONS',
      featuredSectionTitle: 'Grounder to SS',
      featuredSectionSubtitle: 'Fly ball to LF - No Runners on',
      situationImageUri: null,
      privacyPolicy: settingsParagraph,
      terms: settingsParagraph,
      aboutUs: settingsParagraph,
      fullUnlockPrice: 99.99,
      appVersion: '2.4.0 Elite',
    });
  }

  const situationCount = await situationModel.countDocuments();
  if (!situationCount) {
    await situationModel.insertMany([
      {
        title: 'Grounder to SS',
        category: 'Featured Situation',
        shortLabel: 'SS',
        featured: true,
        diagramVariant: 'infield',
        image: '',
        displayOrder: 1,
        instructions: [
          { player: 'P', detail: 'Move into back up position between mound and 2B.' },
          { player: 'C', detail: 'Follow runner to 1B to back up for over throw.' },
          { player: '1B', detail: 'After seeing runner touch 1B, cover the bag.' },
        ],
      },
      {
        title: 'Fly ball to LF - No Runners on',
        category: 'Specific Situations',
        shortLabel: 'LF',
        featured: false,
        diagramVariant: 'outfield',
        image: '',
        displayOrder: 2,
        instructions: [
          { player: 'LF', detail: 'Attack through the catch and transition quickly.' },
          { player: 'CF', detail: 'Close the gap behind LF and back up the play.' },
          { player: 'RF', detail: 'Pinch toward center field for backup depth.' },
        ],
      },
      {
        title: 'Sac Bunt Defense to 1B Side',
        category: 'Specific Situations',
        shortLabel: '1B',
        featured: false,
        diagramVariant: 'infield',
        image: '',
        displayOrder: 3,
        instructions: [
          { player: 'P', detail: 'Break hard off the mound and read the angle.' },
          { player: '2B', detail: 'Rotate to first base on the charge.' },
          { player: '3B', detail: 'Crash to protect against the push bunt.' },
        ],
      },
    ]);
  }

  const categoryCount = await drillCategoryModel.countDocuments();
  if (!categoryCount) {
    const categories = await drillCategoryModel.insertMany([
      {
        name: 'Hitting',
        subtitle: 'Power, contact, and swing plane mechanics for all levels.',
        cover: 'https://placehold.co/800x600/f3efe7/111f5a?text=Hitting',
        icon: 'https://placehold.co/128x128/f3efe7/111f5a?text=H',
        accessLevel: 'free',
        accentIcon: 'baseball-outline',
      },
      {
        name: 'Pitching',
        subtitle: 'Mound presence, velocity development, and command mastery.',
        cover: 'https://placehold.co/800x600/f3efe7/111f5a?text=Pitching',
        icon: 'https://placehold.co/128x128/f3efe7/111f5a?text=P',
        accessLevel: 'premium',
        accentIcon: 'radio-button-on-outline',
      },
      {
        name: 'Infield',
        subtitle: 'Footwork, transition speeds, and defensive positioning.',
        cover: 'https://placehold.co/800x600/f3efe7/111f5a?text=Infield',
        icon: 'https://placehold.co/128x128/f3efe7/111f5a?text=I',
        accessLevel: 'premium',
        accentIcon: 'grid-outline',
      },
    ]);

    await drillModel.insertMany([
      {
        name: 'Bucket Drill',
        categoryId: categories[0]!._id,
        description: 'Train stride direction and clean foot placement through contact.',
        cover: 'https://placehold.co/800x600/f3efe7/111f5a?text=Bucket+Drill',
        accessLevel: 'free',
        steps: ['Get into regular batting stance.', 'Step directly toward the pitcher.'],
        equipment: ['Baseball bat', 'A bucket'],
        focusPoints: ['Direction of Step: Move toward the pitcher.', 'Stance: Stay balanced.'],
      },
      {
        name: 'Balance Point Drill',
        categoryId: categories[1]!._id,
        description: 'Refine posture and tempo over the rubber with a controlled balance point.',
        cover: 'https://placehold.co/800x600/f3efe7/111f5a?text=Balance+Point',
        accessLevel: 'free',
        steps: ['Lift to balance point.', 'Drive down the mound with posture.'],
        equipment: ['Baseballs', 'Pitching mound'],
        focusPoints: ['Posture: Keep the head stacked.', 'Tempo: Smooth gather and drive.'],
      },
      {
        name: 'Quick Transfer Drill',
        categoryId: categories[2]!._id,
        description: 'Speed up glove-to-hand exchanges for infielders under pressure.',
        cover: 'https://placehold.co/800x600/f3efe7/111f5a?text=Quick+Transfer',
        accessLevel: 'premium',
        steps: ['Field through the center line.', 'Replace the feet on transfer.'],
        equipment: ['Glove', 'Baseballs'],
        focusPoints: ['Exchange Speed: Minimize extra glove movement.', 'Footwork: Sync transfer and feet.'],
      },
    ]);
  }

  if (!(await notificationModel.countDocuments())) {
    await notificationModel.insertMany([
      {
        title: 'Profile report!',
        description: 'A flagged profile requires a moderation review.',
        isUnread: true,
      },
      {
        title: 'A new user joined',
        description: 'Membership purchase has been completed successfully.',
        isUnread: false,
      },
    ]);
  }

  if (!(await reportModel.countDocuments())) {
    await reportModel.insertMany([
      {
        user: 'Robert Fox',
        email: 'fox@email.com',
        phone: '+1 231 3412',
        city: 'Marietta',
        title: 'Profile report',
        status: 'Open',
        message: 'Vel et commodo et scelerisque aliquam.',
      },
      {
        user: 'Sarah Taylor',
        email: 'sarah@email.com',
        phone: '+1 888 1212',
        city: 'Atlanta',
        title: 'Payment issue',
        status: 'Resolved',
        message: 'Premium purchase completed but access did not refresh immediately.',
      },
    ]);
  }
};

export const bootstrapService = {
  seedApplicationData,
};
