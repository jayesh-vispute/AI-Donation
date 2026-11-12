/**
 * Maps stored notification titles/types to i18n templates.
 * Does not change database records — only presentation.
 */

const TITLE_KEYS = {
  'Donation Submitted': 'notification.titles.donationSubmitted',
  'NGO Match Found!': 'notification.titles.ngoMatchFound',
  'New Matching Donation Found': 'notification.titles.newMatchingDonation',
  'Pickup Scheduled': 'notification.titles.pickupScheduled',
  'Pickup Schedule Changed': 'notification.titles.pickupRescheduled',
  'Pickup Confirmed': 'notification.titles.pickupConfirmed',
  'Donation Collected': 'notification.titles.donationCollected',
  'Donation Ready for Pickup': 'notification.titles.readyForPickup',
  'Donation Delivered': 'notification.titles.donationDelivered',
  'Donation Received': 'notification.titles.donationReceived',
  'Donation Completed': 'notification.titles.donationCompleted',
  'Donation Update': 'notification.titles.donationUpdate',
};

const TYPE_LABEL_KEYS = {
  donations: 'notification.types.donations',
  matches: 'notification.types.matches',
  match: 'notification.types.matches',
  pickups: 'notification.types.pickups',
  pickup: 'notification.types.pickups',
  collected: 'notification.types.collected',
  delivered: 'notification.types.delivered',
  acknowledged: 'notification.types.acknowledged',
  update: 'notification.types.update',
  reminder: 'notification.types.reminder',
  registration: 'notification.types.registration',
  system: 'notification.types.system',
  demand: 'notification.types.demand',
};

function extractInterpolation(notif) {
  const message = notif.message || '';
  const donationMatch = message.match(/DON-(\d+)/i) || message.match(/donation\s*#(\d+)/i) || message.match(/#(\d+)/);
  const donationId = notif.donation_id || donationMatch?.[1] || notif.related_entity_id || '';

  const ngoParen = message.match(/NGO\s*\(([^)]+)\)/i);
  const deliveredTo = message.match(/delivered to ([^.]+)\./i);
  const ngoName = ngoParen?.[1] || (deliveredTo && !/your NGO/i.test(deliveredTo[1]) ? deliveredTo[1] : '') || '';

  const itemParen = message.match(/item\s*\(([^)]+)\)/i);
  const itemName = itemParen?.[1] || '';

  const qtyMatch = message.match(/of (\d+) item/i);
  const quantity = qtyMatch?.[1] || '';

  const dateAt = message.match(/for ([A-Za-z]{3} \d{1,2}, \d{4}) at ([^.]+)/);
  const onAt = message.match(/on ([A-Za-z]{3} \d{1,2}, \d{4}) at ([^.]+)/);
  const date = dateAt?.[1] || onAt?.[1] || '';
  const time = dateAt?.[2] || onAt?.[2] || '';

  return { donationId, ngoName, itemName, quantity, date, time };
}

function messageKeyFor(notif) {
  const title = notif.title || '';
  const role = (notif.recipient_role || '').toUpperCase();
  const msg = notif.message || '';

  switch (title) {
    case 'Donation Submitted':
      return 'notification.messages.donationSubmitted';
    case 'NGO Match Found!':
      return 'notification.messages.donationMatched';
    case 'New Matching Donation Found':
      return 'notification.messages.newMatchingDonation';
    case 'Pickup Scheduled':
      return role === 'NGO'
        ? 'notification.messages.pickupScheduledNgo'
        : 'notification.messages.pickupScheduled';
    case 'Pickup Schedule Changed':
      return 'notification.messages.pickupRescheduled';
    case 'Pickup Confirmed':
      return 'notification.messages.pickupConfirmed';
    case 'Donation Collected':
      return 'notification.messages.donationCollected';
    case 'Donation Ready for Pickup':
      return 'notification.messages.readyForPickup';
    case 'Donation Delivered':
      if (role === 'NGO' || /your NGO/i.test(msg) || /your location/i.test(msg)) {
        return 'notification.messages.deliveryVerifiedNgo';
      }
      return 'notification.messages.deliveryVerified';
    case 'Donation Received':
      return 'notification.messages.ngoReceived';
    case 'Donation Completed':
      return role === 'NGO'
        ? 'notification.messages.donationCompletedNgo'
        : 'notification.messages.donationCompleted';
    case 'Donation Update':
      if (/accepted/i.test(msg)) return 'notification.messages.donationAccepted';
      if (/rejected/i.test(msg)) return 'notification.messages.donationRejected';
      return null;
    default:
      return null;
  }
}

export function translateNotification(notif, t) {
  if (!notif) return { title: '', message: '', typeLabel: '' };

  const vars = extractInterpolation(notif);
  const titleKey = TITLE_KEYS[notif.title];
  const title = titleKey ? t(titleKey, notif.title) : (notif.title || '');

  const msgKey = messageKeyFor(notif);
  let message = notif.message || '';
  if (msgKey) {
    const hasDynamic = vars.donationId || vars.quantity || vars.ngoName || vars.date || vars.itemName;
    if (hasDynamic) {
      message = t(msgKey, { ...vars, defaultValue: notif.message });
    }
  }

  const typeKey = TYPE_LABEL_KEYS[(notif.type || '').toLowerCase()];
  const typeLabel = typeKey ? t(typeKey, notif.type) : (notif.type || '');

  return { title, message, typeLabel };
}

export function translateNotificationType(type, t) {
  const typeKey = TYPE_LABEL_KEYS[(type || '').toLowerCase()];
  return typeKey ? t(typeKey, type) : type;
}
