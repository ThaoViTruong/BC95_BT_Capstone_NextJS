const tripList = [
  { name: "Căn hộ trung tâm Quận 1", status: "Sắp nhận phòng" },
  { name: "Studio gần biển Đà Nẵng", status: "Đã hoàn tất" },
];

export default function TripPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Theo dõi
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Chuyến đi của tôi</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Nên gom phần lịch sử đặt phòng, trạng thái lưu trú và đánh giá vào cùng
          một module để khách dễ xem lại sau mỗi chuyến đi.
        </p>
      </section>

      <section className="space-y-4">
        {tripList.map((item) => (
          <article key={item.name} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-950">{item.name}</h3>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {item.status}
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
