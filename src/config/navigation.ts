import type { Route } from "next";

export type NavItem = {
  label: string;
  href: Route;
  note: string;
};

export type RoleKey = "guest" | "customer" | "host" | "admin";

export type RoleInfo = {
  key: RoleKey;
  title: string;
  desc: string;
  href: Route;
  items: NavItem[];
};

export const mainNav: NavItem[] = [
  { label: "Trang chủ", href: "/", note: "Trang giới thiệu" },
  { label: "Phòng", href: "/phong", note: "Danh sách phòng" },
  { label: "Tài khoản", href: "/tai-khoan", note: "Khu khách đặt phòng" },
  { label: "Chủ cho thuê", href: "/chu-cho-thue", note: "Khu vận hành phòng" },
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
      { label: "Danh sách phòng", href: "/phong", note: "Khám phá phòng" },
    ],
  },
  {
    key: "customer",
    title: "Khách đặt phòng",
    desc: "Quản lý hồ sơ, đơn đặt phòng và lịch sử chuyến đi.",
    href: "/tai-khoan",
    items: [
      { label: "Tổng quan", href: "/tai-khoan", note: "Thông tin tài khoản" },
      { label: "Đặt phòng", href: "/dat-phong", note: "Tạo đơn đặt phòng" },
      { label: "Chuyến đi", href: "/chuyen-di", note: "Lịch sử lưu trú" },
    ],
  },
  {
    key: "host",
    title: "Chủ cho thuê",
    desc: "Quản lý danh sách phòng, lịch đặt và hiệu suất kinh doanh.",
    href: "/chu-cho-thue",
    items: [
      { label: "Tổng quan", href: "/chu-cho-thue", note: "Bảng điều khiển" },
      {
        label: "Quản lý phòng",
        href: "/chu-cho-thue/phong",
        note: "Thông tin tài sản",
      },
      {
        label: "Lịch đặt",
        href: "/chu-cho-thue/dat-cho",
        note: "Theo dõi trạng thái đơn",
      },
    ],
  },
  {
    key: "admin",
    title: "Quản trị viên",
    desc: "Giám sát người dùng, nội dung, vận hành và báo cáo toàn hệ thống.",
    href: "/quan-tri",
    items: [
      { label: "Tổng quan", href: "/quan-tri", note: "Chỉ số toàn hệ thống" },
      {
        label: "Người dùng",
        href: "/quan-tri/nguoi-dung",
        note: "Quản lý tài khoản",
      },
      {
        label: "Báo cáo",
        href: "/quan-tri/bao-cao",
        note: "Doanh thu và kiểm soát",
      },
    ],
  },
];

export function getRole(key: RoleKey) {
  return roleList.find((item) => item.key === key);
}
