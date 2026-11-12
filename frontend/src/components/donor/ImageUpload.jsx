import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function ImageUpload({ onImageSelected, maxSizeMB = 10 }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return false;
    }
    if (file.size > maxBytes) {
      setError(`File size must be under ${maxSizeMB} MB.`);
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
    setError('');
    if (!file || !validateFile(file)) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError('');
    onImageSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={preview}
            alt="Upload preview"
            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: 'var(--radius)', background: '#F1F5F9' }}
          />
          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={clearImage}
            style={{ position: 'absolute', top: 8, right: 8 }}
            aria-label="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload donation image"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <div className="upload-area-icon">
          <Upload size={64} />
        </div>
        <h3 className="upload-area-title">Drag & Drop Image Here</h3>
        <p className="upload-area-hint">or click to choose a file</p>
        <p className="upload-area-hint" style={{ marginTop: '0.5rem' }}>
          JPG, JPEG, PNG, WebP • Max {maxSizeMB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>
      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>
      )}
    </div>
  );
}
