import { notificationModel } from './notification.model';

const getAll = async () => {
  const items = await notificationModel.find().sort({ createdAt: -1 }).lean();
  return items.map((item) => ({
    id: String(item._id),
    title: item.title,
    description: item.description,
    createdAt: item.createdAt,
    isUnread: item.isUnread,
  }));
};

export const notificationService = {
  getAll,
};
