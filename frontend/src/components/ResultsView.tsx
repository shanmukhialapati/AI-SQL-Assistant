import { useState } from "react";
import { api } from "../api";
import type { QueryResult } from "../types";
import ChartPanel from "./ChartPanel";
import ResultsTable from "./ResultsTable";

interface Props { result: QueryResult; sql: string }

export default function ResultsView({ result, sql }: Props) {
  const [tab, setTab] = useState<"table" | "chart">("table");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  async function download(format: "csv" | "xlsx") {
    setExporting(true); setError("");
    try {
      const blob = await api.exportResults(sql, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `results.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
    finally { setExporting(false); }
  }

  return (
    <div className="results">
      <div className="row between">
        <div className="tabs inline">
          <button className={tab === "table" ? "on" : ""} onClick={() => setTab("table")}>Table</button>
          <button className={tab === "chart" ? "on" : ""} onClick={() => setTab("chart")}>Chart</button>
        </div>
        <div className="row">
          <button disabled={exporting} onClick={() => download("csv")}>Download CSV</button>
          <button disabled={exporting} onClick={() => download("xlsx")}>Download Excel</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {tab === "table" ? <ResultsTable result={result} /> : <ChartPanel result={result} />}
    </div>
  );
}
