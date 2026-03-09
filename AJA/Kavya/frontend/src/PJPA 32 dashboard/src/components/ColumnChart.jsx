import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6FAE2C', '#0B4F94', '#7DC030', '#1565C0', '#8FC44A', '#2196F3', '#4A7A1E'];

// Use Unicode escape for Rupee sign to avoid encoding issues
const RS = '\u20B9';

const ColumnChart = ({ data, isAggregated }) => {
  const aggregateByWeekday = () => {
    if (!data || data.length === 0) return [];
    if (isAggregated) {
      return data.map(item => ({ weekday: item.weekday.substring(0, 3), amount: item.amount }));
    }
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const aggregated = weekdays.map(day => ({ weekday: day, amount: 0 }));
    data.forEach(item => {
      const i = weekdays.indexOf(item.weekday);
      if (i !== -1) aggregated[i].amount += Number(item.approvedAmount || 0);
    });
    return aggregated.map(d => ({ weekday: d.weekday.substring(0, 3), amount: d.amount }));
  };

  const chartData = aggregateByWeekday();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">{RS}{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card chart-animate">
      <div className="chart-title-row">
        <div className="chart-title-accent" />
        <h3 className="chart-title">Approved Amount by Weekend</h3>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F2FAE5" vertical={false} />
            <XAxis dataKey="weekday" stroke="#9E9E9E" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              stroke="#9E9E9E"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${RS}${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(111,174,44,0.05)' }} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200} animationEasing="ease-out">
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ColumnChart;
