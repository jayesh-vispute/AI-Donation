import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileText, X, CheckCircle, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function ImportInventoryModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setError(t('validation.uploadValidCsv'));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t('validation.fileSize10mb'));
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      setError(null);
      const res = await api.importNgoInventory(file);
      setResult(res);
      if (res.success_count > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || t('errors.failedImportInventory'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,item_name,category,quantity,condition,received_date,storage_location,status,notes\nNotebook,General,50,NEW,2026-09-01,Warehouse A,AVAILABLE,Urgent need\nBook,Education,20,GOOD,,,ALLOCATED,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(43, 29, 20, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 110, padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #EAE5DE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '8px', backgroundColor: '#FDF1EB', color: '#C4622D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2B1D14', fontFamily: 'Fraunces, serif' }}>{t('ngo.importInventory.title')}</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#654B35' }}>{t('ngo.importInventory.desc')}</p>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6B' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {result ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <CheckCircle size={48} color="#2F7A4F" style={{ marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: '#2B1D14' }}>{t('success.importComplete')}</h3>
                <p style={{ margin: 0, color: '#654B35', fontSize: '14px' }}>{t('ngo.importInventory.processedRows', { count: result.total_rows })}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#EBF4ED', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1B472E' }}>{result.success_count}</div>
                  <div style={{ fontSize: '12px', color: '#2F7A4F', fontWeight: 600 }}>{t('ngo.importInventory.imported')}</div>
                </div>
                <div style={{ backgroundColor: '#FDF1EB', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#A34F22' }}>{result.duplicate_count}</div>
                  <div style={{ fontSize: '12px', color: '#C4622D', fontWeight: 600 }}>{t('ngo.importInventory.updated')}</div>
                </div>
                <div style={{ backgroundColor: '#FDF3F3', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#A52A2A' }}>{result.skipped_count}</div>
                  <div style={{ fontSize: '12px', color: '#D14343', fontWeight: 600 }}>{t('ngo.importInventory.skipped')}</div>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div style={{ backgroundColor: '#FDF3F3', borderRadius: '12px', padding: '16px', border: '1px solid #FADCDC' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#A52A2A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> {t('ngo.importInventory.validationErrors')}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#A52A2A', maxHeight: '100px', overflowY: 'auto' }}>
                    {result.errors.map((err, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{t('ngo.importInventory.rowError', { row: err.row, error: err.error })}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div style={{ backgroundColor: '#FDF3F3', color: '#D14343', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragging ? '#C4622D' : '#EAE5DE'}`,
                  backgroundColor: isDragging ? '#FDF1EB' : '#FAFAF9',
                  borderRadius: '12px', padding: '40px 24px', textAlign: 'center',
                  transition: 'all 0.2s ease', cursor: 'pointer', marginBottom: '24px'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  style={{ display: 'none' }} 
                />
                
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#EBF4ED', color: '#2F7A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#2B1D14', marginBottom: '4px' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#8C7A6B' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <>
                    <FileText size={32} color="#8C7A6B" style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#2B1D14', marginBottom: '4px' }}>{t('ngo.importInventory.dragDrop')}</div>
                    <div style={{ fontSize: '13px', color: '#8C7A6B', marginBottom: '16px' }}>{t('common.or')}</div>
                    <div style={{ backgroundColor: '#C4622D', color: '#fff', padding: '8px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, display: 'inline-block' }}>{t('actions.chooseFile')}</div>
                    <div style={{ fontSize: '12px', color: '#8C7A6B', marginTop: '16px' }}>{t('ngo.importInventory.supportsFormat')}</div>
                  </>
                )}
              </div>

              <div style={{ backgroundColor: '#FDF9F6', border: '1px solid #FCE8DF', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <FileText size={20} color="#C4622D" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2B1D14', marginBottom: '4px' }}>{t('ngo.importInventory.downloadTemplate')}</div>
                    <div style={{ fontSize: '12px', color: '#654B35', lineHeight: 1.5 }}>{t('ngo.importInventory.templateDesc')}</div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }} style={{ backgroundColor: '#fff', border: '1px solid #C4622D', color: '#C4622D', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> {t('actions.download')}
                </button>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#2B1D14', marginBottom: '8px' }}>{t('ngo.importInventory.supportedColumns')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['item_name', 'category', 'quantity', 'condition', 'received_date', 'storage_location', 'status', 'notes'].map(col => (
                    <span key={col} style={{ backgroundColor: '#F4F2EE', color: '#654B35', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{col}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #EAE5DE', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', backgroundColor: '#FAFAF9' }}>
          {result ? (
            <button onClick={handleClose} style={{ backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              {t('common.done')}
            </button>
          ) : (
            <>
              <button onClick={handleClose} disabled={isUploading} style={{ backgroundColor: '#fff', border: '1px solid #EAE5DE', color: '#4A3D34', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                {t('actions.cancel')}
              </button>
              <button onClick={handleUpload} disabled={!file || isUploading} style={{ backgroundColor: '#C4622D', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: (!file || isUploading) ? 'not-allowed' : 'pointer', opacity: (!file || isUploading) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isUploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('ngo.importInventory.importing')}</> : t('ngo.importInventory.importItems')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
