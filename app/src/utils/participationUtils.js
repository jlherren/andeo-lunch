import {icons} from '@/plugins/icons';

/**
 * Get the icon for a participation type
 *
 * @param {string} participationType
 * @returns {string|null}
 */
export function icon(participationType) {
    switch (participationType) {
        case 'omnivorous':
            return icons.omnivorous;
        case 'vegetarian':
            return icons.vegetarian;
        case 'opt-out':
            return icons.optOut;
        case 'undecided':
            return icons.undecided;
        default:
            return null;
    }
}
