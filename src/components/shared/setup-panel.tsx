type SetupPanelProps = {
  title: string;
  desc: string;
  lines?: string[];
};

export function SetupPanel({ title, desc, lines = [] }: SetupPanelProps) {
  return (
    <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
        Cần hoàn tất setup
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-700">{desc}</p>

      {lines.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          {lines.map((item) => (
            <li key={item} className="rounded-2xl bg-white px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
