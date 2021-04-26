/**
 * Get the midnight preceding (or on) the given date
 *
 * @param {Date} date
 * @return {Date}
 */
export function getPreviousMidnight(date) {
    date = new Date(date.getTime());
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

/**
 * Get the monday preceding (or on) the given date
 *
 * @param {Date} date
 * @returns {Date}
 */
export function getPreviousMonday(date) {
    // Clone date
    date = new Date(date.getTime());
    date.setUTCHours(0, 0, 0, 0);
    while (date.getUTCDay() !== 1) {
        date = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() - 1,
        ));
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
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + days,
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds(),
    ));
}

/**
 * @param {Date} date
 * @return {string}
 */
export function format(date) {
    // For strange reasons it's not possible to have the weekday added directly
    return date.toLocaleDateString('en-US', {timeZone: 'UTC', weekday: 'short'})
           + ', ' + date.toLocaleDateString('en-US', {timeZone: 'UTC', dateStyle: 'medium'});
}
