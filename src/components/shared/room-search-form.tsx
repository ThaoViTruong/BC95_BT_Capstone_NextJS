"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type RoomSearchFormProps = {
  action: string;
  destination?: string;
  roomName?: string;
  amenity?: string;
  checkIn?: string;
  checkOut?: string;
  guest?: string;
  locationOptions?: string[];
  className?: string;
  panelClassName?: string;
  submitClassName?: string;
  compact?: boolean;
};

function getNextDate(value: string) {
  if (!value) {
    return "";
  }

  const baseDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(baseDate.getTime())) {
    return "";
  }

  baseDate.setDate(baseDate.getDate() + 1);

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function RoomSearchForm({
  action,
  destination = "",
  roomName = "",
  amenity = "",
  checkIn = "",
  checkOut = "",
  guest = "",
  locationOptions = [],
  className,
  panelClassName,
  submitClassName,
  compact = false,
}: RoomSearchFormProps) {
  const locationListId = "stayora-location-options";
  const [checkInValue, setCheckInValue] = useState(checkIn);
  const [checkOutValue, setCheckOutValue] = useState(checkOut);

  const minCheckOutDate = useMemo(() => getNextDate(checkInValue), [checkInValue]);

  const handleCheckInChange = (value: string) => {
    const nextMinCheckOutDate = getNextDate(value);

    setCheckInValue(value);

    if (!value) {
      return;
    }

    if (checkOutValue && nextMinCheckOutDate && checkOutValue < nextMinCheckOutDate) {
      setCheckOutValue("");
    }
  };

  const handleClearDates = () => {
    setCheckInValue("");
    setCheckOutValue("");
  };

  return (
    <form
      action={action}
      className={cn(
        "grid gap-2 md:grid-cols-2 xl:grid-cols-12",
        className,
      )}
    >
      <input type="hidden" name="page" value="1" />

      <label
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-3 xl:col-span-3",
          panelClassName,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Bạn muốn đi đâu?
        </span>
        <input
          name="diemDen"
          defaultValue={destination}
          list={locationListId}
          placeholder="Ví dụ: Hồ Chí Minh"
          className={cn(
            "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        />
      </label>

      <label
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-3 xl:col-span-3",
          panelClassName,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tên phòng
        </span>
        <input
          name="tenPhong"
          defaultValue={roomName}
          placeholder="Ví dụ: studio, sea view"
          className={cn(
            "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        />
      </label>

      <label
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-3 xl:col-span-3",
          panelClassName,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tiện ích
        </span>
        <input
          name="tienIch"
          defaultValue={amenity}
          placeholder="Ví dụ: wifi, hồ bơi, bếp"
          className={cn(
            "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        />
      </label>

      <label
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-3 xl:col-span-3",
          panelClassName,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Số khách
        </span>
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          name="khach"
          defaultValue={guest}
          placeholder="Nhập số khách"
          className={cn(
            "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        />
      </label>

      <div
        className={cn(
          "rounded-[22px] border border-slate-200 bg-slate-50/80 p-2 md:col-span-2 xl:col-span-8",
          panelClassName && "border-transparent bg-slate-50/80",
        )}
      >
        <div className="grid gap-2 xl:grid-cols-[1fr_1fr_auto]">
          <label className="rounded-2xl border border-line bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Nhận phòng
            </span>
            <input
              type="date"
              name="ngayNhan"
              value={checkInValue}
              onChange={(event) => handleCheckInChange(event.target.value)}
              className={cn(
                "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
                compact ? "text-sm" : "text-sm sm:text-base",
              )}
            />
          </label>

          <label className="rounded-2xl border border-line bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Trả phòng
            </span>
            <input
              type="date"
              name="ngayTra"
              value={checkOutValue}
              min={minCheckOutDate || undefined}
              onChange={(event) => setCheckOutValue(event.target.value)}
              className={cn(
                "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
                compact ? "text-sm" : "text-sm sm:text-base",
              )}
            />
          </label>

          <button
            type="button"
            onClick={handleClearDates}
            disabled={!checkInValue && !checkOutValue}
            className={cn(
              "inline-flex min-h-[52px] items-center justify-center gap-2 self-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e] disabled:cursor-not-allowed disabled:opacity-50",
              compact && "min-h-[46px] text-xs",
            )}
          >
            <X className="h-4 w-4" />
            Xóa ngày
          </button>
        </div>
      </div>

      <div className="md:col-span-2 xl:col-span-4">
        <button
          type="submit"
          className={cn(
            "inline-flex min-h-[68px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0f2f8e] px-6 text-sm font-semibold text-white transition hover:bg-[#0b246d]",
            submitClassName,
          )}
        >
          <Search className="h-4 w-4" />
          Tìm phòng
        </button>
      </div>

      <datalist id={locationListId}>
        {locationOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </form>
  );
}
