"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  House,
  Minus,
  Plus,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/format";
import { bookingFlowService } from "@/services/booking-flow.service";

type BookingCardProps = {
  roomId: number;
  roomName: string;
  pricePerNight: number;
  ratingText: string;
  reviewCountText: string;
  maxGuests: number;
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatInputDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function getNightCount(checkIn: string, checkOut: string) {
  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const checkOutDate = new Date(`${checkOut}T00:00:00`);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.round(diffTime / 86_400_000);

  return diffDays > 0 ? diffDays : 1;
}

export function BookingCard({
  roomId,
  roomName,
  pricePerNight,
  ratingText,
  reviewCountText,
  maxGuests,
}: BookingCardProps) {
  const checkInInputRef = useRef<HTMLInputElement>(null);
  const checkOutInputRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date(), []);
  const initialCheckIn = formatInputDate(today);
  const initialCheckOut = formatInputDate(addDays(today, 3));

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestCount, setGuestCount] = useState(Math.max(1, maxGuests));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stayNights = getNightCount(checkIn, checkOut);
  const subtotal = pricePerNight * stayNights;
  const serviceFee = Math.round(pricePerNight * 0.12);
  const cleaningFee = Math.round(pricePerNight * 0.08);
  const totalPrice = subtotal + serviceFee + cleaningFee;

  function handleCheckInChange(value: string) {
    setCheckIn(value);

    if (value >= checkOut) {
      setCheckOut(formatInputDate(addDays(new Date(`${value}T00:00:00`), 1)));
    }
  }

  function handleCheckOutChange(value: string) {
    if (value <= checkIn) {
      setCheckOut(formatInputDate(addDays(new Date(`${checkIn}T00:00:00`), 1)));
      return;
    }

    setCheckOut(value);
  }

  function decreaseGuest() {
    setGuestCount((current) => Math.max(1, current - 1));
  }

  function increaseGuest() {
    setGuestCount((current) => Math.min(maxGuests, current + 1));
  }

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input) {
      return;
    }

    input.focus();
    input.showPicker?.();
  }

  async function handleConfirmBooking() {
    try {
      setIsSubmitting(true);
      await bookingFlowService.create({
        maPhong: roomId,
        ngayDen: checkIn,
        ngayDi: checkOut,
        soLuongKhach: guestCount,
      });
      setIsConfirmOpen(false);
      toast.success("Đặt phòng thành công. Bạn có thể xem lại trong hồ sơ.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể hoàn tất đặt phòng.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <article className="rounded-[28px] border border-line bg-white p-6 text-slate-950 shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
          <p className="text-3xl font-extrabold text-slate-950">
            {formatCurrency(pricePerNight)}
            <span className="ml-1 text-base font-medium text-slate-500">/ đêm</span>
          </p>
          <div className="text-right">
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-950">
              <Star className="h-4 w-4 fill-[#0f2f8e] text-[#0f2f8e]" />
              {ratingText}
            </p>
            <p className="mt-1 text-sm text-slate-500">{reviewCountText}</p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-line">
          <div className="grid sm:grid-cols-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => openDatePicker(checkInInputRef.current)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDatePicker(checkInInputRef.current);
                }
              }}
              className="relative border-b border-line bg-slate-50 px-4 py-4 sm:border-b-0 sm:border-r"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nhận phòng
              </span>
              <span className="mt-2 flex items-center justify-between gap-3 font-semibold text-slate-950">
                <span>{formatDisplayDate(checkIn)}</span>
                <CalendarDays className="h-4 w-4 text-[#0f2f8e]" />
              </span>
              <input
                ref={checkInInputRef}
                type="date"
                value={checkIn}
                min={initialCheckIn}
                onChange={(event) => handleCheckInChange(event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Chọn ngày nhận phòng"
              />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => openDatePicker(checkOutInputRef.current)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDatePicker(checkOutInputRef.current);
                }
              }}
              className="relative bg-slate-50 px-4 py-4"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Trả phòng
              </span>
              <span className="mt-2 flex items-center justify-between gap-3 font-semibold text-slate-950">
                <span>{formatDisplayDate(checkOut)}</span>
                <CalendarDays className="h-4 w-4 text-[#0f2f8e]" />
              </span>
              <input
                ref={checkOutInputRef}
                type="date"
                value={checkOut}
                min={formatInputDate(addDays(new Date(`${checkIn}T00:00:00`), 1))}
                onChange={(event) => handleCheckOutChange(event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Chọn ngày trả phòng"
              />
            </div>
          </div>

          <div className="border-t border-line px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Khách
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={decreaseGuest}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0f2f8e] text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={guestCount <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="text-xl font-bold text-slate-950">{guestCount} khách</p>
                <p className="text-sm text-slate-500">Tối đa {maxGuests} khách</p>
              </div>

              <button
                type="button"
                onClick={increaseGuest}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0f2f8e] text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={guestCount >= maxGuests}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b246d]"
        >
          Đặt phòng
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Bạn vẫn chưa bị trừ tiền
        </p>

        <div className="mt-6 space-y-4 border-t border-line pt-5 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <span className="underline underline-offset-4">
              {formatCurrency(pricePerNight)} x {stayNights} đêm
            </span>
            <span className="font-semibold text-slate-950">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="underline underline-offset-4">Phí dịch vụ Stayora</span>
            <span className="font-semibold text-slate-950">{formatCurrency(serviceFee)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="underline underline-offset-4">Phí dọn dẹp</span>
            <span className="font-semibold text-slate-950">{formatCurrency(cleaningFee)}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3 text-base font-bold text-slate-950">
            <span>Tổng trước thuế</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </article>

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,47,142,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <h3 className="text-2xl font-extrabold text-slate-950">
                Xác nhận đặt phòng
              </h3>

              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
                aria-label="Đóng xác nhận đặt phòng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-[24px] border border-line bg-slate-50 p-5">
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-line bg-white p-4">
                    <div className="flex min-h-[104px] items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f2f8e] text-white">
                        <House className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-500">Phòng đã chọn</p>
                        <p className="mt-1 break-words font-bold text-slate-950">
                          {roomName}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">Mã phòng #{roomId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-line bg-white p-4">
                    <div className="flex min-h-[104px] items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f2f8e] text-white">
                        <Users className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-500">Số lượng khách</p>
                        <p className="mt-1 font-bold text-slate-950">{guestCount} khách</p>
                        <p className="mt-2 text-sm text-slate-500">Tối đa {maxGuests} khách</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-line bg-white p-4">
                    <div className="flex min-h-[104px] items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f2f8e] text-white">
                        <CalendarDays className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-500">Thời gian lưu trú</p>
                        <p className="mt-1 break-words font-bold text-slate-950">
                          {formatDisplayDate(checkIn)} - {formatDisplayDate(checkOut)}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Tổng thời gian lưu trú {stayNights} đêm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <aside className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f2f8e] text-white">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <h4 className="text-xl font-bold text-slate-950">Tóm tắt thanh toán</h4>
                </div>

                <div className="mt-5 space-y-4 border-t border-line pt-5 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {formatCurrency(pricePerNight)} x {stayNights} đêm
                    </span>
                    <span className="font-semibold text-slate-950">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Phí dịch vụ Stayora</span>
                    <span className="font-semibold text-slate-950">
                      {formatCurrency(serviceFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Phí dọn dẹp</span>
                    <span className="font-semibold text-slate-950">
                      {formatCurrency(cleaningFee)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  <div className="flex items-center justify-between gap-3 text-base font-bold text-slate-950">
                    <span>Tổng trước thuế</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 text-sm font-semibold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Đang xác nhận đặt phòng" : "Xác nhận đặt phòng"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmOpen(false)}
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-line px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Tiếp tục chỉnh thông tin
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
