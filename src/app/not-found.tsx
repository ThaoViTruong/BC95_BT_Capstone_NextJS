import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Không tìm thấy trang
      </p>
      <h1 className="text-4xl font-bold text-slate-950">Đường dẫn không hợp lệ</h1>
      <p className="text-base leading-7 text-slate-600">
        Hãy quay lại trang chủ hoặc mở đúng khu vực theo vai trò của người dùng.
      </p>
      <Link
        href="/"
        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
