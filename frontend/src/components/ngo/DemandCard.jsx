import StatusBadge from '../common/StatusBadge';

export default function DemandCard({ demand, onEdit, onDelete }) {
  const progress = demand.quantityRequired > 0
    ? Math.round((demand.quantityFulfilled / demand.quantityRequired) * 100)
    : 0;

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ margin: 0 }}>{demand.itemType}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {demand.description}
          </p>
        </div>
        <StatusBadge status={demand.priority} />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        <span>Required: <strong className="text-primary">{demand.quantityRequired}</strong></span>
        <span>Fulfilled: <strong>{demand.quantityFulfilled}</strong></span>
        <span>Expires: {demand.expiryDate}</span>
      </div>

      <div style={{ height: 6, backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', marginBottom: '0.75rem' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: progress >= 100 ? 'var(--success)' : 'var(--primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 300ms ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StatusBadge status={demand.status} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(demand)}>Edit</button>
          )}
          {onDelete && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => onDelete(demand)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
