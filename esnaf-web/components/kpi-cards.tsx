import { fmtTRY } from "@/lib/money";

export default function KpiCards(props: { revenue: number; profit: number; salesCount: number; loss: number }) {
  const Card = ({ title, value }: { title: string; value: string }) => (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
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
