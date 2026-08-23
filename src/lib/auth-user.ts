import type { AuthUser, SignUpPayload } from "@/types/auth";

type SignUpUserSeed = Pick<SignUpPayload, "name" | "email" | "phone" | "birthday" | "gender" | "role">;

export function hydrateSignedUpUser(user: AuthUser, seed: SignUpUserSeed): AuthUser {
  return {
    id: typeof user.id === "number" ? user.id : 0,
    name: user.name?.trim() || seed.name.trim(),
    email: user.email?.trim() || seed.email.trim(),
    phone: user.phone?.trim() || seed.phone.trim(),
    birthday: user.birthday?.trim() || seed.birthday.trim(),
    gender: typeof user.gender === "boolean" ? user.gender : seed.gender,
    role: user.role?.trim() || seed.role.trim() || "USER",
    avatar: user.avatar,
    token: user.token,
  };
}
