import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { useState, useEffect } from 'react';
import MatchScore from '../../components/donor/MatchScore';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function MatchMonitoring() {
  const { t } = useTranslation();
  const columns = [
    { key: 'id', label: t('admin.matchId', 'Match ID'), render: (val) => <span style={{ fontWeight: 600 }}>{val}</span> },
    { key: 'matchScore', label: t('admin.score', 'Score'), render: (val) => <MatchScore score={val} /> },
    { key: 'ngo', label: t('navigation.ngos', 'NGO'), render: (val) => val || t('common.unknownNgo', 'Unknown NGO') },
    { key: 'donationItems', label: t('navigation.donations', 'Donation'), render: (val) => val || t('admin.variousItems', 'Various Items') },
    { key: 'status', label: t('admin.status', 'Status'), render: (val) => <StatusBadge status={val} /> },
    { key: 'createdAt', label: t('admin.date', 'Date'), render: (val) => new Date(val).toLocaleDateString() },
  ];

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const data = await api.getMatches();
        setMatches(data.map(m => ({
          id: m.id,
          matchScore: m.overall_score * 100,
          ngo: `NGO ID: ${m.ngo_id}`, // In real app, we might join the NGO details
          donationItems: `Demand ID: ${m.demand_id}`, // In real app, join demand details
          status: m.status,
          createdAt: m.created_at || new Date().toISOString()
        })));
      } catch (err) {
        console.error("Failed to load matches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>{t('admin.matchMonitorTitle', 'Match Monitoring')}</h1><p>{t('admin.matchMonitorDesc', 'Monitor donation-NGO matches across the platform.')}</p></div>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common.loading', 'Loading...')}</div>
      ) : (
        <DataTable columns={columns} data={matches} emptyMessage={t('empty.noMatches', 'No matches found.')} />
      )}
    </div>
  );
}
