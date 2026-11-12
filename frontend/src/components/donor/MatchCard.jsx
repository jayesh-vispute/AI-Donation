import { MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function MatchCard({ match, onClick }) {
  const score = Math.round((match.overall_score || 0) * 100);
  const scoreColor = score >= 90 ? 'var(--success)' : score >= 70 ? 'var(--warning)' : 'var(--text-muted)';
  const scoreBg = score >= 90 ? 'var(--success-light)' : score >= 70 ? 'var(--warning-light)' : '#F1F5F9';
  
  const ngo = match.demand?.ngo || {};
  const ngoName = ngo.organization_name || 'Unknown NGO';
  const isVerified = ngo.verification_status === 'VERIFIED' || ngo.verification_status === 'APPROVED';
  
  const locationText = ngo.city && ngo.state ? `${ngo.city}, ${ngo.state}` : 'Location unavailable';
  
  // Calculate an approximate distance based on proximity score (0 to 1) 
  // since real distance calculations require lat/long geometry.
  const distance = match.proximity_score ? ((1.0 - match.proximity_score) * 20 + 2).toFixed(1) : '?';
  
  const demandItemName = match.demand?.item_name || 'Unknown Item';
  const demandQty = match.demand?.quantity_required || 0;
  
  const donationItemName = match.donation_item?.item_name || 'Unknown Item';
  const donationQty = match.matched_quantity || match.donation_item?.quantity || 0;
  
  const priority = match.demand?.priority || 'medium';

  return (
    <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div className="match-score-ring" style={{ backgroundColor: scoreBg, color: scoreColor }}>
          {score}%
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{ngoName}</h3>
            {isVerified && <ShieldCheck size={16} color="var(--primary)" />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <MapPin size={14} />
            {locationText} • {distance} km
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span className="text-muted">Needs:</span>{' '}
              {demandItemName} × {demandQty}
            </div>
            <div>
              <span className="text-muted">Your Donation:</span>{' '}
              {donationItemName} × {donationQty}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <StatusBadge status={priority} />
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
              View Match <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
