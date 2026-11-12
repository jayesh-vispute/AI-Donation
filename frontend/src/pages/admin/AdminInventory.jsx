import { useState, useEffect } from 'react';
import { ClipboardList, Building2, Download } from 'lucide-react';
import { api } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Loading from '../../components/common/Loading';
import { useTranslation } from 'react-i18next';

export default function AdminInventory() {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.getAdminInventory();
        setInventory(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const columns = [
    { key: 'ngoName', header: 'NGO', render: (val) => <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={16}/> {val}</div> },
    { key: 'category', header: 'Category' },
    { key: 'itemName', header: 'Item' },
    { key: 'available', header: 'Available Qty', render: (val) => <span style={{ fontWeight: 'bold' }}>{val}</span> },
    { key: 'used', header: 'Used Qty' },
    { key: 'lastUpdated', header: 'Last Updated' }
  ];

  if (loading) return <Loading message="Loading global inventory..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>{t('admin.inventoryTitle', 'Global Inventory')}</h1>
          <p>{t('admin.inventoryDesc', 'View aggregated inventory levels across all registered NGOs.')}</p>
        </div>
        <button className="btn btn-secondary">
          <Download size={18} /> {t('actions.export', 'Export')} {t('navigation.reports', 'Report')}
        </button>
      </div>

      <div className="card">
        {inventory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>{t('empty.noInventory', 'No inventory data available')}</h3>
          </div>
        ) : (
          <DataTable columns={columns} data={inventory} />
        )}
      </div>
    </div>
  );
}
