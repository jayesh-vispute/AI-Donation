import { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import Loading from '../../components/common/Loading';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useTranslation } from 'react-i18next';

export default function NgoList() {
  const { t } = useTranslation();
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const res = await api.getNgos();
        setNgos(res || []);
      } catch (err) {
        console.error('Failed to fetch NGOs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNgos();
  }, []);

  const filteredNgos = ngos.filter(ngo => 
    ngo.name?.toLowerCase().includes(search.toLowerCase()) ||
    ngo.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading message={t('donor.loadingNgos', 'Loading NGOs...')} />;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.donor', 'Donor'), to: '/donor' },
        { label: t('navigation.ngos', 'Verified NGOs') }
      ]} />
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>{t('navigation.ngos', 'Verified NGOs')}</h1>
          <p>{t('donor.ngoListDesc', 'Discover organizations making a difference in your community.')}</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder={t('donor.searchNgosPlaceholder', 'Search by name or location...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredNgos.length === 0 ? (
        <EmptyState icon={Building2} title={t('donor.noNgosFound', 'No NGOs Found')} message={t('donor.noNgosFoundDesc', 'Try adjusting your search criteria.')} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {filteredNgos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(ngo => (
              <div key={ngo.id || Math.random()} className="card card-hover">
                <div className="card-header" style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={20} color="var(--primary)" />
                    {ngo.name || t('donor.unknownNgo', 'Unknown NGO')}
                  </h3>
                  {ngo.verified && <span className="badge badge-success">{t('donor.verified', 'Verified')}</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', minHeight: '3rem' }}>
                  {ngo.description || t('donor.noDescription', 'No description provided.')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <MapPin size={16} />
                  {ngo.location || t('donor.locationNotSpecified', 'Location not specified')}
                </div>
                <button className="btn btn-secondary w-full">
                  {t('donor.viewDetails', 'View Details')} <ExternalLink size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {filteredNgos.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#FFFDF9',
              border: '1px solid #EAE5DE',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#654B35',
              marginTop: '16px'
            }}>
              <span>
                Showing {filteredNgos.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNgos.length)} of {filteredNgos.length} entries
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage <= 1 ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(filteredNgos.length / itemsPerPage));
                  const maxVisible = 3;
                  const startPage = Math.floor((currentPage - 1) / maxVisible) * maxVisible + 1;
                  const endPage = Math.min(startPage + maxVisible - 1, totalPages);
                  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                  return visiblePages.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: 32, height: 32, borderRadius: '8px',
                        border: page === currentPage ? 'none' : '1px solid #EAE5DE',
                        backgroundColor: page === currentPage ? '#C4622D' : '#FFFFFF',
                        color: page === currentPage ? '#FFFFFF' : '#654B35',
                        fontWeight: page === currentPage ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {page}
                    </button>
                  ));
                })()}
                <button
                  disabled={currentPage >= Math.max(1, Math.ceil(filteredNgos.length / itemsPerPage))}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredNgos.length / itemsPerPage), p + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: '8px',
                    border: '1px solid #EAE5DE', backgroundColor: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage >= Math.max(1, Math.ceil(filteredNgos.length / itemsPerPage)) ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= Math.max(1, Math.ceil(filteredNgos.length / itemsPerPage)) ? 0.4 : 1,
                    color: '#654B35'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

