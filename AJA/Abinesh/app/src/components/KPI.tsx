interface KPICardProps {
  value: number;
  label: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

export function KPICard({ value, label, isCurrency, isPercentage }: KPICardProps) {
  const formatValue = (val: number): string => {
    const formatNumber = (num: number): string => {
      if (Math.abs(num) >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(num) >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    if (isCurrency) {
      return `₹${formatNumber(val)}`;
    }
    if (isPercentage) {
      return `${val.toFixed(1)}%`;
    }
    return formatNumber(val);
  };

  return (
    <div className="kpi-card">
      <div className="kpi-value">{formatValue(value)}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

interface KPIGridProps {
  kpis: Record<string, { value: number; label: string; is_currency?: boolean; is_percentage?: boolean }>;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="kpi-grid">
      {Object.entries(kpis).map(([key, kpi]) => (
        <KPICard
          key={key}
          value={kpi.value}
          label={kpi.label}
          isCurrency={kpi.is_currency}
          isPercentage={kpi.is_percentage}
        />
      ))}
    </div>
  );
}
