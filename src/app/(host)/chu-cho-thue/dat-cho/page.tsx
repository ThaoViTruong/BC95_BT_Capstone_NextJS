const bookingList = [
  { code: "#BK-1024", guest: "Nguyễn Minh", status: "Chờ xác nhận" },
  { code: "#BK-1025", guest: "Trần Linh", status: "Đã thanh toán" },
];

export default function HostBookingPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Lịch đặt
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Đơn đặt phòng</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Khu này dành cho danh sách đơn, bộ lọc trạng thái, lịch check-in/check-out
          và thao tác xác nhận hoặc từ chối.
        </p>
      </section>

      <section className="space-y-4">
        {bookingList.map((item) => (
          <article key={item.code} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{item.code}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{item.guest}</h3>
              </div>
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
