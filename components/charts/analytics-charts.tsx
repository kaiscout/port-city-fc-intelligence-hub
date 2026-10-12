"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { currency, number } from "@/lib/format";

const axis = { fontSize: 10, fill: "#637283" };
const tooltipStyle = {
  border: "1px solid #dbe5ec",
  borderRadius: 12,
  fontSize: 11,
  boxShadow: "0 12px 30px rgba(6,20,39,.08)",
};

export function CashFlowTrend({
  data,
}: {
  data: { month: string; inflow: number; outflow: number; net: number }[];
}) {
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Monthly synthetic cash inflow, cash outflow, and net cash activity from the public model."
    >
      <ResponsiveContainer width="100%" height={275}>
        <ComposedChart data={data} margin={{ top: 12, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#edf3f7" vertical={false} />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => currency(Number(value), true)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              currency(Number(value)),
              name === "inflow" ? "Cash inflow" : name === "outflow" ? "Cash outflow" : "Net cash",
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="inflow" name="Cash inflow" fill="#2485bc" radius={[5, 5, 0, 0]} />
          <Bar dataKey="outflow" name="Cash outflow" fill="#a5e2f4" radius={[5, 5, 0, 0]} />
          <Line
            type="monotone"
            dataKey="net"
            name="Net cash"
            stroke="#0a1f38"
            strokeWidth={2.2}
            dot={{ r: 2.5, fill: "#fff", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PerformanceTrend({
  data,
}: {
  data: { month: string; attendance: number; revenue: number }[];
}) {
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Monthly attendance and revenue trend. May through July both trend upward overall."
    >
      <ResponsiveContainer width="100%" height={275}>
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66c9ec" stopOpacity={0.36} />
              <stop offset="100%" stopColor="#66c9ec" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf3f7" vertical={false} />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="left"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => number(v, true)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => currency(v, true)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              name === "revenue" ? currency(Number(value)) : number(Number(value)),
              name === "revenue" ? "Revenue" : "Attendance",
            ]}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="attendance"
            stroke="#2485bc"
            strokeWidth={2.4}
            fill="url(#attendanceFill)"
            animationDuration={700}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#0a1f38"
            strokeWidth={2.2}
            dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgramBars({ data }: { data: { metric: string; Men: number; Women: number }[] }) {
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Men's and women's program performance comparison. The women's synthetic dataset leads attendance, margin, and engagement."
    >
      <ResponsiveContainer width="100%" height={275}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 8, left: 2, bottom: 0 }}>
          <CartesianGrid stroke="#edf3f7" horizontal={false} />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="metric"
            width={88}
            tick={axis}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Men" fill="#113253" radius={[0, 5, 5, 0]} animationDuration={650} />
          <Bar dataKey="Women" fill="#66c9ec" radius={[0, 5, 5, 0]} animationDuration={750} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueMix({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["#113253", "#2485bc", "#66c9ec", "#a5e2f4"];
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Synthetic cash inflow mix by normalized public-model category."
    >
      <ResponsiveContainer width="100%" height={275}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={68}
            outerRadius={95}
            paddingAngle={3}
            stroke="none"
            animationDuration={700}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => currency(Number(value))} />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CommunityTrend({
  data,
}: {
  data: { month: string; participants: number; reach: number }[];
}) {
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Synthetic monthly community participation and program reach trend."
    >
      <ResponsiveContainer width="100%" height={275}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#edf3f7" vertical={false} />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            tick={axis}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => number(v, true)}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="participants"
            name="Participants"
            stroke="#176a9c"
            strokeWidth={2.3}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="reach"
            name="Estimated reach"
            stroke="#66c9ec"
            strokeWidth={2.3}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChannelBars({ data }: { data: { channel: string; conversion: number }[] }) {
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Ticket purchase conversion rate by marketing channel."
    >
      <ResponsiveContainer width="100%" height={275}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 18 }}>
          <CartesianGrid stroke="#edf3f7" vertical={false} />
          <XAxis
            dataKey="channel"
            tick={axis}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-18}
            textAnchor="end"
          />
          <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${Number(v).toFixed(1)}%`, "Conversion"]}
          />
          <Bar dataKey="conversion" fill="#2485bc" radius={[6, 6, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
