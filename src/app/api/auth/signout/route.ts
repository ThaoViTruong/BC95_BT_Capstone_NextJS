import { NextResponse } from "next/server";

import { getAuthCookieName } from "@/lib/auth-session";
import { getProfileSeedCookieName } from "@/lib/profile-seed";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: getAuthCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: getProfileSeedCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
