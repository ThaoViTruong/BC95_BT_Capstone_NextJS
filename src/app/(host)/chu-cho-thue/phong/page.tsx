const hostRoomList = [
  { name: "Căn hộ trung tâm Quận 1", status: "Đang hiển thị" },
  { name: "Villa hồ bơi Đà Lạt", status: "Tạm ẩn" },
];

export default function HostRoomPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Vận hành nội dung
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Quản lý phòng</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Bạn có thể tách tiếp module này thành `room-form`, `room-media`,
          `room-policy` và `room-pricing` để code gọn hơn.
        </p>
      </section>

      <section className="space-y-4">
        {hostRoomList.map((item) => (
          <article key={item.name} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-950">{item.name}</h3>
              <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-slate-700">
                {item.status}
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
