/** Shared NGO UI label helpers — maps backend values to i18n keys without changing API data. */

export function translateDonationStatus(status, t) {
  const key = (status || '').toUpperCase().replace(/\s+/g, '_');
  const statusKeyMap = {
    PACKAGING: 'packagingNotified',
    PACKAGING_NOTIFIED: 'packagingNotified',
    PICKUP_SCHEDULED: 'pickupScheduled',
    PICKUP_CONFIRMED: 'pickupConfirmed',
    PICKED_UP: 'pickedUp',
    COLLECTED: 'collected',
    DELIVERED: 'delivered',
    RECEIVED: 'received',
    ACKNOWLEDGED: 'acknowledged',
    NGO_RECEIVED: 'ngoReceived',
    COMPLETED: 'completed',
    ACCEPTED: 'accepted',
    CANCELLED: 'cancelled',
  };
  const statusKey = statusKeyMap[key] || key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  return t(`status.${statusKey}`, t(`ngo.statusLabels.${key}`, status));
}

export function translateDemandStatus(status, t) {
  const normalized = (status || '').replace(/\s+/g, '_').toUpperCase();
  const map = {
    ALL: 'all',
    PENDING: 'pending',
    PARTIALLY_FULFILLED: 'partiallyFulfilled',
    FULFILLED: 'fulfilled',
    EXPIRED: 'expired',
  };
  const slug = map[normalized] || normalized.toLowerCase();
  return t(`ngo.demandStatus.${slug}`, status);
}

export function translatePriority(priority, t) {
  const key = (priority || 'MEDIUM').toUpperCase();
  return t(`ngo.priority.${key}`, priority);
}

export function translateCondition(condition, t) {
  const key = (condition || 'GOOD').toUpperCase();
  return t(`ngo.condition.${key}`, condition);
}

export function translateInventoryStatus(status, t) {
  const key = (status || 'AVAILABLE').toUpperCase();
  return t(`ngo.inventoryStatus.${key}`, (status || '').replace(/_/g, ' '));
}

export function translateCategory(category, t) {
  const map = {
    Clothing: 'clothing',
    Books: 'books',
    'Books & Education': 'books',
    Food: 'food',
    Toys: 'toys',
    Essentials: 'essentials',
    Others: 'others',
    General: 'general',
  };
  const slug = map[category] || category;
  return t(`ngo.categories.${slug}`, category);
}
