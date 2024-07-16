import {icons} from '@/plugins/icons';

/**
 * Get the icon for a participation type
 *
 * @param {string} participationType
 * @return {string|null}
 */
export function icon(participationType) {
    switch (participationType) {
        case 'omnivorous':
            return icons.omnivorous;
        case 'vegetarian':
            return icons.vegetarian;
        case 'opt-in':
            return icons.optIn;
        case 'opt-out':
            return icons.optOut;
        case 'undecided':
            return icons.undecided;
        default:
            return null;
    }
}

export const LUNCH_EVENT_PARTICIPATION_TYPES = [{
    id:   'omnivorous',
    name: 'Omni',
    icon: icons.omnivorous,
}, {
    id:   'vegetarian',
    name: 'Vegi',
    icon: icons.vegetarian,
}, {
    id:   'opt-out',
    name: 'Out',
    icon: icons.optOut,
}, {
    id:   'undecided',
    name: 'Undecided',
    icon: icons.undecided,
}];

export const SPECIAL_EVENT_PARTICIPATION_TYPES = [{
    id:   'opt-in',
    name: 'In',
    icon: icons.optIn,
}, {
    id:   'opt-out',
    name: 'Out',
    icon: icons.optOut,
}];
