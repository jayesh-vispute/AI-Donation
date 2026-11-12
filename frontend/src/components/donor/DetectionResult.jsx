import { useEffect, useRef, useState } from 'react';

export default function DetectionResult({ imageUrl, items }) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgMetrics, setImgMetrics] = useState({
    naturalWidth: 1,
    naturalHeight: 1,
    clientWidth: 1,
    clientHeight: 1,
    offsetX: 0,
    offsetY: 0,
    renderedWidth: 1,
    renderedHeight: 1
  });

  const calculateMetrics = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    
    if (!img.naturalWidth || !img.naturalHeight) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // We use the container dimensions if the img tag spans it, 
    // or the img tag's client dimensions itself.
    const clientWidth = img.clientWidth;
    const clientHeight = img.clientHeight;

    const containerRatio = clientWidth / clientHeight;
    const imageRatio = naturalWidth / naturalHeight;

    let renderedWidth, renderedHeight;

    if (imageRatio > containerRatio) {
      // Image is wider than container: constrained by width
      renderedWidth = clientWidth;
      renderedHeight = clientWidth / imageRatio;
    } else {
      // Image is taller than container: constrained by height
      renderedHeight = clientHeight;
      renderedWidth = clientHeight * imageRatio;
    }

    const offsetX = (clientWidth - renderedWidth) / 2;
    const offsetY = (clientHeight - renderedHeight) / 2;

    setImgMetrics({
      naturalWidth,
      naturalHeight,
      clientWidth,
      clientHeight,
      offsetX,
      offsetY,
      renderedWidth,
      renderedHeight
    });
  };

  useEffect(() => {
    let observer;
    if (imgRef.current) {
      observer = new ResizeObserver(() => {
        calculateMetrics();
      });
      observer.observe(imgRef.current);
    }
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [imageUrl]);

  // Pre-calculate positions to avoid label collisions
  const placedLabels = [];
  const OVERLAPS = (l1, t1, w1, h1, l2, t2, w2, h2) => (l1 < l2 + w2 && l1 + w1 > l2 && t1 < t2 + h2 && t1 + h1 > t2);

  const boxesWithLayout = [];
  if (items) {
    items.forEach((item, itemIdx) => {
      if (item.boxes) {
        item.boxes.forEach((box, boxIdx) => {
          const scaleX = imgMetrics.renderedWidth / imgMetrics.naturalWidth;
          const scaleY = imgMetrics.renderedHeight / imgMetrics.naturalHeight;
          const left = imgMetrics.offsetX + (box.x1 * scaleX);
          const top = imgMetrics.offsetY + (box.y1 * scaleY);
          const width = (box.x2 - box.x1) * scaleX;
          const height = (box.y2 - box.y1) * scaleY;

          const text = `${item.name} ${Math.round((box.confidence || item.confidence) * 100)}%`;
          const LABEL_H = 24;
          // Approximate width (8px per char + 16px padding)
          const LABEL_W = text.length * 7 + 16; 

          let labelLeft = left;
          let labelTop = top - LABEL_H - 4;

          // Keep inside image container bounds
          if (labelTop < 0) labelTop = top + 4; 
          if (labelLeft < 0) labelLeft = 0;
          if (labelLeft + LABEL_W > imgMetrics.clientWidth) labelLeft = imgMetrics.clientWidth - LABEL_W;

          let collision = true;
          let attempts = 0;
          
          while (collision && attempts < 15) {
            collision = false;
            for (const p of placedLabels) {
              if (OVERLAPS(labelLeft, labelTop, LABEL_W + 4, LABEL_H + 4, p.left, p.top, p.width, p.height)) {
                collision = true;
                break;
              }
            }
            if (collision) {
              labelTop += LABEL_H + 4; // push down
              
              if (labelTop + LABEL_H > imgMetrics.clientHeight) {
                  // If we hit bottom, jump to top and shift right
                  labelTop = top + 4; 
                  labelLeft += 15;
              }
            }
            attempts++;
          }

          placedLabels.push({ left: labelLeft, top: labelTop, width: LABEL_W, height: LABEL_H });
          boxesWithLayout.push({ id: `${itemIdx}-${boxIdx}`, left, top, width, height, labelLeft, labelTop, text });
        });
      }
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Detected donation items"
          style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: 'var(--radius)', display: 'block' }}
          onLoad={calculateMetrics}
        />

      {/* Render Bounding Boxes */}
      {boxesWithLayout.map((b) => (
        <div
          key={`box-${b.id}`}
          style={{
            position: 'absolute',
            left: `${b.left}px`,
            top: `${b.top}px`,
            width: `${b.width}px`,
            height: `${b.height}px`,
            border: '2px solid rgba(196, 98, 45, 0.8)', // Donation AI theme accent
            backgroundColor: 'rgba(196, 98, 45, 0.15)',
            borderRadius: '4px',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
      ))}

      {/* Render Labels Separately (on top) */}
      {boxesWithLayout.map((b) => (
        <div
          key={`label-${b.id}`}
          style={{
            position: 'absolute',
            left: `${b.labelLeft}px`,
            top: `${b.labelTop}px`,
            backgroundColor: '#C4622D', // Theme color
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            textTransform: 'capitalize',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          {b.text}
        </div>
      ))}
      </div>
    </div>
  );
}
