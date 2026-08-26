export type UserRole = "ADMIN" | "USER" | string;

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  gender: boolean;
  role: UserRole;
  avatar?: string;
};

export type CreateUserPayload = {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  birthday: string;
  gender: boolean;
  role: UserRole;
  
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  gender?: boolean;
  role?: UserRole;
  password?: string;
};
