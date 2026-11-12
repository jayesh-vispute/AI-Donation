import { useTranslation } from 'react-i18next';

export default function DataTable({ columns, data, emptyMessage }) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p className="text-secondary">{emptyMessage || t('empty.noDataFound', 'No data found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
