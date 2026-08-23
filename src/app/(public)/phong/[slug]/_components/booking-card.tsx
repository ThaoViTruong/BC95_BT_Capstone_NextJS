"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CalendarDays, Minus, Plus, Star } from "lucide-react";

import { formatCurrency } from "@/lib/format";

type BookingCardProps = {
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

  return (
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

      <Link
        href="/dat-phong"
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b246d]"
      >
        Đặt phòng
      </Link>

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
  );
}
