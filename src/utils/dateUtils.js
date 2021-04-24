/**
 * Get the monday preceding (or on) the given date
 *
 * @param {Date} date
 * @returns {Date}
 */
export function getPreviousMonday(date) {
    // Clone date
    date = new Date(date.getTime());
    date.setHours(0, 0, 0, 0);
    while (date.getDay() !== 1) {
        date = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() - 1,
        );
    }
    return date;
}

/**
 * Add/subtract days to/from a date
 *
 * @param {Date} date
 * @param {number} days
 * @return {Date}
 */
export function addDays(date, days = 1) {
    // Note: It doesn't work to simply add 7 * 24 * 60 * 60, since that wouldn't be correct during daylight saving
    // time transitions.
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + days,
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds(),
    );
}
