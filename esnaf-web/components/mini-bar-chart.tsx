type MiniBarDatum = {
  label: string;
  value: number;
  description?: string;
};

type MiniBarChartProps = {
  data: MiniBarDatum[];
  valueFormatter?: (value: number) => string;
  barClassName?: string;
  emptyLabel?: string;
};

export function MiniBarChart({
  data,
  valueFormatter,
  barClassName,
  emptyLabel = "Veri bulunamadı.",
}: MiniBarChartProps) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  if (data.length === 0) {
    return <div className="text-xs text-zinc-400">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="truncate">{item.label}</span>
            <span className="text-zinc-700">
              {valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className={`h-2 rounded-full ${barClassName ?? "bg-zinc-900"}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          {item.description && <div className="text-[11px] text-zinc-400">{item.description}</div>}
        </div>
      ))}
    </div>
  );
}
