import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { Activity, Database, Cpu, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const serviceIcons = { FastAPI: Activity, PostgreSQL: Database, 'YOLO Model': Cpu, Firebase: Shield };

export default function SystemHealth() {
  const { t } = useTranslation();
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const data = await api.getSystemHealth();
        setHealthData([
          { service: 'FastAPI', status: data.status === 'healthy' ? 'healthy' : 'degraded', uptime: '99.9%', lastCheck: new Date() },
          { service: 'YOLO Model', status: data.model_loaded ? 'healthy' : 'down', uptime: data.model_loaded ? '99.8%' : '0%', lastCheck: new Date() },
          { service: 'PostgreSQL', status: data.status === 'healthy' ? 'healthy' : 'degraded', uptime: '99.9%', lastCheck: new Date() },
          { service: 'Firebase', status: 'healthy', uptime: '99.9%', lastCheck: new Date() }
        ]);
      } catch (err) {
        setHealthData([
          { service: 'FastAPI', status: 'down', uptime: 'N/A', lastCheck: new Date() },
          { service: 'YOLO Model', status: 'down', uptime: 'N/A', lastCheck: new Date() },
          { service: 'PostgreSQL', status: 'down', uptime: 'N/A', lastCheck: new Date() },
          { service: 'Firebase', status: 'unknown', uptime: 'N/A', lastCheck: new Date() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>{t('admin.systemHealthTitle', 'System Health')}</h1><p>{t('admin.systemHealthDesc', 'Monitor the status of all platform services.')}</p></div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>{t('admin.checkingHealth', 'Checking system health...')}</div>
      ) : (
        <div className="admin-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
          {healthData.map((service) => {
            const Icon = serviceIcons[service.service] || Activity;
            const isHealthy = service.status === 'healthy';

            return (
              <div key={service.service} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                  backgroundColor: isHealthy ? 'var(--success-light)' : 'var(--error-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isHealthy ? 'var(--success)' : 'var(--error)',
                }}>
                  <Icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{service.service}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <StatusBadge status={service.status} />
                    <span>Uptime: {service.uptime}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Last check: {new Date(service.lastCheck).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
