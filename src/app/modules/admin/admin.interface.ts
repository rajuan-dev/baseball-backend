export type AdminRole = 'super_admin';

export interface IAdmin {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
  image?: string;
  contactNo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
