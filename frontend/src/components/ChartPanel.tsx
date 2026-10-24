import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { QueryResult } from "../types";

const COLORS = ["#3b8cf0", "#f59a3c", "#2bb3a3", "#8b7ff0", "#1c2d4a", "#e8690b", "#7fb8f7", "#c9a227"];
const MAX_POINTS = 50;

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);

export default function ChartPanel({ result }: { result: QueryResult }) {
  const [kind, setKind] = useState<"bar" | "line" | "pie">("bar");

  const shape = useMemo(() => {
    const numeric = result.columns
      .map((_, i) => i)
      .filter((i) => {
        const vals = result.rows.map((r) => r[i]).filter((v) => v !== null);
        return vals.length > 0 && vals.every(isNum);
      });
    const labelIdx = result.columns.findIndex((_, i) => !numeric.includes(i));
    const labelCol = labelIdx >= 0 ? labelIdx : 0;
    const series = numeric.filter((i) => i !== labelCol).slice(0, 4);
    const data = result.rows.slice(0, MAX_POINTS).map((r) => {
      const point: Record<string, string | number | null> = { label: String(r[labelCol] ?? "") };
      series.forEach((i) => { point[result.columns[i]] = r[i] as number | null; });
      return point;
    });
    return { series: series.map((i) => result.columns[i]), data, numeric };
  }, [result]);

  if (shape.series.length === 0 && shape.numeric.length === 0) {
    return <p className="muted">This result has no numeric column to chart. Try a query with COUNT, SUM or AVG.</p>;
  }

  // One row of numbers: show as KPI cards instead of a chart.
  if (result.rows.length === 1) {
    return (
      <div className="kpis">
        {shape.numeric.map((i) => (
          <div className="kpi" key={i}>
            <small>{result.columns[i]}</small>
            <strong>{Number(result.rows[0][i]).toLocaleString()}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (shape.series.length === 0) return <p className="muted">Add a text column and a number column to see a chart.</p>;

  const first = shape.series[0];
  return (
    <div>
      <div className="tabs inline">
        {(["bar", "line", "pie"] as const).map((k) => (
          <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {k === "bar" ? "Bar" : k === "line" ? "Line" : "Pie"}
          </button>
        ))}
      </div>
      {result.rows.length > MAX_POINTS && <p className="muted">Showing the first {MAX_POINTS} rows.</p>}
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          {kind === "pie" ? (
            <PieChart>
              <Pie data={shape.data} dataKey={first} nameKey="label" outerRadius={120} label>
                {shape.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : kind === "line" ? (
            <LineChart data={shape.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5e2f3" />
              <XAxis dataKey="label" /><YAxis /><Tooltip /><Legend />
              {shape.series.map((s, i) => <Line key={s} dataKey={s} stroke={COLORS[i]} strokeWidth={2} dot={false} />)}
            </LineChart>
          ) : (
            <BarChart data={shape.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5e2f3" />
              <XAxis dataKey="label" /><YAxis /><Tooltip /><Legend />
              {shape.series.map((s, i) => <Bar key={s} dataKey={s} fill={COLORS[i]} />)}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
