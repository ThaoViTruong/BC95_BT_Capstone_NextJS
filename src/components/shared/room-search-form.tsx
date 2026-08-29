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
  const isDestinationPanelOpen = openPanel === "destination";
  const isAmenityPanelOpen = openPanel === "amenity";

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
        "grid gap-1 md:grid-cols-2 md:gap-1.5 lg:grid-cols-4 xl:grid-cols-12",
        className,
      )}
    >
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="diemDen" value={selectedDestination} />
      <input type="hidden" name="tienIch" value={selectedAmenity} />

      <div
        className={cn(
          "min-w-0 rounded-xl border border-line bg-white px-2 py-1.5 xl:col-span-3",
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
            "mt-1 flex w-full min-w-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 text-left transition hover:border-[#0f2f8e]",
            compact ? "text-sm" : "text-[11px] sm:text-base",
          )}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#0f2f8e] sm:h-10 sm:w-10 sm:rounded-2xl">
            <MapPin className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900">
              {selectedLocationOption?.label ?? "Chọn địa điểm"}
            </span>
            <span className="block truncate text-[10px] text-slate-500 sm:text-xs">
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
          "min-w-0 rounded-xl border border-line bg-white px-2.5 py-1.5 xl:col-span-4",
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
            "mt-1 w-full min-w-0 border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-[11px] sm:text-base",
          )}
        />
      </label>

      <div
        className={cn(
          "min-w-0 rounded-xl border border-line bg-white px-2 py-1.5 xl:col-span-3",
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
            "mt-1 flex w-full min-w-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 text-left transition hover:border-[#0f2f8e]",
            compact ? "text-sm" : "text-[11px] sm:text-base",
          )}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#0f2f8e] sm:h-10 sm:w-10 sm:rounded-2xl">
            {renderAmenityIcon(selectedAmenityOption?.value ?? "", "h-3.5 w-3.5 sm:h-4.5 sm:w-4.5")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900">
              {selectedAmenityOption?.label ?? "Tất cả tiện ích"}
            </span>
            <span className="block truncate text-[10px] text-slate-500 sm:text-xs">
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
          "min-w-0 rounded-xl border border-line bg-white px-2.5 py-1.5 xl:col-span-2",
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
            "mt-1 w-full min-w-0 border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-[11px] sm:text-base",
          )}
        />
      </label>

      <div
        className={cn(
          "rounded-[20px] border border-slate-200 bg-slate-50/80 p-1 md:col-span-2 md:p-1.5 lg:col-span-2 xl:col-span-8",
          panelClassName && "border-transparent bg-slate-50/80",
        )}
      >
        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="min-w-0 rounded-xl border border-line bg-white px-2.5 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Nhận phòng
            </span>
            <input
              type="date"
              name="ngayNhan"
              value={checkInValue}
              onChange={(event) => handleCheckInChange(event.target.value)}
              className={cn(
                "mt-1 w-full min-w-0 border-none bg-transparent text-slate-900 outline-none",
                compact ? "text-sm" : "text-[11px] sm:text-base",
              )}
            />
          </label>

          <label className="min-w-0 rounded-xl border border-line bg-white px-2.5 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
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
                "mt-1 w-full min-w-0 border-none bg-transparent text-slate-900 outline-none",
                compact ? "text-sm" : "text-[11px] sm:text-base",
              )}
            />
          </label>

          <button
            type="button"
            onClick={handleClearDates}
            disabled={!checkInValue && !checkOutValue}
            className={cn(
              "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:min-h-[52px] sm:px-4 sm:text-sm xl:col-span-1 xl:self-center",
              compact && "min-h-[38px] text-[11px]",
            )}
          >
            <X className="h-3.5 w-3.5" />
            Xóa ngày
          </button>
        </div>
      </div>

      <div className="md:col-span-2 lg:col-span-2 xl:col-span-4">
        <button
          type="submit"
          className={cn(
            "inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f2f8e] px-4 text-[11px] font-semibold text-white transition hover:bg-[#0b246d] sm:min-h-[68px] sm:gap-2 sm:rounded-2xl sm:px-6 sm:text-sm",
            submitClassName,
          )}
        >
          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Tìm phòng
        </button>
      </div>

      {(isDestinationPanelOpen || isAmenityPanelOpen) && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center bg-black/45 p-2.5 sm:items-center sm:p-4 md:p-5"
          onClick={() => setOpenPanel(null)}
        >
          <div
            className={cn(
              "w-full overflow-hidden rounded-[28px] border border-[#dbe4ff] bg-white shadow-2xl",
              isDestinationPanelOpen ? "max-w-6xl" : "max-w-5xl",
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex max-h-[calc(100vh-1rem)] flex-col p-2.5 sm:max-h-[calc(100vh-3rem)] sm:p-3.5 md:p-4 xl:p-5">
              <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3 sm:gap-3">
                <div>
                  <p className="text-xs font-bold text-[#0f2f8e] sm:text-sm">
                    {isDestinationPanelOpen ? "Chọn địa điểm" : "Chọn tiện ích"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isDestinationPanelOpen) {
                      setSelectedDestination("");
                    }

                    if (isAmenityPanelOpen) {
                      setSelectedAmenity("");
                    }

                    setOpenPanel(null);
                  }}
                  className="whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[#0f2f8e] hover:text-[#0f2f8e] sm:px-3 sm:py-1.5 sm:text-xs"
                >
                  Bỏ chọn
                </button>
              </div>

              {isDestinationPanelOpen ? (
                <div className="grid max-h-[calc(100vh-6.5rem)] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:max-h-[calc(100vh-9rem)] sm:grid-cols-2 sm:gap-2 md:grid-cols-3 md:gap-2.5 xl:max-h-[calc(100vh-12rem)] xl:grid-cols-4 2xl:grid-cols-5">
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
                          "flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-2 text-left transition sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-2.5 md:gap-2.5 md:px-3 md:py-3",
                          isSelected
                            ? "border-[#0f2f8e] bg-[#0f2f8e] text-white shadow-lg shadow-[#0f2f8e]/20"
                            : "border-slate-200 bg-white text-slate-900 hover:border-[#0f2f8e] hover:bg-[#f8fbff]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 sm:rounded-2xl md:h-10 md:w-10",
                            isSelected ? "bg-white/15 text-white" : "bg-[#eef4ff] text-[#0f2f8e]",
                          )}
                        >
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold leading-tight sm:text-sm md:text-[15px]">
                            {option.label}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid max-h-[calc(100vh-6.5rem)] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:max-h-[calc(100vh-9rem)] sm:grid-cols-2 sm:gap-2 md:grid-cols-3 md:gap-2.5 xl:max-h-[calc(100vh-12rem)] xl:grid-cols-4 2xl:grid-cols-5">
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
                          "flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-2 text-left transition sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-2.5 md:gap-2.5 md:px-3 md:py-3",
                          isSelected
                            ? "border-[#0f2f8e] bg-[#0f2f8e] text-white shadow-lg shadow-[#0f2f8e]/20"
                            : "border-slate-200 bg-white text-slate-900 hover:border-[#0f2f8e] hover:bg-[#f8fbff]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 sm:rounded-2xl md:h-10 md:w-10",
                            isSelected ? "bg-white/15 text-white" : "bg-[#eef4ff] text-[#0f2f8e]",
                          )}
                        >
                          {renderAmenityIcon(option.value, "h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold leading-tight sm:text-sm md:text-[15px]">
                            {option.label}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </form>
  );
}
