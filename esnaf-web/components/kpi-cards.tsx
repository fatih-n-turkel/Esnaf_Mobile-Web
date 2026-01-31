import { fmtTRY } from "@/lib/money";

export default function KpiCards(props: { revenue: number; profit: number; salesCount: number; loss: number }) {
  const Card = ({ title, value }: { title: string; value: string }) => (
    <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card title="Bugün Ciro" value={fmtTRY(props.revenue)} />
      <Card title="Bugün Net Kâr" value={fmtTRY(props.profit)} />
      <Card title="Bugün Satış" value={`${props.salesCount}`} />
      <Card title="Bugün Zarar" value={fmtTRY(props.loss)} />
    </div>
  );
}
