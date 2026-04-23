import { transactionModel } from './payment.model';
import { settingsService } from '../settings/settings.service';
import { appUserModel } from '../auth/app-user.model';

const getAll = async () => {
  const price = await settingsService.getUnlockPrice();
  const transactions = await transactionModel.find().sort({ createdAt: -1 }).lean();

  return {
    fullUnlockPrice: price,
    transactions: transactions.map((item) => ({
      id: String(item._id),
      userEmail: item.userEmail,
      purchaseType: item.purchaseType,
      amount: item.amount,
      date: item.createdAt,
    })),
  };
};

const completePurchase = async (payload: {
  email: string;
  country: string;
  purchaseType?: string;
}) => {
  const price = await settingsService.getUnlockPrice();
  const email = payload.email.toLowerCase();

  await appUserModel.findOneAndUpdate(
    { email },
    {
      email,
      isPremium: true,
      premiumUnlockedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const transaction = await transactionModel.create({
    userEmail: email,
    purchaseType: payload.purchaseType || 'Unlock All Drills',
    amount: price,
    country: payload.country,
  });

  return {
    success: true,
    transactionId: String(transaction._id),
    amount: transaction.amount,
  };
};

const updatePrice = async (price: number) => {
  await settingsService.updateUnlockPrice(price);
};

export const paymentService = {
  getAll,
  completePurchase,
  updatePrice,
};
