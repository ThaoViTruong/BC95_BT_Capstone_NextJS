"use client";

import {
  CarFront,
  ChevronDown,
  CookingPot,
  MapPin,
  Monitor,
  Search,
  Shirt,
  Waves,
  Wifi,
  Wind,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RoomSearchFormProps = {
  action: string;
  destination?: string;
  roomName?: string;
  amenity?: string;
  checkIn?: string;
  checkOut?: string;
  guest?: string;
  locationOptions?: Array<{ value: string; label: string }>;
  amenityOptions?: Array<{ value: string; label: string }>;
  className?: string;
  panelClassName?: string;
  submitClassName?: string;
  compact?: boolean;
};

function getLocationSubtitle(option: { value: string; label: string }) {
  if (option.value && option.value !== option.label) {
    return option.value;
  }

  return "Khu vực nổi bật";
}

function getAmenityIcon(value: string) {
  switch (value) {
    case "wifi":
      return Wifi;
    case "ho boi":
      return Waves;
    case "dieu hoa":
      return Wind;
    case "bep":
      return CookingPot;
    case "do xe":
      return CarFront;
    case "may giat":
      return Shirt;
    case "tivi":
      return Monitor;
    case "ban ui":
      return Shirt;
    default:
      return Search;
  }
}

function renderAmenityIcon(value: string, className: string) {
  const Icon = getAmenityIcon(value);

  return <Icon className={className} />;
}

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
  amenityOptions = [],
  className,
  panelClassName,
  submitClassName,
  compact = false,
}: RoomSearchFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [checkInValue, setCheckInValue] = useState(checkIn);
  const [checkOutValue, setCheckOutValue] = useState(checkOut);
  const [selectedDestination, setSelectedDestination] = useState(destination);
  const [selectedAmenity, setSelectedAmenity] = useState(amenity);
  const [openPanel, setOpenPanel] = useState<"destination" | "amenity" | null>(null);

  const minCheckOutDate = useMemo(() => getNextDate(checkInValue), [checkInValue]);
  const selectedLocationOption = useMemo(
    () => locationOptions.find((option) => option.value === selectedDestination) ?? null,
    [locationOptions, selectedDestination],
  );
  const selectedAmenityOption = useMemo(
    () => amenityOptions.find((option) => option.value === selectedAmenity) ?? null,
    [amenityOptions, selectedAmenity],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!formRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      ref={formRef}
      action={action}
      className={cn(
        "grid gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12",
        className,
      )}
    >
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="diemDen" value={selectedDestination} />
      <input type="hidden" name="tienIch" value={selectedAmenity} />

      <div
        className={cn(
          "rounded-2xl border border-line bg-white px-3 py-2.5 xl:col-span-3",
          panelClassName,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Bạn muốn đi đâu?
        </span>
        <button
          type="button"
          onClick={() =>
            setOpenPanel((current) => (current === "destination" ? null : "destination"))
          }
          aria-expanded={openPanel === "destination"}
          className={cn(
            "mt-1.5 flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2.5 text-left transition hover:border-[#0f2f8e]",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#0f2f8e]">
            <MapPin className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900">
              {selectedLocationOption?.label ?? "Chọn địa điểm"}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {selectedLocationOption
                ? getLocationSubtitle(selectedLocationOption)
                : "Mở danh sách khu vực nổi bật"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#0f2f8e] transition",
              openPanel === "destination" && "rotate-180",
            )}
          />
        </button>
      </div>

      <label
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-2.5 xl:col-span-4",
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

      <div
        className={cn(
          "rounded-2xl border border-line bg-white px-3 py-2.5 xl:col-span-3",
          panelClassName,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tiện ích
        </span>
        <button
          type="button"
          onClick={() => setOpenPanel((current) => (current === "amenity" ? null : "amenity"))}
          aria-expanded={openPanel === "amenity"}
          className={cn(
            "mt-1.5 flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2.5 text-left transition hover:border-[#0f2f8e]",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#0f2f8e]">
            {renderAmenityIcon(selectedAmenityOption?.value ?? "", "h-4.5 w-4.5")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900">
              {selectedAmenityOption?.label ?? "Tất cả tiện ích"}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {selectedAmenityOption ? "Đang lọc theo tiện ích này" : "Chọn nhanh theo tiện ích nổi bật"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#0f2f8e] transition",
              openPanel === "amenity" && "rotate-180",
            )}
          />
        </button>
      </div>

      <label
        className={cn(
          "rounded-2xl border border-line bg-white px-4 py-2.5 xl:col-span-2",
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

      {openPanel === "destination" ? (
        <div className="md:col-span-2 lg:col-span-4 xl:col-span-12">
          <div className="rounded-[28px] border border-[#dbe4ff] bg-white p-3 shadow-xl sm:p-4 xl:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#0f2f8e]">Chọn địa điểm</p>
                <p className="text-xs text-slate-500">Danh sách địa điểm thật lấy từ API hiện tại</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDestination("");
                  setOpenPanel(null);
                }}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e]"
              >
                Bỏ chọn
              </button>
            </div>

            <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:max-h-none xl:grid-cols-3 2xl:grid-cols-4">
              {locationOptions.map((option) => {
                const isSelected = selectedDestination === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedDestination(option.value);
                      setOpenPanel(null);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                      isSelected
                        ? "border-[#0f2f8e] bg-[#0f2f8e] text-white shadow-lg shadow-[#0f2f8e]/20"
                        : "border-slate-200 bg-white text-slate-900 hover:border-[#0f2f8e] hover:bg-[#f8fbff]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        isSelected ? "bg-white/15 text-white" : "bg-[#eef4ff] text-[#0f2f8e]",
                      )}
                    >
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{option.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-xs",
                          isSelected ? "text-white/80" : "text-slate-500",
                        )}
                      >
                        {getLocationSubtitle(option)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {openPanel === "amenity" ? (
        <div className="md:col-span-2 lg:col-span-4 xl:col-span-12">
          <div className="rounded-[28px] border border-[#dbe4ff] bg-white p-3 shadow-xl sm:p-4 xl:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#0f2f8e]">Chọn tiện ích</p>
                <p className="text-xs text-slate-500">Lọc nhanh theo tiện ích bạn cần</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAmenity("");
                  setOpenPanel(null);
                }}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e]"
              >
                Bỏ chọn
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {amenityOptions.map((option) => {
                const isSelected = selectedAmenity === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedAmenity(option.value);
                      setOpenPanel(null);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                      isSelected
                        ? "border-[#0f2f8e] bg-[#0f2f8e] text-white shadow-lg shadow-[#0f2f8e]/20"
                        : "border-slate-200 bg-white text-slate-900 hover:border-[#0f2f8e] hover:bg-[#f8fbff]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        isSelected ? "bg-white/15 text-white" : "bg-[#eef4ff] text-[#0f2f8e]",
                      )}
                    >
                      {renderAmenityIcon(option.value, "h-5 w-5")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{option.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-xs",
                          isSelected ? "text-white/80" : "text-slate-500",
                        )}
                      >
                        Chọn để lọc phòng theo tiện ích này
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-[22px] border border-slate-200 bg-slate-50/80 p-2 md:col-span-2 lg:col-span-2 xl:col-span-8",
          panelClassName && "border-transparent bg-slate-50/80",
        )}
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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
              "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1 xl:self-center",
              compact && "min-h-[46px] text-xs",
            )}
          >
            <X className="h-4 w-4" />
            Xóa ngày
          </button>
        </div>
      </div>

      <div className="md:col-span-2 lg:col-span-2 xl:col-span-4">
        <button
          type="submit"
          className={cn(
            "inline-flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0f2f8e] px-6 text-sm font-semibold text-white transition hover:bg-[#0b246d] sm:min-h-[68px]",
            submitClassName,
          )}
        >
          <Search className="h-4 w-4" />
          Tìm phòng
        </button>
      </div>

    </form>
  );
}
