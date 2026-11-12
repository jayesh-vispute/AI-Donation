import { useState, useEffect } from 'react';
import { PackagePlus, Plus, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Loading from '../../components/common/Loading';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export default function CategoryManagement() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getCategories().catch(() => [
          { id: 1, name: 'Clothes', description: 'Apparel for all ages', status: 'active' },
          { id: 2, name: 'Food', description: 'Non-perishable food items', status: 'active' },
          { id: 3, name: 'Books', description: 'Educational and reading materials', status: 'active' },
          { id: 4, name: 'Electronics', description: 'Working devices and appliances', status: 'active' }
        ]);
        setCategories(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const columns = [
    { key: 'name', header: 'Category Name', render: (val) => <span style={{ fontWeight: '600' }}>{val}</span> },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status', render: (val) => <span className={`badge ${val === 'active' ? 'badge-success' : 'badge-neutral'}`}>{val}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm"><Edit2 size={16} /></button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  if (loading) return <Loading message="Loading categories..." />;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>{t('admin.categoryTitle', 'Category Management')}</h1>
          <p>{t('admin.categoryDesc', 'Define and manage standard donation item categories.')}</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> {t('actions.addCategory', 'Add Category')}
        </button>
      </div>

      <div className="card">
        {categories.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <PackagePlus size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>{t('empty.noCategories', 'No categories defined')}</h3>
          </div>
        ) : (
          <DataTable columns={columns} data={categories} />
        )}
      </div>
    </div>
  );
}
