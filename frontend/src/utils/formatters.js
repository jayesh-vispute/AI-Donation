/**
 * Date and time formatting helpers for Donation AI
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_LONG = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
  'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a date cleanly (e.g., "21 Sept 2026" or "25 Sep 2026")
 */
export function formatCleanDate(dateInput, useSept = true) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';

  const day = d.getDate();
  const month = useSept ? MONTH_NAMES_LONG[d.getMonth()] : MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats 24-hour timestamp for timeline logs: "21 Sept 2026, 04:07"
 */
export function formatTimestamp24(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const day = d.getDate();
  const month = MONTH_NAMES_LONG[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Standardizes pickup date and time to: "25 Sep 2026 · 10:00 AM"
 * Strips unnecessary seconds and whitespace.
 */
export function formatPickupDateTime(dateInput, timeSlotInput) {
  if (!dateInput && !timeSlotInput) return 'Not scheduled';

  let datePart = '';
  let timePart = '';

  if (dateInput) {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = MONTH_NAMES[d.getMonth()];
      const year = d.getFullYear();
      datePart = `${day} ${month} ${year}`;

      // Check if the date string has a non-midnight time component
      // (or if it's an ISO timestamp with hours/minutes)
      const hasSpecificTime = typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.includes(' '));
      if (hasSpecificTime && !timeSlotInput) {
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        timePart = `${hours}:${minutes} ${ampm}`;
      }
    } else if (typeof dateInput === 'string') {
      datePart = dateInput;
    }
  }

  if (timeSlotInput && typeof timeSlotInput === 'string') {
    // Clean up timeslot string: remove seconds like ":00", strip extra whitespace
    timePart = timeSlotInput
      .replace(/:00\s*(AM|PM)/gi, ' $1')
      .replace(/:00\b/g, '')
      .trim();
  }

  if (datePart && timePart) {
    return `${datePart} · ${timePart}`;
  }
  return datePart || timePart || 'Not scheduled';
}

/**
 * Formats a donation ID into standard DON-XXX format
 */
export function formatDonationId(id) {
  if (!id && id !== 0) return '';
  const num = String(id).replace(/\D/g, '') || id;
  return `DON-${num.toString().padStart(3, '0')}`;
}
