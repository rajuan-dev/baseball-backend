import bcrypt from 'bcryptjs';
import { Model, Schema, model } from 'mongoose';

import { IAdmin } from './admin.interface';

interface AdminModel extends Model<IAdmin> {
  isAdminExistsByEmail(email: string): Promise<IAdmin | null>;
}

const adminSchema = new Schema<IAdmin, AdminModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['super_admin'],
      default: 'super_admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    contactNo: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.statics.isAdminExistsByEmail = async function isAdminExistsByEmail(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const Admin = model<IAdmin, AdminModel>('Admin', adminSchema);
