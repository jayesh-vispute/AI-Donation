import { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, Server, Activity, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function AdminProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: user?.displayName || 'Admin', email: user?.email || '' });
  const [saved, setSaved] = useState(false);
  const [apiEndpoints, setApiEndpoints] = useState([]);
  const [loadingApis, setLoadingApis] = useState(true);

  const handleChange = (e) => { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); setSaved(false); };
  const handleSubmit = (e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  useEffect(() => {
    fetch('http://localhost:8000/openapi.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.paths) {
          const endpoints = [];
          Object.keys(data.paths).forEach(path => {
            Object.keys(data.paths[path]).forEach(method => {
              endpoints.push({
                path: path,
                method: method.toUpperCase(),
                summary: data.paths[path][method].summary || 'No summary'
              });
            });
          });
          setApiEndpoints(endpoints);
        }
      })
      .catch(err => console.error("Error fetching API schema:", err))
      .finally(() => setLoadingApis(false));
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <Breadcrumbs items={[
        { label: t('common.home', 'Home'), to: '/' },
        { label: t('common.admin', 'Admin'), to: '/admin' },
        { label: t('navigation.profile', 'Profile') }
      ]} />
      <div className="page-header"><h1>{t('admin.profileTitle', 'Admin Profile')}</h1><p>{t('admin.profileDesc', 'Your administrator account settings & System Status.')}</p></div>
      {saved && <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>{t('success.profileSaved', 'Profile saved!')}</div>}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <form onSubmit={handleSubmit} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div className="sidebar-avatar" style={{ width: 56, height: 56, fontSize: '1.2rem', background: 'linear-gradient(135deg, #7C3AED, var(--primary))' }}>{formData.name?.[0]?.toUpperCase() || 'A'}</div>
            <div><h3 style={{ margin: 0 }}>{formData.name}</h3><span className="badge badge-error"><Shield size={10} /> Admin</span></div>
          </div>
          <div className="form-group"><label className="form-label" htmlFor="admin-name"><User size={14} style={{ display: 'inline', marginRight: 4 }} /> Name</label><input id="admin-name" name="name" className="form-input" value={formData.name} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label" htmlFor="admin-email"><Mail size={14} style={{ display: 'inline', marginRight: 4 }} /> Email</label><input id="admin-email" name="email" type="email" className="form-input" value={formData.email} onChange={handleChange} disabled /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <button type="button" className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={useAuth().logout}>
              Log Out
            </button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Profile</button>
          </div>
        </form>

        <div className="card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <Server size={20} className="text-primary" /> Active System APIs
          </h3>
          {loadingApis ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)' }}><Activity size={16} className="animate-spin" /> Loading APIs...</div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {apiEndpoints.map((endpoint, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-light)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${endpoint.method === 'GET' ? 'badge-info' : endpoint.method === 'POST' ? 'badge-success' : endpoint.method === 'DELETE' ? 'badge-error' : 'badge-warning'}`} style={{ minWidth: '60px', justifyContent: 'center' }}>
                        {endpoint.method}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text)' }}>{endpoint.path}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} /> <span className="hidden-mobile" style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>Completed</span>
                    </div>
                  </div>
                ))}
                {apiEndpoints.length === 0 && <div style={{ color: 'var(--text-light)' }}>No APIs found or backend is offline.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
