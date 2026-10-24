import type { QueryResult } from "../types";

export default function ResultsTable({ result }: { result: QueryResult }) {
  return (
    <div>
      <p className="muted">
        {result.row_count.toLocaleString()} rows · {result.elapsed_ms} ms
        {result.truncated && " · showing the first rows only"}
      </p>
      <div className="scroll">
        <table>
          <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {result.rows.map((r, i) => (
              <tr key={i}>{r.map((v, j) => <td key={j}>{v === null ? <em>null</em> : String(v)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
