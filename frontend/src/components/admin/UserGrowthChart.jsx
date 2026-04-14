import { motion as Motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import EmptyState from "../common/EmptyState.jsx";

const CHART_COLORS = {
  total: "#1D2D50",
  patients: "#2F80ED",
  doctors: "#56CCF2"
};

const UserGrowthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-[#E0E7EF] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5C708A]">{label}</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-[#5C708A]">Total users</span>
          <span className="font-bold text-[#1D2D50]">{point?.total ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-[#2F80ED]">Patients</span>
          <span className="font-bold text-[#1D2D50]">{point?.patients ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-[#56CCF2]">Doctors</span>
          <span className="font-bold text-[#1D2D50]">{point?.doctors ?? 0}</span>
        </div>
      </div>
    </div>
  );
};

const UserGrowthChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[24px] border border-dashed border-[#E0E7EF] bg-[#F9FBFF]">
        <EmptyState
          title="No growth data yet"
          description="User registrations will appear here once the dashboard collects enough trend points."
        />
      </div>
    );
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-[300px] w-full sm:h-[340px]"
    >
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="user-growth-total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#56CCF2" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#56CCF2" stopOpacity={0.03} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<UserGrowthTooltip />} cursor={{ stroke: "rgba(47,128,237,0.22)" }} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={CHART_COLORS.total}
              strokeWidth={2}
              fill="url(#user-growth-total)"
              animationDuration={700}
            />
            <Line
              type="monotone"
              dataKey="patients"
              stroke={CHART_COLORS.patients}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.patients }}
              animationDuration={850}
            />
            <Line
              type="monotone"
              dataKey="doctors"
              stroke={CHART_COLORS.doctors}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS.doctors }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Motion.div>
  );
};

export default UserGrowthChart;
