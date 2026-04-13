import { motion as Motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import EmptyState from "../common/EmptyState.jsx";

const PIPELINE_COLORS = {
  approved: "#27AE60",
  pending: "#F2994A",
  changes_requested: "#56CCF2",
  rejected: "#EB5757"
};

const getPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const DoctorPipelineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#E0E7EF] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
      <p className="text-sm font-semibold text-[#1D2D50]">{label}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#5C708A]">Doctors</p>
      <p className="mt-1 text-2xl font-black text-[#0B1F3A]">{payload[0]?.value ?? 0}</p>
    </div>
  );
};

const DoctorPipelineChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-dashed border-[#E0E7EF] bg-[#F9FBFF]">
        <EmptyState
          title="No verification data yet"
          description="Doctor review activity will appear here when applications are available."
        />
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="h-[220px] w-full sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E0E7EF" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#5C708A"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              stroke="#5C708A"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<DoctorPipelineTooltip />} cursor={{ fill: "rgba(47,128,237,0.06)" }} />
            <Bar dataKey="value" radius={[14, 14, 6, 6]} animationDuration={850}>
              {data.map((item) => (
                <Cell key={item.key} fill={PIPELINE_COLORS[item.key] || "#38bdf8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIPELINE_COLORS[item.key] || "#38bdf8" }}
                />
                <span className="text-sm font-semibold text-[#1D2D50]">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-[#1D2D50]">{item.value}</span>
            </div>
            <p className="mt-2 text-xs text-[#5C708A]">{getPercent(item.value, total)}% of doctor accounts</p>
          </div>
        ))}
      </div>
    </Motion.div>
  );
};

export default DoctorPipelineChart;
