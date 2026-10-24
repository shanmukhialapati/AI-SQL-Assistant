import type { TableSummary } from "../types";

interface Props {
  tables: TableSummary[];
  onPick: (table: string) => void;
  onDelete: (table: string) => void;
}

export default function TablesSidebar({ tables, onPick, onDelete }: Props) {
  return (
    <section className="sidebar">
      <h2>Tables <span className="badge">{tables.length}</span></h2>
      {tables.length === 0 && <p className="muted">No tables yet. Upload a file to create one.</p>}
      <ul>
        {tables.map((t) => (
          <li key={t.name}>
            <button className="link" onClick={() => onPick(t.name)} title={`Select * from ${t.name}`}>
              <span className="clip">{t.name}</span>
              <small>{t.rows.toLocaleString()} rows · {t.columns} columns</small>
            </button>
            <button
              className="icon"
              title={`Delete ${t.name}`}
              aria-label={`Delete ${t.name}`}
              onClick={() => confirm(`Delete table "${t.name}" permanently?`) && onDelete(t.name)}
            >×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
