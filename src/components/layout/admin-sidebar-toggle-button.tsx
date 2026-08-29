"use client";

import { Menu } from "lucide-react";

export const ADMIN_SIDEBAR_OPEN_EVENT = "stayora-admin-sidebar-open";

type AdminSidebarToggleButtonProps = {
  className?: string;
};

export function AdminSidebarToggleButton({
  className,
}: AdminSidebarToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(ADMIN_SIDEBAR_OPEN_EVENT))}
      className={className}
      aria-label="Mở menu quản trị"
    >
      <Menu size={20} />
    </button>
  );
}
