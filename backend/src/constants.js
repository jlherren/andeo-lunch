import * as Utils from './utils.js';

export const SYSTEM_USER_USERNAME = 'system';
export const ANDEO_USER_USERNAME = 'andeo';
export const EPSILON = 1e-6;

export const CURRENCIES = Object.freeze({
    POINTS: 1,
    MONEY:  2,
});
export const CURRENCY_NAMES = Object.freeze({
    [CURRENCIES.POINTS]: 'points',
    [CURRENCIES.MONEY]:  'money',
});
export const CURRENCY_IDS = Object.freeze(Utils.objectFlip(CURRENCY_NAMES, true));

export const EVENT_TYPES = Object.freeze({
    LUNCH:    1,
    SPECIAL:  2,
    LABEL:    3,
    TRANSFER: 4,
});
export const EVENT_TYPE_NAMES = Object.freeze({
    [EVENT_TYPES.LUNCH]:    'lunch',
    [EVENT_TYPES.SPECIAL]:  'special',
    [EVENT_TYPES.LABEL]:    'label',
    [EVENT_TYPES.TRANSFER]: 'transfer',
});
export const EVENT_TYPE_IDS = Object.freeze(Utils.objectFlip(EVENT_TYPE_NAMES, true));

export const PARTICIPATION_TYPES = Object.freeze({
    OMNIVOROUS: 1,
    VEGETARIAN: 2,
    OPT_IN:     7,
    OPT_OUT:    8,
    UNDECIDED:  9,
});
export const PARTICIPATION_TYPE_NAMES = Object.freeze({
    [PARTICIPATION_TYPES.OMNIVOROUS]: 'omnivorous',
    [PARTICIPATION_TYPES.VEGETARIAN]: 'vegetarian',
    [PARTICIPATION_TYPES.OPT_IN]:     'opt-in',
    [PARTICIPATION_TYPES.OPT_OUT]:    'opt-out',
    [PARTICIPATION_TYPES.UNDECIDED]:  'undecided',
});
export const PARTICIPATION_TYPE_IDS = Object.freeze(Utils.objectFlip(PARTICIPATION_TYPE_NAMES, true));

export const EVENT_TYPE_VALID_PARTICIPATIONS = Object.freeze({
    [EVENT_TYPES.LUNCH]:   [
        // First one is the default
        PARTICIPATION_TYPES.UNDECIDED,
        PARTICIPATION_TYPES.OMNIVOROUS,
        PARTICIPATION_TYPES.VEGETARIAN,
        PARTICIPATION_TYPES.OPT_OUT,
    ],
    [EVENT_TYPES.SPECIAL]: [
        // First one is the default
        PARTICIPATION_TYPES.OPT_OUT,
        PARTICIPATION_TYPES.OPT_IN,
    ],
});
