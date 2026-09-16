import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';

export default function DataTable({
  columns, data, onRowClick, emptyMessage = 'No records found', getRowId = (row) => row.id,
}) {
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    const col = columns.find((c) => c.key === sort.key);
    const accessor = col?.sortValue || ((row) => row[sort.key]);
    const copy = [...data];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sort.dir === 'asc' ? result : -result;
    });
    return copy;
  }, [data, sort, columns]);

  function toggleSort(col) {
    if (!col.sortable) return;
    setSort((prev) => {
      if (prev.key !== col.key) return { key: col.key, dir: 'desc' };
      return { key: col.key, dir: prev.dir === 'desc' ? 'asc' : 'desc' };
    });
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <Inbox size={28} />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => toggleSort(col)} style={{ cursor: col.sortable ? 'pointer' : 'default' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {col.label}
                  {sort.key === col.key && (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={getRowId(row)}
              className={onRowClick ? 'clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
