"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  BadgeCheck,
  CalendarDays,
  CircleUserRound,
  LockKeyhole,
  KeyRound,
  MapPin,
  Mail,
  Phone,
  Star,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDate } from "@/lib/format";
import { getRoomImageSrc } from "@/lib/room-image";
import { getStoredAuth, setStoredAuth } from "@/lib/auth-storage";
import { migrateGuestFavoritesToUser } from "@/lib/favorite-rooms-storage";
import { profileService } from "@/services/profile.service";
import type { User } from "@/types/user";

import { FavoriteRoomsSection } from "./favorite-rooms-section";
import { PaginationButtons } from "@/components/shared/pagination-buttons";

type StayStatus = "upcoming" | "active" | "completed";

type AccountOverviewProps = {
  initialUser: User;
  rentedRooms: Array<{
    bookingId: number;
    roomId: number;
    roomName: string;
    roomImage: string;
    roomPrice: number;
    guestCount: number;
    checkIn: string;
    checkOut: string;
    locationText: string;
    ratingValue: number;
    ratingCount: number;
  }>;
};

const profileFormSchema = z
  .object({
    name: z.string().trim().min(2, "Vui lòng nhập họ và tên."),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email.")
      .email("Email không hợp lệ."),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10,11}$/, "Số điện thoại phải từ 10-11 chữ số."),
    birthday: z
      .string()
      .min(1, "Vui lòng chọn ngày sinh.")
      .refine((value) => {
        const birthday = new Date(`${value}T00:00:00`);

        if (Number.isNaN(birthday.getTime())) {
          return false;
        }

        return birthday <= getLatestAllowedBirthday();
      }, "Người dùng phải đủ 18 tuổi mới được sử dụng tài khoản."),
    gender: z.enum(["male", "female"], {
      message: "Vui lòng chọn giới tính.",
    }),
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z
  .object({
    newPassword: z.string().trim().min(6, "Mật khẩu mới tối thiểu 6 ký tự."),
    confirmNewPassword: z.string().trim(),
  })
  .superRefine((data, context) => {
    if (!data.newPassword) {
      return;
    }

    if (!data.confirmNewPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmNewPassword"],
        message: "Vui lòng xác nhận mật khẩu mới.",
      });
    }

    if (
      data.confirmNewPassword &&
      data.newPassword !== data.confirmNewPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmNewPassword"],
        message: "Mật khẩu xác nhận chưa khớp.",
      });
    }
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

function formatJoinYear() {
  return new Date().getFullYear();
}

function formatGenderLabel(value: boolean) {
  return value ? "Nam" : "Nữ";
}

function getLatestAllowedBirthday() {
  const today = new Date();

  return new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
}

function formatDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatBirthdayInputValue(value?: string) {
  if (!value) {
    return "";
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const offset = parsedDate.getTimezoneOffset() * 60_000;
  return new Date(parsedDate.getTime() - offset).toISOString().slice(0, 10);
}

function formatBirthdayPayload(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function createFormValues(user: User): ProfileFormValues {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    birthday: formatBirthdayInputValue(user.birthday),
    gender: user.gender ? "male" : "female",
  };
}

function getStayStatusInfo(checkIn: string, checkOut: string) {
  const now = new Date();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return {
      key: "upcoming" as StayStatus,
      label: "Đã xác nhận",
    };
  }

  if (now < checkInDate) {
    return {
      key: "upcoming" as StayStatus,
      label: "Sắp nhận phòng",
    };
  }

  if (now > checkOutDate) {
    return {
      key: "completed" as StayStatus,
      label: "Đã hoàn thành",
    };
  }

  return {
    key: "active" as StayStatus,
    label: "Đang lưu trú",
  };
}

function getAvatarSrc(value?: string) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return "";
  }

  const imageSrc = getRoomImageSrc(rawValue);

  if (imageSrc === "/file.svg") {
    return "";
  }

  return imageSrc;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export function AccountOverview({ initialUser, rentedRooms }: AccountOverviewProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isLoadingLatestUser, setIsLoadingLatestUser] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeRoomTab, setActiveRoomTab] = useState<"rented" | "favorite">("rented");
  const [activeStayTab, setActiveStayTab] = useState<StayStatus | "all">("all");
  const [rentedPage, setRentedPage] = useState(1);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: createFormValues(initialUser),
  });
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const displayName = user.name?.trim() || user.email?.trim() || "Khách hàng";
  const displayEmail = user.email?.trim() || "";
  const displayPhone = user.phone?.trim() || "";
  const avatarSrc = getAvatarSrc(user.avatar);
  const latestAllowedBirthday = formatDateInputValue(getLatestAllowedBirthday());
  const nextPasswordValue = useWatch({
    control: passwordForm.control,
    name: "newPassword",
  });
  const verifyItems = useMemo(
    () => [
      {
        label: "Địa chỉ email",
        verified: Boolean(displayEmail),
      },
      {
        label: "Số điện thoại",
        verified: /^\d{10,11}$/.test(displayPhone),
      },
    ],
    [displayEmail, displayPhone],
  );
  const stayTabs = useMemo(
    () => [
      { key: "all" as const, label: "Tất cả" },
      { key: "upcoming" as const, label: "Sắp nhận phòng" },
      { key: "active" as const, label: "Đang lưu trú" },
      { key: "completed" as const, label: "Đã hoàn thành" },
    ],
    [],
  );
  const visibleRentedRooms = useMemo(() => {
    if (activeStayTab === "all") {
      return rentedRooms;
    }

    return rentedRooms.filter(
      (room) => getStayStatusInfo(room.checkIn, room.checkOut).key === activeStayTab,
    );
  }, [activeStayTab, rentedRooms]);

  useEffect(() => {
    if (typeof user.id === "number" && user.id > 0) {
      migrateGuestFavoritesToUser(user.id);
    }
  }, [user.id]);

  const syncStoredAuthUser = (nextUser: User) => {
    const storedAuth = getStoredAuth();
    if (!storedAuth?.token) {
      return;
    }

    setStoredAuth({
      token: storedAuth.token,
      user: {
        ...nextUser,
        token: storedAuth.token,
      },
    });
  };

  const handleOpenEdit = async () => {
    setIsLoadingLatestUser(true);
    profileForm.reset(createFormValues(user));
    setIsEditOpen(true);
    setIsLoadingLatestUser(false);
  };

  const handleCloseEdit = () => {
    profileForm.reset(createFormValues(user));
    setIsEditOpen(false);
  };

  const handleUpdateProfile = profileForm.handleSubmit(async (values) => {
    try {
      const updatedUser = await profileService.updateProfile({
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthday: formatBirthdayPayload(values.birthday),
        gender: values.gender === "male",
      });

      setUser(updatedUser);
      profileForm.reset(createFormValues(updatedUser));
      syncStoredAuthUser(updatedUser);

      setIsEditOpen(false);
      toast.success("Cập nhật hồ sơ thành công.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.");
    }
  });

  const handleOpenPasswordFlow = () => {
    passwordForm.reset({
      newPassword: "",
      confirmNewPassword: "",
    });
    setIsPasswordOpen(true);
  };

  const handleClosePasswordFlow = () => {
    passwordForm.reset({
      newPassword: "",
      confirmNewPassword: "",
    });
    setIsPasswordOpen(false);
  };

  const handleUpdatePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await profileService.updatePassword(values.newPassword);

      passwordForm.reset({
        newPassword: "",
        confirmNewPassword: "",
      });
      setIsPasswordOpen(false);
      toast.success("Đổi mật khẩu thành công.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đổi mật khẩu.");
    }
  });

  const handleAvatarButtonClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp ảnh hợp lệ.");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const refreshedUser = await profileService.uploadAvatar(file);
      setUser(refreshedUser);
      profileForm.reset(createFormValues(refreshedUser));
      syncStoredAuthUser(refreshedUser);
      toast.success("Cập nhật ảnh đại diện thành công.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh đại diện.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6]">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-24 shrink-0 sm:h-14 sm:w-32">
              <Image
                src="/images/logo.png"
                alt="Stayora"
                fill
                className="object-contain object-left"
                sizes="128px"
                priority
              />
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0f2f8e] px-4 text-sm font-bold text-[#0f2f8e] transition hover:bg-[#0f2f8e] hover:text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <section className="rounded-[28px] border border-white/80 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-100">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CircleUserRound className="h-14 w-14 text-slate-400" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <h1 className="mt-4 text-2xl font-extrabold text-[#12315f]">{displayName}</h1>
            <p className="mt-2 text-sm text-slate-500">Bắt đầu tham gia vào {formatJoinYear()}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {formatGenderLabel(user.gender)}
            </p>

            <button
              type="button"
              onClick={handleAvatarButtonClick}
              disabled={isUploadingAvatar}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Camera className="h-4 w-4" />
              {isUploadingAvatar ? "Đang tải ảnh..." : "Cập nhật ảnh đại diện"}
            </button>

            <button
              type="button"
              onClick={handleOpenEdit}
              disabled={isLoadingLatestUser}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[#0f2f8e] bg-white px-4 text-sm font-bold text-[#0f2f8e] transition hover:bg-[#0f2f8e] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingLatestUser ? "Đang tải hồ sơ..." : "Chỉnh sửa hồ sơ"}
            </button>
            <button
              type="button"
              onClick={handleOpenPasswordFlow}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-4 text-sm font-bold text-white transition hover:bg-[#0b246d]"
            >
              Đổi mật khẩu
            </button>
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[#0f2f8e]">
              <BadgeCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-950">Xác minh danh tính</h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Xác minh danh tính của bạn với huy hiệu xác minh danh tính để tăng độ tin cậy.
            </p>

            <button
              type="button"
              onClick={handleOpenEdit}
              disabled={isLoadingLatestUser}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Nhận huy hiệu
            </button>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {displayName.toUpperCase()} ĐÃ XÁC NHẬN
              </p>

              <div className="mt-4 space-y-3">
                {verifyItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm text-slate-700">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                        item.verified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {item.verified ? "✓" : "×"}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="relative grid grid-cols-2 rounded-2xl border border-line bg-slate-50/80 p-1">
            <span
              className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-2xl bg-[#0f2f8e] shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeRoomTab === "rented" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => setActiveRoomTab("rented")}
              className={`relative z-10 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors duration-300 sm:px-4 ${
                activeRoomTab === "rented" ? "text-white" : "text-slate-600 hover:text-[#0f2f8e]"
              }`}
            >
              Phòng đã thuê
            </button>
            <button
              type="button"
              onClick={() => setActiveRoomTab("favorite")}
              className={`relative z-10 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors duration-300 sm:px-4 ${
                activeRoomTab === "favorite"
                  ? "text-white"
                  : "text-slate-600 hover:text-[#0f2f8e]"
              }`}
            >
              Phòng yêu thích
            </button>
          </div>

          {isEditOpen ? (
            <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Hồ sơ người dùng
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#12315f]">
                    Xem và chỉnh sửa thông tin
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-line px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Đóng form
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                    Họ và tên
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                    <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      {...profileForm.register("name")}
                      type="text"
                      placeholder="Nhập họ và tên"
                      className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <FieldError message={profileForm.formState.errors.name?.message} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                    Email
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      {...profileForm.register("email")}
                      type="email"
                      placeholder="Nhập email"
                      className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <FieldError message={profileForm.formState.errors.email?.message} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                    Số điện thoại
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      {...profileForm.register("phone")}
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="Nhập số điện thoại"
                      className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <FieldError message={profileForm.formState.errors.phone?.message} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                    Ngày sinh
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      {...profileForm.register("birthday")}
                      type="date"
                      max={latestAllowedBirthday}
                      className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <FieldError message={profileForm.formState.errors.birthday?.message} />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                    Giới tính
                  </label>
                  <select
                    {...profileForm.register("gender")}
                    className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-slate-900 outline-none"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                  <FieldError message={profileForm.formState.errors.gender?.message} />
                </div>

                <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 text-sm font-bold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {profileForm.formState.isSubmitting
                      ? "Đang cập nhật..."
                      : "Lưu thông tin"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-line px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {isPasswordOpen ? (
            <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Bảo mật tài khoản
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#12315f]">
                    Đổi mật khẩu
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleClosePasswordFlow}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-line px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Đóng luồng đổi mật khẩu
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                    Mật khẩu mới
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                    <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      {...passwordForm.register("newPassword")}
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <FieldError message={passwordForm.formState.errors.newPassword?.message} />
                </div>

                {nextPasswordValue ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                      <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        {...passwordForm.register("confirmNewPassword")}
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <FieldError
                      message={passwordForm.formState.errors.confirmNewPassword?.message}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                    Nhập mật khẩu mới trước, sau đó hệ thống sẽ yêu cầu bạn xác nhận lại.
                  </div>
                )}

                <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={passwordForm.formState.isSubmitting}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 text-sm font-bold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {passwordForm.formState.isSubmitting
                      ? "Đang đổi mật khẩu..."
                      : "Lưu mật khẩu mới"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClosePasswordFlow}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-line px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {activeRoomTab === "favorite" ? (
            <FavoriteRoomsSection userId={user.id} />
          ) : (
            (() => {
              const pageSize = 4;
              const totalPages = Math.max(1, Math.ceil(visibleRentedRooms.length / pageSize));
              const safeCurrentPage = Math.min(Math.max(rentedPage, 1), totalPages);
              const startIndex =
                visibleRentedRooms.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
              const roomsToShow = visibleRentedRooms.slice(startIndex, startIndex + pageSize);

              return (
                <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-2xl font-extrabold text-slate-950">Phòng đã thuê</h2>
                    <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                      {stayTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            setActiveStayTab(tab.key);
                            setRentedPage(1);
                          }}
                          className={`inline-flex min-h-9 w-full items-center justify-center whitespace-nowrap rounded-full px-2 text-[11px] font-semibold transition sm:min-h-10 sm:px-3 sm:text-sm ${
                            activeStayTab === tab.key
                              ? "bg-[#0f2f8e] text-white"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {roomsToShow.length > 0 ? (
                    <>
                      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
                        {roomsToShow.map((room) => {
                          const stayStatus = getStayStatusInfo(room.checkIn, room.checkOut);

                          return (
                            <article
                              key={room.bookingId}
                              className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-sm"
                            >
                              <div className="relative h-28 bg-slate-100 sm:h-40 lg:h-48">
                                <Image
                                  src={getRoomImageSrc(room.roomImage)}
                                  alt={room.roomName}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 50vw"
                                  className="object-cover"
                                />
                                <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[#12315f] shadow-sm sm:right-3 sm:top-3 sm:px-3 sm:text-xs">
                                  {stayStatus.label}
                                </span>
                              </div>

                              <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-sm font-bold text-slate-950 sm:text-lg">
                                      {room.roomName}
                                    </h3>
                                    <p className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-slate-500 sm:text-sm">
                                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0f2f8e] sm:h-4 sm:w-4" />
                                      <span className="truncate">{room.locationText}</span>
                                    </p>
                                    <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-sm">
                                      {formatDate(room.checkIn)} - {formatDate(room.checkOut)}
                                    </p>
                                  </div>

                                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-900 sm:text-sm">
                                    <Star className="h-3.5 w-3.5 fill-[#facc15] text-[#facc15] sm:h-4 sm:w-4" />
                                    {room.ratingValue.toFixed(1)}
                                  </span>
                                </div>

                                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 sm:px-4 sm:py-3 sm:text-sm">
                                  <p>Tối đa {room.guestCount} khách</p>
                                  <p className="mt-1">
                                    {room.ratingCount > 0
                                      ? `${room.ratingCount} đánh giá`
                                      : "Chưa có đánh giá"}
                                  </p>
                                  <p className="mt-1 font-semibold text-slate-900">
                                    {room.roomPrice > 0
                                      ? `${formatCurrency(room.roomPrice)} / đêm`
                                      : "Giá đang cập nhật"}
                                  </p>
                                </div>

                                <Link
                                  href={`/phong/${room.roomId}`}
                                  className="inline-flex h-9 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-900 transition hover:bg-[#0f2f8e] hover:text-white sm:h-11 sm:text-sm"
                                >
                                  Đặt lại
                                </Link>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <PaginationButtons
                        className="mt-6"
                        currentPage={safeCurrentPage}
                        totalPages={totalPages}
                        onPageChange={setRentedPage}
                      />
                    </>
                  ) : (
                    <div className="mt-5 rounded-[24px] border border-dashed border-line bg-white p-8 text-center shadow-sm">
                      <p className="text-lg font-bold text-slate-950">
                        {rentedRooms.length > 0
                          ? "Không có phòng phù hợp với bộ lọc hiện tại"
                          : "Bạn chưa có phòng đã thuê"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {rentedRooms.length > 0
                          ? "Hãy chuyển sang nhóm trạng thái khác để xem các booking còn lại của bạn."
                          : "Khi phát sinh booking, danh sách này sẽ tự động hiển thị để bạn xem lại và đặt lại nhanh chóng."}
                      </p>
                      <Link
                        href="/"
                        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 text-sm font-bold text-white transition hover:bg-[#0b246d]"
                      >
                        Khám phá ngay tại trang chủ
                      </Link>
                    </div>
                  )}
                </section>
              );
            })()
          )}
        </section>
      </div>
    </main>
  );
}
