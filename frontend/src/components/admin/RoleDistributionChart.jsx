import { motion as Motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import EmptyState from "../common/EmptyState.jsx";

const ROLE_COLORS = ["#2F80ED", "#56CCF2", "#27AE60", "#F2994A", "#EB5757"];

const getPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const RoleDistributionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  return (
    <div className="rounded-2xl border border-[#E0E7EF] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
      <p className="text-sm font-semibold text-[#1D2D50]">{item?.label}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#5C708A]">Accounts</p>
      <p className="mt-2 text-2xl font-black text-[#0B1F3A]">{item?.value ?? 0}</p>
    </div>
  );
};

const RoleDistributionChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-dashed border-[#E0E7EF] bg-[#F9FBFF]">
        <EmptyState
          title="No role data yet"
          description="Role distribution will appear here when user accounts are available."
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
      className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
    >
      <div className="h-[220px] w-full sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={4}
              stroke="#FFFFFF"
              strokeWidth={4}
              animationDuration={850}
            >
              {data.map((item, index) => (
                <Cell key={item.key} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<RoleDistributionTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={item.key}
            className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: ROLE_COLORS[index % ROLE_COLORS.length] }}
                />
                <span className="text-sm font-semibold text-[#1D2D50]">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-[#1D2D50]">{item.value}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#5C708A]">
              <span>{getPercent(item.value, total)}% of tracked accounts</span>
              <span>{total} total</span>
            </div>
          </div>
        ))}
      </div>
    </Motion.div>
  );
};

export default RoleDistributionChart;
