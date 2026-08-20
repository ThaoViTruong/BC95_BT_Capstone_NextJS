const stepList = [
  "Chọn phòng và thời gian lưu trú",
  "Điền thông tin khách ở",
  "Xác nhận giá, khuyến mãi và thanh toán",
];

export default function BookingPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Luồng nghiệp vụ
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Đặt phòng</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Nên tách phần này thành các component nhỏ như form tìm phòng, form thông
          tin khách và khối tóm tắt đơn hàng để dễ bảo trì.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stepList.map((item, index) => (
          <article key={item} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Bước {index + 1}</p>
            <h3 className="mt-3 text-lg font-bold text-slate-950">{item}</h3>
          </article>
        ))}
      </section>
    </>
  );
}
