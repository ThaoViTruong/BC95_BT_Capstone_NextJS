# BC95 Booking

Repo FE cho website đặt phòng dùng `Next.js 16`, `React 19` và `Tailwind CSS 4`.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` để xem giao diện.

## Biến môi trường

Repo hiện hỗ trợ cả 2 cách đặt tên biến:

```bash
API_URL=https://airbnbnew.cybersoft.edu.vn
TOKEN=your_token_here
```

hoặc:

```bash
NEXT_PUBLIC_API_URL=https://airbnbnew.cybersoft.edu.vn
NEXT_PUBLIC_CYBERSOFT_TOKEN=your_token_here
```

`tokenCybersoft` là bắt buộc vì Swagger của API yêu cầu header này cho toàn bộ nhóm endpoint. [$TRAE_REF](https://airbnbnew.cybersoft.edu.vn/swagger/index.html)[$TRAE_REF](https://airbnbnew.cybersoft.edu.vn/swagger/v1/swagger.json)

## Thư viện đã setup

- `clsx` + `tailwind-merge`: gộp className sạch và dễ tái sử dụng
- `lucide-react`: icon gọn, đồng nhất
- `react-hook-form`: quản lý form
- `zod` + `@hookform/resolvers`: validate form rõ ràng
- `sonner`: toast thông báo

## Cấu trúc chính

```text
src/
  app/
    (public)/        -> khu khách ghé qua
    (customer)/      -> khu khách đặt phòng
    (host)/          -> khu chủ cho thuê
    (admin)/         -> khu quản trị viên
  components/
    layout/          -> layout dùng chung
    shared/          -> component dùng lại nhiều nơi
  config/            -> config điều hướng, site
  lib/               -> hàm tiện ích
  services/          -> lớp gọi API theo từng nhóm endpoint
  types/             -> kiểu dữ liệu API và domain
```

## Quy ước triển khai

- `app` chỉ giữ routing, layout và page
- component dùng chung đặt trong `src/components`
- config điều hướng theo role đặt trong `src/config/navigation.ts`
- cấu hình môi trường API đặt trong `src/config/env.ts`
- dùng `src/lib/api-client.ts` làm lớp gọi API chung
- tách service theo domain ở `src/services`
- nếu một component chỉ dùng trong một route, ưu tiên đặt vào private folder như `src/app/(public)/_components`
- route mới nên bám theo đúng nhóm vai trò để tránh lẫn business logic

## Các route mẫu đã có

- `/`: trang giới thiệu
- `/phong`: danh sách phòng đã nối API thật
- `/phong/[slug]`: chi tiết phòng đã nối API thật theo `id` phòng
- `/tai-khoan`, `/dat-phong`, `/chuyen-di`
- `/chu-cho-thue`, `/chu-cho-thue/phong`, `/chu-cho-thue/dat-cho`
- `/quan-tri`, `/quan-tri/nguoi-dung`, `/quan-tri/bao-cao`

## Các service đã có

- `authService`
- `usersService`
- `roomsService`
- `locationsService`
- `bookingsService`
- `commentsService`
