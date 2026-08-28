import type { Route } from "next";

export type NavItem = {
  label: string;
  href: Route;
  note: string;
};

export type RoleKey = "guest" | "customer" | "admin";

export type RoleInfo = {
  key: RoleKey;
  title: string;
  desc: string;
  href: Route;
  items: NavItem[];
};

export const mainNav: NavItem[] = [
  { label: "Trang chủ", href: "/", note: "Trang giới thiệu" },
  { label: "Tài khoản", href: "/tai-khoan", note: "Khu khách đặt phòng" },
  { label: "Quản trị", href: "/quan-tri", note: "Khu quản trị hệ thống" },
];

export const roleList: RoleInfo[] = [
  {
    key: "guest",
    title: "Khách ghé qua",
    desc: "Xem phòng, xem thông tin dịch vụ và ra quyết định đặt phòng.",
    href: "/",
    items: [
      { label: "Trang chủ", href: "/", note: "Màn hình giới thiệu" },
      { label: "Phòng nổi bật", href: "/", note: "Khám phá ngay tại trang chủ" },
    ],
  },
  {
    key: "customer",
    title: "Khách đặt phòng",
    desc: "Quản lý hồ sơ, đơn đặt phòng và lịch sử chuyến đi.",
    href: "/tai-khoan",
    items: [
      { label: "Tổng quan", href: "/tai-khoan", note: "Thông tin tài khoản" },
      { label: "Chuyến đi", href: "/chuyen-di", note: "Lịch sử lưu trú" },
    ],
  },
  {
    key: "admin",
    title: "Quản trị viên",
    desc: "",
    href: "/quan-tri",
    items: [
      { label: "Tổng quan", href: "/quan-tri", note: "" },
      {
        label: "Báo cáo",
        href: "/quan-tri/bao-cao",
        note: "Doanh thu và Số liệu",
      },
      {
        label: "Người dùng",
        href: "/quan-tri/nguoi-dung",
        note: "Quản lý tài khoản",
      },
      {
        label: "Danh sách phòng",
        href: "/quan-tri/phong",
        note: "Quản lý danh sách phòng",
      },
      {
        label: "Địa điểm",
        href: "/quan-tri/dia-diem",
        note: "Quản lý địa điểm",
      },
      {
        label: "Booking",
        href: "/quan-tri/booking",
        note: "Quản lý đặt phòng",
      },
      {
        label: "Đánh giá",
        href: "/quan-tri/danh-gia",
        note: "Quản lý đánh giá",
      },
    ],
  },
];

export function getRole(key: RoleKey) {
  return roleList.find((item) => item.key === key);
}
