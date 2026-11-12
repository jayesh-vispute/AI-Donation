import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { api } from '../../services/api';
import DonorButton from '../../components/donor/DonorButton';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function MatchDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const data = await api.getMatch(id);
        setMatch(data);
      } catch (err) {
        setError(t('donor.unableToLoadMatchDetails', 'Unable to load match details.'));
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  const handleConfirm = async () => {
    try {
      await api.selectMatch(match.id);
      setConfirmed(true);
    } catch (err) {
      alert(t('donor.failedToConfirmDonation', 'Failed to confirm donation. Please try again.'));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}>{t('common.loading', 'Loading...')}</div>;
  if (error || !match) return <div style={{ textAlign: 'center', padding: '24px' }}>{error || t('donor.matchNotFound', 'Match not found.')}</div>;

  if (confirmed) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--space-6) 0' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', backgroundColor: '#E6F7EF', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)',
          color: 'var(--secondary-600)'
        }}>
          <CheckCircle2 size={40} />
        </div>
        
        <h1 style={{ fontSize: '32px', marginBottom: 'var(--space-3)' }}>{t('donor.donationConfirmed', 'Donation Confirmed!')}</h1>
        <p style={{ color: 'var(--neutral-600)', fontSize: '16px', marginBottom: 'var(--space-5)', lineHeight: 1.5 }}>
          {t('donor.donationConfirmedDesc', { ngo: match.ngo_name, defaultValue: 'Thank you for your generosity. Your items have been successfully matched and a request has been sent to {{ngo}}.' })}
        </p>

        <div style={{ 
          backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-card)', 
          padding: 'var(--space-4)', border: '1px solid #EAE5DE', boxShadow: 'var(--shadow-warm)',
          textAlign: 'left', marginBottom: 'var(--space-5)'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid #EAE5DE' }}>
            {t('donor.donationSummary', 'Donation Summary')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600)' }}>{t('donor.recipient', 'Recipient:')}</span>
              <span style={{ fontWeight: 500 }}>{match.ngo_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600)' }}>{t('donor.items', 'Items:')}</span>
              <span style={{ fontWeight: 500 }}>{t('donor.donationRequestSent', 'Donation Request Sent')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600)' }}>{t('donor.status', 'Status:')}</span>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{t('donor.awaitingNgoAcceptance', 'Awaiting NGO Acceptance')}</span>
            </div>
          </div>
        </div>

        <DonorButton variant="primary" fullWidth onClick={() => navigate('/donations')}>
          {t('donor.viewMyDonations', 'View My Donations')}
        </DonorButton>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: 'var(--space-6)' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.donor', 'Donor'), to: '/donor' },
        { label: t('navigation.ngoMatches', 'NGO Matches'), to: '/matches' },
        { label: t('donor.reviewMatch', 'Match Details') }
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 'var(--space-3)' }}>
        <button 
          onClick={() => navigate('/matches')}
          style={{ background: 'var(--neutral-0)', border: '1px solid #EAE5DE', width: 40, height: 40, borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('donor.reviewMatch', 'Review Match')}</h1>
      </div>

      <div style={{ 
        backgroundColor: 'var(--neutral-0)', borderRadius: 'var(--radius-card)', 
        padding: 'var(--space-5)', border: '1px solid #EAE5DE', boxShadow: 'var(--shadow-warm)',
        marginBottom: 'var(--space-5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '22px', margin: 0 }}>{match.ngo_name}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--neutral-600)', fontSize: '14px' }}>
              <MapPin size={14} /> {match.distance || t('donor.local', 'Local')}
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#F8F5FF', color: 'var(--accent-purple)', 
            padding: '8px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #E6DFFF'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{match.score}%</div>
            <div style={{ fontSize: '11px', fontWeight: 600 }}>{t('donor.matchScoreLabel', 'MATCH SCORE')}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-3)', color: 'var(--neutral-900)' }}>{t('donor.whyThisMatch', 'Why this match?')}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--secondary-600)', marginTop: '2px' }}><CheckCircle2 size={18} /></div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-900)' }}>{t('donor.highCompatibility', 'High Compatibility')}</div>
              <div style={{ fontSize: '14px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                {t('donor.highCompatibilityDesc', 'Your items closely match the requested categories by this NGO.')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--primary-600)', marginTop: '2px' }}><Heart size={18} /></div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-900)' }}>{match.match_reason || t('donor.urgentDemand', 'Urgent Demand')}</div>
              <div style={{ fontSize: '14px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                {t('donor.urgentDemandDesc', 'They have marked these items as critical for their community drive.')}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <DonorButton variant="outline" onClick={() => navigate('/matches')} style={{ flex: 1 }}>
          {t('donor.viewOtherNgos', 'View Other NGOs')}
        </DonorButton>
        <DonorButton variant="primary" onClick={handleConfirm} style={{ flex: 2 }}>
          {t('donor.confirmDonation', 'Confirm Donation')} <ArrowRight size={18} />
        </DonorButton>
      </div>
    </div>
  );
}
