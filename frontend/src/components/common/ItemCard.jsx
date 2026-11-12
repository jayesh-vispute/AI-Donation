export default function ItemCard({ item }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-alt)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.875rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
        <h4 style={{ textTransform: 'capitalize', margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
          {item.name || item.item_name}
        </h4>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Confidence: {Math.round(item.confidence * 100)}%
        </div>
      </div>
      <div
        style={{
          backgroundColor: 'var(--primary-50)',
          color: 'var(--primary)',
          fontWeight: 700,
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.95rem',
        }}
      >
        ×{item.quantity}
      </div>
    </div>
  );
}
