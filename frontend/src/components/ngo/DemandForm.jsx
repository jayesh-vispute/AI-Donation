import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translatePriority } from '../../utils/ngoI18n';

export default function DemandForm({ initialData, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    itemType: '',
    quantityRequired: '',
    priority: 'medium',
    expiryDate: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        itemType: initialData.itemType || '',
        quantityRequired: initialData.quantityRequired || '',
        priority: initialData.priority || 'medium',
        expiryDate: initialData.expiryDate || '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantityRequired: parseInt(formData.quantityRequired, 10) || 0,
    });
  };

  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="itemType">{t('ngo.demands.itemType')}</label>
        <input
          id="itemType"
          name="itemType"
          className="form-input"
          value={formData.itemType}
          onChange={handleChange}
          placeholder={t('ngo.demands.itemTypePlaceholder')}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="quantityRequired">{t('ngo.demands.quantityRequired')}</label>
          <input
            id="quantityRequired"
            name="quantityRequired"
            type="number"
            min="1"
            className="form-input"
            value={formData.quantityRequired}
            onChange={handleChange}
            placeholder={t('ngo.demands.quantityRequiredPlaceholder')}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="priority">{t('ngo.demands.priority')}</label>
          <select
            id="priority"
            name="priority"
            className="form-select"
            value={formData.priority}
            onChange={handleChange}
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>{translatePriority(p, t)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="expiryDate">{t('ngo.demands.expiryDate')}</label>
        <input
          id="expiryDate"
          name="expiryDate"
          type="date"
          className="form-input"
          value={formData.expiryDate}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="description">{t('ngo.demands.description')}</label>
        <textarea
          id="description"
          name="description"
          className="form-textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('ngo.demands.descriptionPlaceholder')}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initialData ? t('ngo.demands.updateDemand') : t('ngo.demands.saveDemand')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
