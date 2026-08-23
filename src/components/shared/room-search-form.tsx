import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

type RoomSearchFormProps = {
  action: string;
  destination?: string;
  keyword?: string;
  guest?: string;
  locationOptions?: string[];
  className?: string;
  panelClassName?: string;
  submitClassName?: string;
  compact?: boolean;
};

export function RoomSearchForm({
  action,
  destination = "",
  keyword = "",
  guest = "",
  locationOptions = [],
  className,
  panelClassName,
  submitClassName,
  compact = false,
}: RoomSearchFormProps) {
  const locationListId = "stayora-location-options";

  return (
    <form action={action} className={cn("grid gap-2 md:grid-cols-[1.1fr_1fr_0.8fr_auto]", className)}>
      <label className={cn("rounded-2xl border border-line bg-white px-4 py-3", panelClassName)}>
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

      <label className={cn("rounded-2xl border border-line bg-white px-4 py-3", panelClassName)}>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Từ khóa phòng
        </span>
        <input
          name="tuKhoa"
          defaultValue={keyword}
          placeholder="Villa, căn hộ, gần biển..."
          className={cn(
            "mt-1 w-full border-none bg-transparent text-slate-900 outline-none",
            compact ? "text-sm" : "text-sm sm:text-base",
          )}
        />
      </label>

      <label className={cn("rounded-2xl border border-line bg-white px-4 py-3", panelClassName)}>
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

      <button
        type="submit"
        className={cn(
          "inline-flex min-h-[68px] items-center justify-center gap-2 rounded-2xl bg-[#0f2f8e] px-6 text-sm font-semibold text-white transition hover:bg-[#0b246d]",
          submitClassName,
        )}
      >
        <Search className="h-4 w-4" />
        Tìm phòng
      </button>

      <datalist id={locationListId}>
        {locationOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </form>
  );
}
