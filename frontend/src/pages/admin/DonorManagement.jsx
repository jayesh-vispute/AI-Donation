import { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function DonorManagement() {
  const { t } = useTranslation();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        setLoading(true);
        const data = await api.getAdminDonors();
        setDonors(data.map(d => ({
          name: d.full_name,
          email: d.email,
          totalDonations: 'N/A', // Not provided by this endpoint currently
          joinedDate: 'N/A',
          status: d.is_active ? 'active' : 'inactive'
        })));
      } catch (err) {
        console.error("Failed to load donors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonors();
  }, []);

  const columns = [
    { key: 'name', label: 'Donor Name' },
    { key: 'email', label: 'Email' },
    { key: 'totalDonations', label: 'Donations' },
    { key: 'joinedDate', label: 'Joined' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>{t('admin.donorMgmtTitle', 'Donor Management')}</h1><p>{t('admin.donorMgmtDesc', 'View and manage registered donors.')}</p></div>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common.loading', 'Loading...')}</div>
      ) : (
        <DataTable columns={columns} data={donors} emptyMessage={t('empty.noDonors', 'No donors found.')} />
      )}
    </div>
  );
}
