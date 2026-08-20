const adminStats = [
  { label: "Tổng người dùng", value: "8.420" },
  { label: "Tin phòng chờ duyệt", value: "31" },
  { label: "Yêu cầu hỗ trợ mở", value: "12" },
];

export default function AdminPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Quản trị viên
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Tổng quan hệ thống</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Phần này nên tập trung số liệu quan trọng, cảnh báo bất thường và lối tắt
          tới các module kiểm duyệt, hỗ trợ và báo cáo.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {adminStats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>
    </>
  );
}
