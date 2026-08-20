# Cấu trúc thư mục đề xuất

## Mục tiêu

- Tách rõ routing và phần code dùng chung
- Dễ chia việc theo vai trò người dùng
- Dễ mở rộng từ giao diện sang form, validate và gọi API

## Ý nghĩa từng nhóm

- `(public)`: khu khách ghé qua, chỉ xem thông tin và danh sách phòng
- `(customer)`: khu khách đã đăng nhập, tập trung vào đặt phòng và lịch sử
- `(host)`: khu chủ cho thuê, tập trung quản lý tài sản và lịch đặt
- `(admin)`: khu quản trị, tập trung kiểm soát hệ thống và báo cáo

## Quy ước code

- Dùng `layout.tsx` ở từng route group để bọc UI chung của từng role
- Dùng private folder `_components` cho component chỉ thuộc một route
- Dùng `src/components/shared` cho các component tái sử dụng nhiều nơi
- Dùng `src/config/navigation.ts` làm nguồn dữ liệu điều hướng
- Dùng `src/config/env.ts` để đọc biến môi trường API
- Dùng `src/lib/utils.ts` cho helper như `cn`
- Dùng `src/lib/api-client.ts` làm lớp gọi API chung
- Dùng `src/services` để tách service theo endpoint domain
- Dùng `src/types` cho kiểu dữ liệu API

## Khi mở rộng tiếp

- `src/features/<ten-module>`: logic theo tính năng nếu module bắt đầu lớn
- `src/services`: lớp gọi API
- `src/types`: kiểu dữ liệu domain
- `src/constants`: hằng số dùng chung
- `src/validators`: schema `zod`
