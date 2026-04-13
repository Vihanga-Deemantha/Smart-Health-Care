import { motion as Motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import EmptyState from "../common/EmptyState.jsx";

const ACTION_SERIES = [
  { key: "approvals", label: "Approvals", color: "#34d399" },
  { key: "changesRequested", label: "Changes", color: "#fbbf24" },
  { key: "suspensions", label: "Suspensions", color: "#fb7185" },
  { key: "reactivations", label: "Reactivations", color: "#38bdf8" }
];

const ActionTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className="mt-3 space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-bold text-white">{entry.value ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminActionTrendChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5">
        <EmptyState
          title="No admin activity yet"
          description="Approvals and account decisions will appear here as admins work through the queue."
        />
      </div>
    );
  }

  const summary = data.reduce(
    (accumulator, point) => {
      ACTION_SERIES.forEach((series) => {
        accumulator[series.key] += Number(point[series.key] || 0);
      });

      return accumulator;
    },
    {
      approvals: 0,
      changesRequested: 0,
      suspensions: 0,
      reactivations: 0
    }
  );

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTION_SERIES.map((series) => (
          <div
            key={series.key}
            className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {series.label}
              </p>
            </div>
            <p className="mt-2 text-2xl font-black text-white">{summary[series.key]}</p>
          </div>
        ))}
      </div>

      <div className="h-[220px] w-full sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<ActionTrendTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            {ACTION_SERIES.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                stackId="actions"
                fill={series.color}
                radius={[10, 10, 4, 4]}
                animationDuration={800}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Motion.div>
  );
};

export default AdminActionTrendChart;
