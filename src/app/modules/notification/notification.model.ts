import { Schema, model } from 'mongoose';

export interface INotification {
  title: string;
  description: string;
  isUnread: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    isUnread: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const notificationModel = model<INotification>('Notification', notificationSchema);
