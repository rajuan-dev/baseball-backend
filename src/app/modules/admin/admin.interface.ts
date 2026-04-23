export type AdminRole = 'super_admin';

export interface IAdmin {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
