import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import type { AuthUser } from "@/types/auth";

const PROFILE_SEED_COOKIE_NAME = "stayora_profile_seed";
const PROFILE_SEED_MAX_AGE = 60 * 60 * 24 * 30;

type ProfileSeed = Omit<AuthUser, "token">;

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function encodeSeed(seed: ProfileSeed) {
  return encodeURIComponent(JSON.stringify(seed));
}

function decodeSeed(value: string): ProfileSeed | null {
  try {
    return JSON.parse(decodeURIComponent(value)) as ProfileSeed;
  } catch {
    return null;
  }
}

export async function getProfileSeed() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PROFILE_SEED_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  return decodeSeed(rawValue);
}

export function setProfileSeed(response: NextResponse, user: AuthUser) {
  const seed: ProfileSeed = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthday: user.birthday,
    gender: user.gender,
    role: user.role,
    avatar: user.avatar,
  };

  response.cookies.set({
    name: PROFILE_SEED_COOKIE_NAME,
    value: encodeSeed(seed),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PROFILE_SEED_MAX_AGE,
  });
}

export function mergeUserWithProfileSeed(
  user: AuthUser,
  seed: ProfileSeed | null,
  emailHint?: string,
): AuthUser {
  const userEmail = normalizeEmail(user.email || emailHint);
  const seedEmail = normalizeEmail(seed?.email);

  if (!seed || !seedEmail || (userEmail && seedEmail !== userEmail)) {
    return {
      ...user,
      email: user.email || emailHint || "",
    };
  }

  return {
    id: seed.id || user.id,
    name: seed.name || user.name,
    email: seed.email || user.email || emailHint || "",
    phone: seed.phone || user.phone,
    birthday: seed.birthday || user.birthday,
    gender: typeof seed.gender === "boolean" ? seed.gender : user.gender,
    role: seed.role || user.role,
    avatar: seed.avatar || user.avatar,
    token: user.token,
  };
}
