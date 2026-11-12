export default function MatchScore({ score }) {
  const color = score >= 90 ? 'var(--success)' : score >= 70 ? 'var(--warning)' : 'var(--text-muted)';
  const bg = score >= 90 ? 'var(--success-light)' : score >= 70 ? 'var(--warning-light)' : '#F1F5F9';

  return (
    <div className="match-score-ring" style={{ backgroundColor: bg, color }}>
      {score}%
    </div>
  );
}
