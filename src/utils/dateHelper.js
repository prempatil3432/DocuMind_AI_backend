/**
 * Date Helper for Smart Deadline Detection & Normalization
 * Standardizes dates and generates human-friendly relative labels
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Attempt to parse varied date representations into a standard Date object
 * @param {string|Date} input 
 * @returns {Date|null}
 */
export function parseDate(input) {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;

  const str = String(input).trim();
  if (!str || str.toLowerCase().includes('no deadline') || str.toLowerCase().includes('none')) {
    return null;
  }

  // Try standard parsing
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // Try parsing common DD/MM/YYYY or DD-MM-YYYY formats
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Try parsing "15 October 2026" or "15th Oct 2026"
  const textMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthName = textMatch[2].substring(0, 3).toLowerCase();
    const year = parseInt(textMatch[3], 10);
    const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName);
    if (mIdx !== -1) {
      d = new Date(year, mIdx, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

/**
 * Format a Date object into "15 Oct 2026"
 * @param {Date} date 
 * @returns {string}
 */
export function formatStandardDate(date) {
  if (!date || isNaN(date.getTime())) return 'No deadline found in the document.';
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Computes human-friendly relative deadline label:
 * - "Today"
 * - "Tomorrow"
 * - "In X days"
 * - "Overdue (X days ago)"
 * - "15 Oct 2026"
 * @param {string|Date} input 
 * @param {Date} [referenceDate]
 * @returns {{ display: string, normalized: string, isOverdue: boolean, daysDiff: number|null }}
 */
export function getRelativeDeadline(input, referenceDate = new Date()) {
  const date = parseDate(input);
  if (!date) {
    return {
      display: 'No deadline found in the document.',
      normalized: 'None',
      isOverdue: false,
      daysDiff: null
    };
  }

  // Strip time for clean day comparison
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = target.getTime() - ref.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const normalized = formatStandardDate(target);

  let display = normalized;
  let isOverdue = false;

  if (diffDays === 0) {
    display = 'Today';
  } else if (diffDays === 1) {
    display = 'Tomorrow';
  } else if (diffDays > 1 && diffDays <= 7) {
    display = `In ${diffDays} days`;
  } else if (diffDays < 0) {
    isOverdue = true;
    const absDays = Math.abs(diffDays);
    display = absDays === 1 ? 'Overdue (Yesterday)' : `Overdue (${absDays} days ago)`;
  } else {
    // For dates beyond 7 days, display formatted date: "15 Oct 2026"
    display = normalized;
  }

  return {
    display,
    normalized,
    isOverdue,
    daysDiff: diffDays
  };
}
