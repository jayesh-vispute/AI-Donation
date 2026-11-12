import React from 'react';
import { useTranslation } from 'react-i18next';

const statusConfig = {
  matched: { i18nKey: 'status.matched', fallback: 'Matched', className: 'badge-primary' },
  packaging_notified: { i18nKey: 'status.packagingNotified', fallback: 'Packaging', className: 'badge-info' },
  pickup_scheduled: { i18nKey: 'status.pickupScheduled', fallback: 'Pickup Scheduled', className: 'badge-warning' },
  pickup_confirmed: { i18nKey: 'status.pickupConfirmed', fallback: 'Pickup Confirmed', className: 'badge-warning' },
  collected: { i18nKey: 'status.collected', fallback: 'Collected', className: 'badge-info' },
  picked_up: { i18nKey: 'status.pickedUp', fallback: 'Picked Up', className: 'badge-info' },
  delivered: { i18nKey: 'status.delivered', fallback: 'Delivered', className: 'badge-success' },
  received: { i18nKey: 'status.received', fallback: 'Received', className: 'badge-success' },
  acknowledged: { i18nKey: 'status.acknowledged', fallback: 'Acknowledged', className: 'badge-success' },
  accepted: { i18nKey: 'status.accepted', fallback: 'Accepted', className: 'badge-success' },
  pending: { i18nKey: 'status.pending', fallback: 'Pending', className: 'badge-warning' },
  active: { i18nKey: 'status.active', fallback: 'Active', className: 'badge-success' },
  fulfilled: { i18nKey: 'status.fulfilled', fallback: 'Fulfilled', className: 'badge-success' },
  expired: { i18nKey: 'status.expired', fallback: 'Expired', className: 'badge-error' },
  approved: { i18nKey: 'status.approved', fallback: 'Approved', className: 'badge-success' },
  suspended: { i18nKey: 'status.suspended', fallback: 'Suspended', className: 'badge-error' },
  rejected: { i18nKey: 'status.rejected', fallback: 'Rejected', className: 'badge-error' },
  cancelled: { i18nKey: 'status.cancelled', fallback: 'Cancelled', className: 'badge-error' },
  healthy: { i18nKey: 'status.healthy', fallback: 'Healthy', className: 'badge-success' },
  warning: { i18nKey: 'status.warning', fallback: 'Warning', className: 'badge-warning' },
  offline: { i18nKey: 'status.offline', fallback: 'Offline', className: 'badge-error' },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  
  const config = statusConfig[status];
  
  const className = config ? config.className : 'badge-neutral';
  const label = config ? t(config.i18nKey, config.fallback) : status;

  return (
    <span className={`badge ${className}`} role="status">
      {label}
    </span>
  );
}
