"use client";

import Link from "next/link";
import { LogOut, CircleUserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AUTH_STORAGE_EVENT,
  clearStoredAuth,
  getCurrentUser,
} from "@/lib/auth-storage";
import { authService } from "@/services/auth.service";

export function AuthAccountMenu() {
  const [currentUser, setCurrentUser] =
    useState<ReturnType<typeof getCurrentUser>>(null);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = useMemo(() => {
    const name = currentUser?.name?.trim();
    const email = currentUser?.email?.trim();

    return name || email || "Tài khoản";
  }, [currentUser?.email, currentUser?.name]);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getCurrentUser());
    };

    syncUser();

    window.addEventListener("storage", syncUser);
    window.addEventListener(AUTH_STORAGE_EVENT, syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(AUTH_STORAGE_EVENT, syncUser);
    };
  }, []);

  if (!currentUser) {
    return (
      <Link
        href="/tai-khoan"
        className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[#0f2f8e] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#0c2570] sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
      >
        <CircleUserRound className="h-3 w-3 text-white sm:h-4 sm:w-4" />
        <span className="font-semibold text-white">Đăng nhập</span>
      </Link>
    );
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authService.signOut();
    } catch {
    } finally {
      clearStoredAuth();
      setIsSigningOut(false);
      toast.success("Đã đăng xuất.");

      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }
  };

  return (
    <div className="flex max-w-full flex-nowrap items-center justify-end gap-1 rounded-full border border-line bg-white px-1 py-1 shadow-sm sm:gap-2 sm:px-2">
      <Link
        href="/tai-khoan"
        className="inline-flex min-h-7 min-w-0 max-w-[100px] items-center gap-1 rounded-full px-1.5 py-1 text-[11px] font-semibold text-[#0f2f8e] transition hover:bg-slate-100 sm:min-h-10 sm:max-w-[240px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
      >
        <CircleUserRound className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
        <span className="truncate">{displayName}</span>
      </Link>

      {currentUser.role?.trim().toUpperCase() === "ADMIN" && (
        <Link
          href="/quan-tri"
          className="inline-flex min-h-8 shrink-0 items-center rounded-full bg-slate-100 px-2 py-1.5 text-[10px] font-semibold text-[#0f2f8e] transition hover:bg-slate-200 sm:min-h-10 sm:px-3 sm:text-xs"
        >
          Quản trị
        </Link>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-label={isSigningOut ? "Đang thoát" : "Đăng xuất"}
        className="inline-flex min-h-7 shrink-0 items-center justify-center rounded-full bg-[#0f2f8e] px-2 py-1 text-[10px] font-medium text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-10 sm:gap-1 sm:px-3 sm:py-1.5 sm:text-xs sm:font-semibold"
      >
        <LogOut className="h-2.5 w-2.5 shrink-0 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{isSigningOut ? "Đang thoát" : "Đăng xuất"}</span>
      </button>
    </div>
  );
}
