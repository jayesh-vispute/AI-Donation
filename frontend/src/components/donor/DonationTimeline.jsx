import React from 'react';
import { Check } from 'lucide-react';

const steps = [
  { id: 'PENDING', label: 'Item Registered', aliases: ['PENDING', 'REGISTERED', 'DRAFT'] },
  { id: 'AI_DETECTED', label: 'AI Detected', aliases: ['AI_DETECTED'] },
  { id: 'MATCHED', label: 'NGO Matched', aliases: ['MATCHED', 'ACCEPTED'] },
  { id: 'PACKAGING_NOTIFIED', label: 'Packaging Notified', aliases: ['PACKAGING_NOTIFIED'] },
  { id: 'PACKAGING_IN_PROGRESS', label: 'Packaging In Progress', aliases: ['PACKAGING_IN_PROGRESS'] },
  { id: 'PACKED', label: 'Packed', aliases: ['PACKED'] },
  { id: 'SEALED', label: 'Sealed', aliases: ['SEALED'] },
  { id: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', aliases: ['PICKUP_SCHEDULED', 'SCHEDULED'] },
  { id: 'PICKUP_CONFIRMED', label: 'Pickup Confirmed', aliases: ['PICKUP_CONFIRMED'] },
  { id: 'COLLECTED', label: 'Collected', aliases: ['COLLECTED', 'PICKED_UP'] },
  { id: 'DELIVERED', label: 'Delivered', aliases: ['DELIVERED'] },
  { id: 'RECEIVED', label: 'NGO Received', aliases: ['RECEIVED', 'VERIFIED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'] }
];

export default function DonationTimeline({ currentStatus }) {
  const normStatus = (currentStatus || '').toUpperCase();
  let currentIndex = steps.findIndex(s => s.id === normStatus || (s.aliases && s.aliases.includes(normStatus)));
  if (currentIndex === -1) currentIndex = 0; // Default to first if unknown

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        const isLast = index === steps.length - 1;

        let dotStyle = {};
        if (isCompleted) {
          dotStyle = { backgroundColor: 'var(--secondary-600)', borderColor: 'var(--secondary-600)', color: '#fff' };
        } else if (isCurrent) {
          dotStyle = { backgroundColor: 'var(--primary-600)', borderColor: 'var(--primary-600)', color: '#fff' };
        } else {
          dotStyle = { backgroundColor: 'var(--neutral-0)', borderColor: 'var(--neutral-300)', color: 'transparent' };
        }

        return (
          <div key={step.id} style={{ display: 'flex', position: 'relative', minHeight: '60px' }}>
            {/* Timeline Line */}
            {!isLast && (
              <div style={{
                position: 'absolute', top: '24px', left: '11px', bottom: '-8px', width: '2px',
                backgroundColor: isCompleted ? 'var(--secondary-600)' : 'var(--neutral-300)',
                zIndex: 0
              }} />
            )}

            {/* Timeline Dot */}
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', border: '2px solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1, marginTop: '2px', ...dotStyle
            }}>
              {isCompleted && <Check size={14} strokeWidth={3} />}
              {isCurrent && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
            </div>

            {/* Step Content */}
            <div style={{ marginLeft: '16px', paddingBottom: '24px' }}>
              <div style={{
                fontSize: '15px',
                fontWeight: isCurrent ? 700 : 500,
                color: isFuture ? 'var(--neutral-600)' : 'var(--neutral-900)'
              }}>
                {step.label}
              </div>
              {isCurrent && (
                <div style={{ fontSize: '13px', color: 'var(--neutral-600)', marginTop: '4px' }}>
                  This step is currently in progress.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
