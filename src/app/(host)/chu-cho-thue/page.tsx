const hostStats = [
  { label: "Phòng đang mở bán", value: "12" },
  { label: "Đơn chờ xác nhận", value: "4" },
  { label: "Tỷ lệ lấp đầy tuần", value: "78%" },
];

export default function HostPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Chủ cho thuê
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Bảng điều khiển</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Đây là nơi nên tổng hợp các chỉ số quan trọng nhất để chủ nhà nắm tình hình
          kinh doanh ngay khi đăng nhập.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {hostStats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>
    </>
  );
}
