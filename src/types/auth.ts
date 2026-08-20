import type { User } from "@/types/user";

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  birthday: string;
  gender: boolean;
  role: string;
};

export type AuthUser = User & {
  token?: string;
};

export type StoredAuth = {
  token: string;
  user: AuthUser | null;
};
