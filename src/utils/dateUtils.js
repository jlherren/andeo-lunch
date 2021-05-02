/*
 * Note: To avoid having to load huge date/time libraries like Luxon (or even the heavy-ass moment.js) for the very
 * few date and time calculation we need, this file will attempt to wrap everything we need.  Assumption made:
 * - modern browser is available
 * - locale is set up to the time zone the user wants to see
 * - all time calculations done in local time
 */

/**
 * Get the midnight preceding (or on) the given date
 *
 * @param {Date} date
 * @returns {Date}
 */
export function previousMidnight(date) {
    date = new Date(date.getTime());
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Get the monday preceding (or on) the given date
 *
 * @param {Date} date
 * @returns {Date}
 */
export function previousMonday(date) {
    date = previousMidnight(date);
    while (date.getDay() !== 1) {
        date = addDays(date, -1);
    }
    return date;
}

/**
 * Add/subtract days to/from a date.  Note that the time of day is NOT preserved, because this may not be possible
 * to do during daylight saving changes.  The time will be reset to midnight.
 *
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
    // Note: It doesn't work to simply add 7 * 24 * 60 * 60 to the timestamp, since that wouldn't be correct during
    // daylight saving time transitions.
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        // This always works due to the smart rollover behavior
        date.getDate() + days,
    );
}

/**
 * Format a date in a sensible displayFormat for disaypling
 *
 * @param {Date} date
 * @returns {string}
 */
export function displayFormat(date) {
    let weekday = date.toLocaleDateString(undefined, {weekday: 'short'});
    let formattedDate = date.toLocaleDateString(undefined, {dateStyle: 'medium'});
    return `${weekday}, ${formattedDate}`;
}

/**
 * Format as ISO date string in local time zone
 *
 * @param {Date} date
 * @returns {string}
 */
export function isoDate(date) {
    let year = date.getUTCFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Test if dates are on two successive days in the local time zone.
 *
 * @param {Date} date1
 * @param {Date} date2
 *
 * @returns {boolean}
 */
export function isSuccessiveDays(date1, date2) {
    return addDays(date1, 1).getTime() === previousMidnight(date2).getTime();
}

/**
 * Test if dates are on the same day in the local time zone.
 *
 * @param {Date} date1
 * @param {Date} date2
 *
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
    return previousMidnight(date1).getTime() === previousMidnight(date2).getTime();
}

/**
 * @param {Date} date
 * @returns {boolean}
 */
export function isToday(date) {
    return previousMidnight(date).getTime() === previousMidnight(new Date()).getTime();
}
