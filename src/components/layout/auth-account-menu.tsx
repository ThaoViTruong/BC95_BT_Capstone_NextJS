"use client";

import Link from "next/link";
import { LogOut, CircleUserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AUTH_STORAGE_EVENT,
  clearStoredAuth,
  getCurrentUser,
} from "@/lib/auth-storage";
import { authService } from "@/services/auth.service";

export function AuthAccountMenu() {
  const router = useRouter();

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
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0f2f8e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c2570]"
      >
        <CircleUserRound className="h-4 w-4 text-white" />
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
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-2 rounded-[24px] border border-line bg-white px-2 py-1 shadow-sm sm:flex-nowrap sm:rounded-full">
      <Link
        href="/tai-khoan"
        className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-[#0f2f8e] transition hover:bg-slate-100 sm:max-w-[240px]"
      >
        <CircleUserRound className="h-4 w-4 shrink-0" />
        <span className="truncate">{displayName}</span>
      </Link>

      {currentUser.role?.trim().toUpperCase() === "ADMIN" && (
        <Link
          href="/quan-tri"
          className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#0f2f8e] transition hover:bg-slate-200"
        >
          Quản trị
        </Link>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#0f2f8e] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isSigningOut ? "Đang thoát" : "Đăng xuất"}
      </button>
    </div>
  );
}
