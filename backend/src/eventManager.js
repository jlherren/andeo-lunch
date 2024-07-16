/**
 * Check whether the given date is editable by the user.
 *
 * @param {User} user
 * @param {Date} date
 * @return {boolean}
 */
export function userCanEditDate(user, date) {
    let maxPastDaysEdit = user.maxPastDaysEdit;
    if (maxPastDaysEdit === null) {
        return true;
    }

    let cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - maxPastDaysEdit);

    return cutoff.getTime() <= date.getTime();
}
