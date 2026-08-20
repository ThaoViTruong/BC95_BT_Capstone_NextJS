const userGroups = [
  { name: "Khách đặt phòng", count: "6.500" },
  { name: "Chủ cho thuê", count: "1.120" },
  { name: "Nhân sự nội bộ", count: "48" },
];

export default function AdminUserPage() {
  return (
    <>
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Quản lý tài khoản
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Người dùng</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Nên tách module này thành danh sách người dùng, bộ lọc vai trò, phân quyền
          và lịch sử hoạt động để dễ kiểm soát.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {userGroups.map((item) => (
          <article key={item.name} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.name}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{item.count}</p>
          </article>
        ))}
      </section>
    </>
  );
}
