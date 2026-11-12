import React, { useState, useEffect } from 'react';
import { Package, Box, GitCompare, Truck, CheckCircle2, MapPin, Heart, Check, Lock, ClipboardList, Loader, Calendar, ShieldCheck, Copy } from 'lucide-react';
import { formatTimestamp24, formatPickupDateTime } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { translateDonationStatus } from '../../utils/ngoI18n';

const STAGES = [
  { key: 'REGISTERED', title: 'Item Registered', defaultDesc: 'Your donation items have been successfully registered.', statusBadge: 'PENDING', icon: Package, matchStatuses: ['PENDING', 'REGISTERED', 'DRAFT'] },
  { key: 'AI_DETECTED', title: 'AI Detected', defaultDesc: 'Items have been analyzed by our AI system.', statusBadge: 'PENDING', icon: Box, matchStatuses: ['AI_DETECTED'] },
  { key: 'MATCHED', title: 'NGO Matched', defaultDesc: 'We are matching your items with suitable NGOs.', statusBadge: 'MATCHED', icon: GitCompare, matchStatuses: ['MATCHED', 'ACCEPTED'] },
  { key: 'PACKAGING_NOTIFIED', title: 'Packaging Notified', defaultDesc: 'Please prepare your items for packaging.', statusBadge: 'PACKAGING', icon: ClipboardList, matchStatuses: ['PACKAGING_NOTIFIED'] },
  { key: 'PACKAGING_IN_PROGRESS', title: 'Packaging In Progress', defaultDesc: 'Packaging is currently in progress.', statusBadge: 'PACKAGING', icon: Loader, matchStatuses: ['PACKAGING_IN_PROGRESS'] },
  { key: 'PACKED', title: 'Packed', defaultDesc: 'Items packed. Complete sealing to proceed.', statusBadge: 'PACKED', icon: Box, matchStatuses: ['PACKED'] },
  { key: 'SEALED', title: 'Sealed', defaultDesc: 'Sealed and ready for pickup.', statusBadge: 'SEALED', icon: Lock, matchStatuses: ['SEALED'] },
  { key: 'PICKUP_SCHEDULED', title: 'Pickup Scheduled', defaultDesc: 'Pickup has been scheduled.', statusBadge: 'SCHEDULED', icon: Calendar, matchStatuses: ['PICKUP_SCHEDULED', 'SCHEDULED'] },
  { key: 'PICKUP_CONFIRMED', title: 'Pickup Confirmed', defaultDesc: 'Pickup is confirmed and incoming.', statusBadge: 'CONFIRMED', icon: CheckCircle2, matchStatuses: ['PICKUP_CONFIRMED'] },
  { key: 'COLLECTED', title: 'Collected', defaultDesc: 'Your donation items have been collected.', statusBadge: 'COLLECTED', icon: Truck, matchStatuses: ['COLLECTED', 'PICKED_UP'] },
  { key: 'DELIVERED', title: 'Delivered', defaultDesc: 'Items have been delivered to the NGO.', statusBadge: 'DELIVERED', icon: MapPin, matchStatuses: ['DELIVERED'] },
  { key: 'RECEIVED', title: 'NGO Received', defaultDesc: 'The NGO has acknowledged receipt of the items.', statusBadge: 'RECEIVED', icon: Heart, matchStatuses: ['RECEIVED', 'VERIFIED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'] }
];

const STATUS_STAGE_MAP = {
  'DRAFT': 0, 'REGISTERED': 0, 'PENDING': 0,
  'AI_DETECTED': 1,
  'MATCHED': 2, 'ACCEPTED': 2,
  'PACKAGING_NOTIFIED': 3,
  'PACKAGING_IN_PROGRESS': 4,
  'PACKED': 5,
  'SEALED': 6,
  'PICKUP_SCHEDULED': 7, 'SCHEDULED': 7,
  'PICKUP_CONFIRMED': 8,
  'COLLECTED': 9, 'PICKED_UP': 9,
  'DELIVERED': 10,
  'RECEIVED': 11, 'VERIFIED': 11, 'ACKNOWLEDGED': 11, 'NGO_RECEIVED': 11, 'COMPLETED': 11
};

function getBadgeColors(statusStr) {
  const s = (statusStr || '').toUpperCase();
  if (['RECEIVED', 'VERIFIED', 'ACKNOWLEDGED', 'NGO_RECEIVED', 'COMPLETED'].includes(s)) return { bg: '#F0FDF4', color: '#16A34A' };
  if (s === 'DELIVERED') return { bg: '#FDF1EB', color: '#C4622D' }; // Just delivered
  if (s === 'MATCHED' || s === 'ACCEPTED') return { bg: '#FAF5FF', color: '#9333EA' };
  if (s === 'PICKUP_SCHEDULED' || s === 'SCHEDULED' || s === 'PICKUP_CONFIRMED') return { bg: '#FEF3E4', color: '#C4622D' };
  if (s === 'COLLECTED' || s === 'PICKED_UP') return { bg: '#F2F6FE', color: '#2563EB' };
  return { bg: '#FDF1EB', color: '#C4622D' };
}

export default function TrackingTimeline({ donation, history = [], deliveryOtpData = null }) {
  const { t } = useTranslation();
  const currentStatus = (donation?.status || 'PENDING').toUpperCase();

  // Build history lookup by status
  const historyMap = {};
  if (Array.isArray(history)) {
    history.forEach(h => {
      if (h.new_status) {
        historyMap[h.new_status.toUpperCase()] = h;
      }
    });
  }

  // Determine current active stage index
  let currentStageIndex = STATUS_STAGE_MAP[currentStatus] ?? 0;

  // Also check if any history items indicate higher stage
  STAGES.forEach((stage, idx) => {
    for (const s of stage.matchStatuses) {
      if (historyMap[s]) {
        currentStageIndex = Math.max(currentStageIndex, idx);
        break;
      }
    }
  });

  const creationTimeStr = formatTimestamp24(donation?.created_at);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentStageIndex;
        const isCurrent = idx === currentStageIndex;
        const isFuture = idx > currentStageIndex;
        const isLast = idx === STAGES.length - 1;

        const IconComponent = stage.icon;

        // Try finding matching history entry
        let historyEntry = null;
        for (const s of stage.matchStatuses) {
          if (historyMap[s]) {
            historyEntry = historyMap[s];
            break;
          }
        }

        let timestampStr = null;
        if (historyEntry?.created_at) {
          timestampStr = formatTimestamp24(historyEntry.created_at);
        } else if ((idx === 0 || idx === 1) && !isFuture) {
          timestampStr = creationTimeStr;
        }

        // Determine note text
        let displayNote = historyEntry?.notes || historyEntry?.remarks;
        if (!displayNote) {
          if (typeof stage.defaultNote === 'function') {
            displayNote = stage.defaultNote(donation);
          } else {
            displayNote = stage.defaultNote;
          }
        }

        // Determine status badge text
        const badgeStatus = historyEntry?.new_status?.toUpperCase() || stage.statusBadge;
        const badgeText = translateDonationStatus(badgeStatus, t);
        const badgeColors = getBadgeColors(badgeText);

        return (
          <div key={stage.key} style={{ display: 'flex', gap: '12px', position: 'relative', minHeight: '48px', flexShrink: 0 }}>
            
            {/* Connecting Vertical Line */}
            {!isLast && (
              <div 
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '32px',
                  bottom: '0',
                  width: '2px',
                  backgroundColor: idx < currentStageIndex ? '#C4622D' : '#EAE5DE',
                  zIndex: 0
                }} 
              />
            )}

            {/* Timeline Icon Badge */}
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isCompleted || isCurrent ? '#C4622D' : '#F5F2ED',
                color: isCompleted || isCurrent ? '#FFFFFF' : '#A39284',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                flexShrink: 0,
                boxShadow: isCurrent ? '0 0 0 3px #FDF1EB' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isCompleted ? (
                <Check size={16} strokeWidth={2.5} />
              ) : (
                <IconComponent size={16} fill={isCurrent && stage.key === 'RECEIVED' ? 'none' : 'none'} />
              )}
            </div>

            {/* Stage Text & Details */}
            <div 
              style={{
                flex: 1,
                paddingBottom: isLast ? '0' : '16px',
                paddingTop: '0px',
                minWidth: 0
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: isCurrent || isCompleted ? 700 : 500,
                      color: isFuture ? '#8C7A6B' : '#2B1D14'
                    }}
                  >
                    {stage.title}
                  </h4>
                  {!isFuture && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: badgeColors.bg,
                      color: badgeColors.color
                    }}>
                      {badgeText}
                    </span>
                  )}
                </div>

                {timestampStr && !isFuture && (
                  <span style={{ fontSize: '11px', color: '#8C7A6B', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {timestampStr}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', color: isFuture ? '#A39284' : '#654B35', lineHeight: '1.4' }}>
                  {stage.defaultDesc}
                </span>
                {!isFuture && displayNote && (
                  <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#8C7A6B', paddingLeft: '4px', borderLeft: '1px solid #EAE5DE' }}>
                    {displayNote}
                  </span>
                )}
              </div>

              {/* Delivery OTP for COLLECTED stage */}
              {stage.key === 'COLLECTED' && isCurrent && deliveryOtpData?.otp && (
                <div style={{ marginTop: '12px', backgroundColor: '#FDFCFB', border: '1px solid #EAE5DE', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#C4622D', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> Delivery Verification Code
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '4px', color: '#2B1D14' }}>
                      {deliveryOtpData.otp}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(deliveryOtpData.otp);
                      }}
                      style={{ 
                        background: 'none', border: '1px solid #EAE5DE', borderRadius: '6px', 
                        padding: '6px', cursor: 'pointer', color: '#654B35', display: 'flex', alignItems: 'center' 
                      }}
                      title="Copy OTP"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8C7A6B', marginTop: '6px' }}>
                    Share this code with the authorized delivery person only when your donation is being delivered.
                  </div>
                </div>
              )}

              {/* Verified details for DELIVERED stage */}
              {stage.key === 'DELIVERED' && (isCompleted || isCurrent) && donation?.delivery_verified_at && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <CheckCircle2 size={14} /> Delivery Verified
                  </div>
                  <div style={{ fontSize: '11px', color: '#8C7A6B', paddingLeft: '20px' }}>
                    {formatTimestamp24(donation.delivery_verified_at)}
                  </div>
                </div>
              )}

              {/* Verified details for RECEIVED stage */}
              {stage.key === 'RECEIVED' && isCurrent && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <CheckCircle2 size={14} /> NGO Received
                  </div>
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
