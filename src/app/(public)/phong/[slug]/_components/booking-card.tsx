"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  House,
  Minus,
  Plus,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { getBookingNightCount, hasMinimumOneNightStay, normalizeBookingDate } from "@/lib/booking-date";
import { formatCurrency } from "@/lib/format";
import { bookingFlowService } from "@/services/booking-flow.service";
import type { Booking } from "@/types/booking";

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

function parseDateString(value: string) {
  const normalizedValue = normalizeBookingDate(value);

  if (!normalizedValue) {
    return null;
  }

  const date = new Date(`${normalizedValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthOnlyLabel(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
  }).format(date);
}

function toDateString(date: Date) {
  return formatInputDate(date);
}

function formatPanelDate(value: string) {
  const date = parseDateString(value);

  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getSundayIndex(date: Date) {
  return date.getDay();
}

function isDateInRange(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

function getYearOptions(baseYear: number) {
  return Array.from({ length: 6 }, (_, index) => baseYear + index);
}

function isOverlappingRange(checkIn: string, checkOut: string, booking: Booking) {
  const startA = parseDateString(checkIn)?.getTime();
  const endA = parseDateString(checkOut)?.getTime();
  const startB = parseDateString(booking.ngayDen)?.getTime();
  const endB = parseDateString(booking.ngayDi)?.getTime();

  if (!startA || !endA || !startB || !endB) {
    return false;
  }

  // Quy ước mới: ngày trả phòng vẫn bị chặn cho booking khác (inclusive).
  return startA <= endB && endA >= startB;
}

function getNightCount(checkIn: string, checkOut: string) {
  return getBookingNightCount(checkIn, checkOut);
}

type CalendarPanelProps = {
  mode: "checkIn" | "checkOut";
  placement: "top" | "bottom";
  selected: string;
  minValue: string;
  today: Date;
  initialCheckIn: string;
  checkIn: string;
  checkOut: string;
  occupiedDateSet: Set<string>;
  onToggleMode: (mode: "checkIn" | "checkOut") => void;
  isDisabled: (value: string) => boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function CalendarPanel({
  mode,
  placement,
  selected,
  minValue,
  today,
  initialCheckIn,
  checkIn,
  checkOut,
  occupiedDateSet,
  onToggleMode,
  isDisabled,
  onSelect,
  onClose,
}: CalendarPanelProps) {
  const selectedDate = parseDateString(selected) ?? today;
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(selectedDate));
  const yearOptions = getYearOptions(today.getFullYear());

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const startOffset = getSundayIndex(monthStart);
  const gridStart = addDays(monthStart, -startOffset);

  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const monthOptions = Array.from({ length: 12 }, (_, index) => index);
  const isCheckInMode = mode === "checkIn";

  return (
    <div
      data-calendar-panel="true"
      className={[
        "absolute left-1/2 z-50 w-[calc(100vw-1rem)] max-w-[320px] -translate-x-1/2 overflow-hidden rounded-[20px] border border-slate-800 bg-[#050b18] text-white shadow-[0_22px_48px_rgba(2,6,23,0.5)] sm:left-0 sm:max-w-[calc(100vw-1rem)] sm:translate-x-0 sm:w-[276px]",
        placement === "top" ? "bottom-full mb-3" : "top-full mt-1.5",
      ].join(" ")}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="space-y-2 border-b border-slate-800/90 bg-[#060d1b] p-2">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onToggleMode("checkIn")}
            className={`rounded-[14px] border px-2 py-1.5 text-left transition ${
              isCheckInMode
                ? "border-[#0f2f8e] bg-[#0b1326] shadow-[inset_0_0_0_1px_rgba(15,47,142,0.35)]"
                : "border-slate-800 bg-[#0a111f] hover:border-slate-700"
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Nhận phòng
            </span>
            <span className="mt-0.5 block text-[12px] font-semibold text-white">
              {formatPanelDate(checkIn)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleMode("checkOut")}
            className={`rounded-[14px] border px-2 py-1.5 text-left transition ${
              !isCheckInMode
                ? "border-[#0f2f8e] bg-[#0b1326] shadow-[inset_0_0_0_1px_rgba(15,47,142,0.35)]"
                : "border-slate-800 bg-[#0a111f] hover:border-slate-700"
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Trả phòng
            </span>
            <span className="mt-0.5 block text-[12px] font-semibold text-white">
              {formatPanelDate(checkOut)}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setMonthCursor((current) => startOfMonth(addDays(current, -1)))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] border border-slate-800 bg-[#0a111f] text-slate-200 transition hover:border-[#0f2f8e] hover:text-white"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="grid flex-1 grid-cols-[minmax(0,1.2fr)_68px] gap-1">
            <label className="relative">
              <span className="sr-only">Chọn tháng</span>
              <select
                value={monthCursor.getMonth()}
                onChange={(event) =>
                  setMonthCursor(
                    new Date(
                      monthCursor.getFullYear(),
                      Number(event.target.value),
                      1,
                    ),
                  )
                }
                className="h-7 w-full appearance-none rounded-[9px] border border-slate-800 bg-[#0a111f] px-2 pr-7 text-[12px] font-semibold text-white outline-none transition focus:border-[#0f2f8e]"
              >
                {monthOptions.map((monthIndex) => (
                  <option key={monthIndex} value={monthIndex} className="bg-slate-950">
                    {formatMonthOnlyLabel(new Date(monthCursor.getFullYear(), monthIndex, 1))}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="relative">
              <span className="sr-only">Chọn năm</span>
              <select
                value={monthCursor.getFullYear()}
                onChange={(event) =>
                  setMonthCursor(
                    new Date(
                      Number(event.target.value),
                      monthCursor.getMonth(),
                      1,
                    ),
                  )
                }
                className="h-7 w-full appearance-none rounded-[9px] border border-slate-800 bg-[#0a111f] px-2 pr-7 text-[12px] font-semibold text-white outline-none transition focus:border-[#0f2f8e]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year} className="bg-slate-950">
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setMonthCursor((current) => startOfMonth(addDays(endOfMonth(current), 1)))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] border border-slate-800 bg-[#0a111f] text-slate-200 transition hover:border-[#0f2f8e] hover:text-white"
            aria-label="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1.5">
        <p className="mb-1.5 text-[12px] font-semibold text-slate-300">
          {formatMonthLabel(monthCursor)}
        </p>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {weekdays.map((label) => (
            <div key={label} className="py-0.5">
              {label}
            </div>
          ))}
        </div>

        <div className="mt-0.5 grid grid-cols-7 gap-0.5">
          {Array.from({ length: 42 }).map((_, index) => {
            const date = addDays(gridStart, index);
            const value = toDateString(date);
            const isCurrentMonth = date >= monthStart && date <= monthEnd;
            const isBooked = occupiedDateSet.has(value);
            const isPast = value < initialCheckIn;
            const disabled = value < minValue || isDisabled(value);
            const isSelected = value === selected;
            const isToday = isSameDate(date, today);
            const isDimmed = isBooked || isPast;
            const isRangeStart = value === checkIn;
            const isRangeEnd = value === checkOut;
            const isInSelectedRange =
              !disabled &&
              isDateInRange(value, checkIn, checkOut) &&
              !isRangeStart &&
              !isRangeEnd;

            return (
              <button
                key={`${monthCursor.getFullYear()}-${monthCursor.getMonth()}-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(value)}
                className={[
                  "relative h-7 rounded-[9px] text-[12px] font-semibold transition",
                  isCurrentMonth ? "text-slate-100" : "text-slate-700",
                  disabled ? "cursor-not-allowed" : "hover:bg-[#0f2f8e] hover:text-white",
                  isDimmed && !isSelected ? "bg-transparent text-slate-700 opacity-55" : "",
                  disabled && !isDimmed && !isSelected ? "bg-transparent text-slate-700" : "",
                  isToday && !disabled ? "border border-slate-700" : "border border-transparent",
                  isInSelectedRange ? "bg-[#0f2f8e]/20 text-white" : "",
                  isRangeStart || isRangeEnd
                    ? "bg-[#0f2f8e] text-white shadow-[0_10px_24px_rgba(15,47,142,0.42)] hover:bg-[#0b246d]"
                    : "",
                ].join(" ")}
                aria-label={
                  isBooked
                    ? `Ngày ${formatDisplayDate(value)} đã được đặt`
                    : `Chọn ngày ${formatDisplayDate(value)}`
                }
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 px-2 py-2">
        <button
          type="button"
          onClick={() => onSelect(toDateString(today))}
          className="inline-flex items-center rounded-[9px] border border-slate-700 bg-[#0a111f] px-2 py-1 text-[12px] font-semibold text-slate-200 transition hover:border-[#0f2f8e] hover:text-white"
        >
          Hôm nay
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-[9px] bg-[#0f2f8e] px-2 py-1 text-[12px] font-semibold text-white transition hover:bg-[#0b246d]"
        >
          Đóng
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function BookingCard({
  roomId,
  roomName,
  pricePerNight,
  ratingText,
  reviewCountText,
  maxGuests,
}: BookingCardProps) {
  const today = useMemo(() => new Date(), []);
  const initialCheckIn = formatInputDate(today);
  const initialCheckOut = formatInputDate(addDays(today, 3));

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestCount, setGuestCount] = useState(Math.max(1, maxGuests));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [calendarPlacement, setCalendarPlacement] = useState<"top" | "bottom">("bottom");
  const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  const checkInPanelRef = useRef<HTMLDivElement>(null);
  const checkOutPanelRef = useRef<HTMLDivElement>(null);

  const stayNights = getNightCount(checkIn, checkOut);
  const subtotal = pricePerNight * stayNights;
  const totalPrice = subtotal;

  const occupiedDateSet = useMemo(() => {
    const dates = new Set<string>();

    roomBookings.forEach((booking) => {
      const start = parseDateString(booking.ngayDen);
      const end = parseDateString(booking.ngayDi);

      if (!start || !end) {
        return;
      }

      // Chặn toàn bộ khoảng ngày đã đặt, gồm cả ngày trả phòng.
      const cursor = new Date(start);
      while (cursor <= end) {
        dates.add(toDateString(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return dates;
  }, [roomBookings]);

  useEffect(() => {
    let alive = true;

    async function fetchRoomBookings() {
      try {
        const response = await fetch(`/api/booking/room/${roomId}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          // Chưa đăng nhập thì bỏ qua (vẫn có validate phía server khi đặt)
          return;
        }

        const data = (await response.json()) as Booking[];

        if (alive) {
          setRoomBookings(Array.isArray(data) ? data : []);
        }
      } catch {
        // im lặng, không phá UX
      }
    }

    void fetchRoomBookings();

    return () => {
      alive = false;
    };
  }, [roomId]);

  function closeCalendarPanels() {
    setIsCheckInOpen(false);
    setIsCheckOutOpen(false);
  }

  useEffect(() => {
    if (!isCheckInOpen && !isCheckOutOpen) {
      return;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const clickedInsideCheckIn = checkInPanelRef.current?.contains(target) ?? false;
      const clickedInsideCheckOut = checkOutPanelRef.current?.contains(target) ?? false;

      if (!clickedInsideCheckIn && !clickedInsideCheckOut) {
        closeCalendarPanels();
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isCheckInOpen, isCheckOutOpen]);

  useEffect(() => {
    if (!isCheckInOpen && !isCheckOutOpen) {
      return;
    }

    const activePanelContainer = isCheckInOpen
      ? checkInPanelRef.current
      : checkOutPanelRef.current;

    function updateCalendarPlacement() {
      if (!activePanelContainer) {
        setCalendarPlacement("bottom");
        return;
      }

      const panelElement = activePanelContainer.querySelector<HTMLElement>(
        '[data-calendar-panel="true"]',
      );
      const containerRect = activePanelContainer.getBoundingClientRect();
      const panelHeight = panelElement?.getBoundingClientRect().height ?? 396;
      const viewportPadding = 16;
      const spaceBelow = window.innerHeight - containerRect.bottom - viewportPadding;
      const spaceAbove = containerRect.top - viewportPadding;
      const preferTopWhenTight = spaceBelow < panelHeight + 24 && spaceAbove >= 260;
      const isNearViewportBottom = containerRect.bottom > window.innerHeight * 0.6;

      setCalendarPlacement(
        preferTopWhenTight || (isNearViewportBottom && spaceAbove > spaceBelow)
          ? "top"
          : "bottom",
      );
    }

    const frameId = window.requestAnimationFrame(updateCalendarPlacement);
    window.addEventListener("resize", updateCalendarPlacement);
    window.addEventListener("scroll", updateCalendarPlacement, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateCalendarPlacement);
      window.removeEventListener("scroll", updateCalendarPlacement, true);
    };
  }, [isCheckInOpen, isCheckOutOpen]);

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

  const minCheckOut = useMemo(() => {
    return formatInputDate(addDays(new Date(`${checkIn}T00:00:00`), 1));
  }, [checkIn]);

  function isCheckInDisabled(dateString: string) {
    if (dateString < initialCheckIn) {
      return true;
    }

    // ngày đang có khách ở (đêm) thì không được check-in
    return occupiedDateSet.has(dateString);
  }

  function isCheckOutDisabled(dateString: string) {
    if (dateString <= checkIn) {
      return true;
    }

    // Theo rule mới, cả ngày check-out cũng bị chặn nếu đã thuộc booking khác.
    // Vì vậy khoảng ngày được xét là inclusive cho cả hai đầu.
    return roomBookings.some((booking) =>
      isOverlappingRange(checkIn, dateString, booking),
    );
  }

  function handleSelectCheckIn(nextValue: string) {
    if (isCheckInDisabled(nextValue)) {
      return;
    }

    handleCheckInChange(nextValue);
    setIsCheckInOpen(false);
    setIsCheckOutOpen(true);
  }

  function handleSelectCheckOut(nextValue: string) {
    if (isCheckOutDisabled(nextValue)) {
      return;
    }

    handleCheckOutChange(nextValue);
    setIsCheckOutOpen(false);
  }

  async function handleConfirmBooking() {
    if (!hasMinimumOneNightStay(checkIn, checkOut)) {
      toast.error("Thời gian lưu trú phải tối thiểu 1 đêm.");
      setIsConfirmOpen(false);
      return;
    }

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
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <p className="text-2xl font-extrabold text-slate-950 sm:text-3xl">
            {formatCurrency(pricePerNight)}
            <span className="ml-1 text-base font-medium text-slate-500">/ đêm</span>
          </p>
          <div className="text-left sm:text-right">
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-950">
              <Star className="h-4 w-4 fill-[#0f2f8e] text-[#0f2f8e]" />
              {ratingText}
            </p>
            <p className="mt-1 text-sm text-slate-500">{reviewCountText}</p>
          </div>
        </div>

        <div className="mt-5 overflow-visible rounded-[24px] border border-line">
          <div className="grid sm:grid-cols-2">
            <div
              ref={checkInPanelRef}
              role="button"
              tabIndex={0}
              onClick={() => {
                setIsCheckInOpen(true);
                setIsCheckOutOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsCheckInOpen(true);
                  setIsCheckOutOpen(false);
                }
              }}
              className={`relative ${isCheckInOpen ? "z-20" : ""} border-b border-line bg-white px-4 py-4 transition sm:border-b-0 sm:border-r ${
                isCheckInOpen ? "bg-slate-950/[0.03]" : ""
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Nhận phòng
              </span>
              <span className="mt-2 flex items-center justify-between gap-3 font-semibold text-slate-950">
                <span>{formatDisplayDate(checkIn)}</span>
                <CalendarDays className="h-4 w-4 text-[#0f2f8e]" />
              </span>
              {isCheckInOpen ? (
                <CalendarPanel
                  mode="checkIn"
                  placement={calendarPlacement}
                  selected={checkIn}
                  minValue={initialCheckIn}
                  today={today}
                  initialCheckIn={initialCheckIn}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  occupiedDateSet={occupiedDateSet}
                  onToggleMode={(nextMode) => {
                    setIsCheckInOpen(nextMode === "checkIn");
                    setIsCheckOutOpen(nextMode === "checkOut");
                  }}
                  isDisabled={isCheckInDisabled}
                  onSelect={handleSelectCheckIn}
                  onClose={closeCalendarPanels}
                />
              ) : null}
            </div>

            <div
              ref={checkOutPanelRef}
              role="button"
              tabIndex={0}
              onClick={() => {
                setIsCheckOutOpen(true);
                setIsCheckInOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsCheckOutOpen(true);
                  setIsCheckInOpen(false);
                }
              }}
              className={`relative ${isCheckOutOpen ? "z-20" : ""} bg-white px-4 py-4 transition ${
                isCheckOutOpen ? "bg-slate-950/[0.03]" : ""
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Trả phòng
              </span>
              <span className="mt-2 flex items-center justify-between gap-3 font-semibold text-slate-950">
                <span>{formatDisplayDate(checkOut)}</span>
                <CalendarDays className="h-4 w-4 text-[#0f2f8e]" />
              </span>
              {isCheckOutOpen ? (
                <CalendarPanel
                  mode="checkOut"
                  placement={calendarPlacement}
                  selected={checkOut}
                  minValue={minCheckOut}
                  today={today}
                  initialCheckIn={initialCheckIn}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  occupiedDateSet={occupiedDateSet}
                  onToggleMode={(nextMode) => {
                    setIsCheckInOpen(nextMode === "checkIn");
                    setIsCheckOutOpen(nextMode === "checkOut");
                  }}
                  isDisabled={isCheckOutDisabled}
                  onSelect={handleSelectCheckOut}
                  onClose={closeCalendarPanels}
                />
              ) : null}
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
          disabled={!hasMinimumOneNightStay(checkIn, checkOut)}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3 text-base font-bold text-slate-950">
            <span>Tổng tiền phòng</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </article>

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/45 p-3 sm:items-center sm:p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,47,142,0.22)] sm:max-h-[calc(100vh-2rem)] sm:overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <h3 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
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

            <div className="grid gap-5 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-[24px] border border-line bg-slate-50 p-4 sm:p-5">
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

              <aside className="rounded-[24px] border border-line bg-white p-4 shadow-sm sm:p-5">
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
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  <div className="flex items-center justify-between gap-3 text-base font-bold text-slate-950">
                    <span>Tổng tiền phòng</span>
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

