"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-error";
import { hydrateSignedUpUser } from "@/lib/auth-user";
import {
  clearRememberedSignIn,
  getRememberedSignIn,
  setRememberedSignIn,
  setStoredAuth,
} from "@/lib/auth-storage";
import { authService } from "@/services/auth.service";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự."),
});

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

const signUpSchema = z
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
      .regex(/^\d{10,11}$/, "số điện thoại phải từ 10-11 chữ số"),
    birthday: z
      .string()
      .min(1, "Vui lòng chọn ngày sinh.")
      .refine((value) => {
        const birthday = new Date(`${value}T00:00:00`);

        if (Number.isNaN(birthday.getTime())) {
          return false;
        }

        return birthday <= getLatestAllowedBirthday();
      }, "Bạn phải đủ 18 tuổi để đăng ký tài khoản."),
    gender: z.enum(["male", "female"], {
      message: "Vui lòng chọn giới tính.",
    }),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự."),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận chưa khớp.",
  });

type AuthTab = "signin" | "signup";
type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Có lỗi xảy ra. Vui lòng thử lại.";
}

function formatBirthday(value: string) {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function redirectAfterSignIn(role?: string) {
  const normalizedRole = role?.trim().toUpperCase();

  if (normalizedRole === "ADMIN") {
    return "/quan-tri";
  }

  if (normalizedRole === "HOST") {
    return "/chu-cho-thue";
  }

  return "/tai-khoan";
}

function SocialButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e]"
    >
      {label}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function PasswordField({
  visible,
  onToggle,
  placeholder,
  error,
  register,
}: {
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
        <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          {...register}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-slate-500 transition hover:text-[#0f2f8e]"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

export function AuthFormPanel() {
  const router = useRouter();
  const rememberedSignIn = getRememberedSignIn();
  const latestAllowedBirthday = formatDateInputValue(getLatestAllowedBirthday());
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [rememberPassword, setRememberPassword] = useState(Boolean(rememberedSignIn));
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: rememberedSignIn?.email ?? "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      birthday: "",
      gender: "male",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignIn = signInForm.handleSubmit(async (values) => {
    try {
      const user = await authService.signIn(values);

      if (!user.token) {
        toast.error("Đăng nhập thành công nhưng chưa nhận được token.");
        return;
      }

      setStoredAuth({
        token: user.token,
        user,
      });

      if (rememberPassword) {
        setRememberedSignIn({
          email: values.email,
        });
      } else {
        clearRememberedSignIn();
      }

      toast.success("Đăng nhập thành công.");
      router.push(redirectAfterSignIn(user.role));
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const handleSignUp = signUpForm.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthday: formatBirthday(values.birthday),
        gender: values.gender === "male",
        password: values.password,
        role: "USER",
      } as const;
      const apiUser = await authService.signUp(payload);
      const user = hydrateSignedUpUser(apiUser, payload);

      if (user.token) {
        setStoredAuth({
          token: user.token,
          user,
        });

        toast.success("Đăng ký thành công.");
        router.push(redirectAfterSignIn(user.role));
        router.refresh();
        return;
      }

      signInForm.setValue("email", values.email);
      signInForm.setValue("password", values.password);
      setActiveTab("signin");
      toast.success("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const formSlideClass =
    activeTab === "signin" ? "auth-slide-in-left" : "auth-slide-in-right";

  return (
    <section className="min-h-screen bg-[#eef1f5]">
      <div className="h-1 w-full bg-[#0f2f8e]" />

      <div className="mx-auto flex min-h-[calc(100vh-4px)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[520px] rounded-[32px] border border-white/70 bg-white shadow-[0_24px_60px_rgba(15,47,142,0.12)]">
          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8">
            <div className="relative h-16 w-28">
              <Image
                src="/images/logo.png"
                alt="Stayora"
                fill
                className="object-contain"
                sizes="112px"
                priority
              />
            </div>

            <h1 className="mt-5 text-3xl font-extrabold text-[#12315f]">
              Chào mừng đến với Stayora
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Đăng nhập hoặc tạo tài khoản mới để đặt phòng, theo dõi chuyến đi và
              lưu nơi ở yêu thích.
            </p>
          </div>

          <div className="relative grid grid-cols-2 border-y border-line bg-slate-50/80 p-1">
            <span
              className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-2xl bg-[#0f2f8e] shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeTab === "signin" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`relative z-10 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                activeTab === "signin"
                  ? "text-white"
                  : "text-slate-600 hover:text-[#0f2f8e]"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`relative z-10 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                activeTab === "signup"
                  ? "text-white"
                  : "text-slate-600 hover:text-[#0f2f8e]"
              }`}
            >
              Đăng ký
            </button>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className={formSlideClass} key={activeTab}>
              {activeTab === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                      Email đăng nhập
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        {...signInForm.register("email")}
                        type="email"
                        placeholder="Nhập địa chỉ email"
                        className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <FieldError message={signInForm.formState.errors.email?.message} />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-[#12315f]">
                        Mật khẩu
                      </label>
                      <button
                        type="button"
                        onClick={() => toast.info("Chức năng quên mật khẩu sẽ được bổ sung sau.")}
                        className="text-xs font-semibold text-[#0f2f8e]"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <PasswordField
                      visible={showSignInPassword}
                      onToggle={() => setShowSignInPassword((value) => !value)}
                      placeholder="Nhập mật khẩu"
                      error={signInForm.formState.errors.password?.message}
                      register={signInForm.register("password")}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={rememberPassword}
                        onChange={(event) => setRememberPassword(event.target.checked)}
                        className="h-4 w-4 rounded border-line accent-[#0f2f8e]"
                      />
                      Ghi nhớ email cho lần đăng nhập sau
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={signInForm.formState.isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-4 text-sm font-bold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signInForm.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                      Họ và tên
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                      <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        {...signUpForm.register("name")}
                        type="text"
                        placeholder="Nhập họ và tên đầy đủ"
                        className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                      />
                    </div>
                    <FieldError message={signUpForm.formState.errors.name?.message} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                        Email
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          {...signUpForm.register("email")}
                          type="email"
                          placeholder="Nhập email"
                          className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <FieldError message={signUpForm.formState.errors.email?.message} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                        Số điện thoại
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          {...signUpForm.register("phone")}
                          type="tel"
                          placeholder="Nhập số điện thoại"
                          inputMode="numeric"
                          maxLength={11}
                          className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <FieldError message={signUpForm.formState.errors.phone?.message} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                        Ngày sinh
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4">
                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                          {...signUpForm.register("birthday")}
                          type="date"
                          max={latestAllowedBirthday}
                          className="h-12 w-full border-none bg-transparent text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <FieldError message={signUpForm.formState.errors.birthday?.message} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                        Giới tính
                      </label>
                      <select
                        {...signUpForm.register("gender")}
                        className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-slate-900 outline-none"
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                      <FieldError message={signUpForm.formState.errors.gender?.message} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                        Mật khẩu
                      </label>
                      <PasswordField
                        visible={showSignUpPassword}
                        onToggle={() => setShowSignUpPassword((value) => !value)}
                        placeholder="Tạo mật khẩu"
                        error={signUpForm.formState.errors.password?.message}
                        register={signUpForm.register("password")}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#12315f]">
                        Xác nhận mật khẩu
                      </label>
                      <PasswordField
                        visible={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((value) => !value)}
                        placeholder="Nhập lại mật khẩu"
                        error={signUpForm.formState.errors.confirmPassword?.message}
                        register={signUpForm.register("confirmPassword")}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signUpForm.formState.isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-4 text-sm font-bold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signUpForm.formState.isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <p className="text-xs font-medium text-slate-400">Hoặc tiếp tục với</p>
                <div className="h-px flex-1 bg-line" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <SocialButton
                  label="Google"
                  onClick={() => toast.info("Đăng nhập với Google sẽ được bổ sung sau.")}
                />
                <SocialButton
                  label="Facebook"
                  onClick={() => toast.info("Đăng nhập với Facebook sẽ được bổ sung sau.")}
                />
              </div>

              <div className="mt-5 flex justify-center">
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#0f2f8e] transition hover:text-[#0b246d]"
                >
                  Trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
