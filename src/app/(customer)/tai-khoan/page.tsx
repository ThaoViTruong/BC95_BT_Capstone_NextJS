const infoList = [
  { label: "Thông tin cá nhân", value: "Hồ sơ, số điện thoại, email" },
  { label: "Ưu đãi hiện có", value: "Mã giảm giá, điểm thưởng" },
  { label: "Phương thức thanh toán", value: "Thẻ, ví điện tử, hóa đơn" },
];

export default function CustomerPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Khách đặt phòng
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Tổng quan tài khoản</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Khu vực này nên chứa hồ sơ khách, trạng thái xác minh và các widget hỗ trợ
          ra quyết định đặt phòng nhanh.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {infoList.map((item) => (
          <article key={item.label} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-lg font-bold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>
    </>
  );
}
