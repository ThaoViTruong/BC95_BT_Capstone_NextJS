const reportList = [
  "Doanh thu theo ngày, tuần, tháng",
  "Tỷ lệ hoàn tất đơn đặt phòng",
  "Hiệu suất từng khu vực và chủ cho thuê",
];

export default function AdminReportPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Báo cáo
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Phân tích vận hành</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Module này là nơi nối chart, bảng tổng hợp và bộ lọc thời gian cho cấp quản trị.
        </p>
      </section>

      <section className="space-y-4">
        {reportList.map((item) => (
          <article key={item} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">{item}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Placeholder cho chart hoặc bảng dữ liệu thật.
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
