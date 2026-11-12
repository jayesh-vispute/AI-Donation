export default function StatCard({ icon: Icon, label, value, color = 'var(--primary)', bgColor = 'var(--primary-50)' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: bgColor, color }}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="stat-content" style={{ minWidth: 0 }}>
        <div className="stat-value" style={{ wordBreak: 'break-word' }}>{value}</div>
        <div className="stat-label" style={{ wordBreak: 'break-word' }}>{label}</div>
      </div>
    </div>
  );
}
