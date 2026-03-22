import type {User} from './db/models.ts';

/**
 * Check whether the given date is editable by the user.
 */
export function userCanEditDate(user: User, date: Date): boolean {
    let maxPastDaysEdit = user.maxPastDaysEdit;
    if (maxPastDaysEdit === null) {
        return true;
    }

    let cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - maxPastDaysEdit);

    return cutoff.getTime() <= date.getTime();
}
