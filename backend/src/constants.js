'use strict';

const Utils = require('./utils');

exports.SYSTEM_USER_USERNAME = 'system';
exports.ANDEO_USER_USERNAME = 'andeo';
exports.EPSILON = 1e-6;

exports.CURRENCIES = Object.freeze({
    POINTS: 1,
    MONEY:  2,
});
exports.CURRENCY_NAMES = Object.freeze({
    [exports.CURRENCIES.POINTS]: 'points',
    [exports.CURRENCIES.MONEY]:  'money',
});
exports.CURRENCY_IDS = Object.freeze(Utils.objectFlip(exports.CURRENCY_NAMES, true));

exports.EVENT_TYPES = Object.freeze({
    LUNCH:    1,
    SPECIAL:  2,
    LABEL:    3,
    TRANSFER: 4,
});
exports.EVENT_TYPE_NAMES = Object.freeze({
    [exports.EVENT_TYPES.LUNCH]:    'lunch',
    [exports.EVENT_TYPES.SPECIAL]:  'special',
    [exports.EVENT_TYPES.LABEL]:    'label',
    [exports.EVENT_TYPES.TRANSFER]: 'transfer',
});
exports.EVENT_TYPE_IDS = Object.freeze(Utils.objectFlip(exports.EVENT_TYPE_NAMES, true));

exports.PARTICIPATION_TYPES = Object.freeze({
    OMNIVOROUS: 1,
    VEGETARIAN: 2,
    OPT_IN:     7,
    OPT_OUT:    8,
    UNDECIDED:  9,
});
exports.PARTICIPATION_TYPE_NAMES = Object.freeze({
    [exports.PARTICIPATION_TYPES.OMNIVOROUS]: 'omnivorous',
    [exports.PARTICIPATION_TYPES.VEGETARIAN]: 'vegetarian',
    [exports.PARTICIPATION_TYPES.OPT_IN]:     'opt-in',
    [exports.PARTICIPATION_TYPES.OPT_OUT]:    'opt-out',
    [exports.PARTICIPATION_TYPES.UNDECIDED]:  'undecided',
});
exports.PARTICIPATION_TYPE_IDS = Object.freeze(Utils.objectFlip(exports.PARTICIPATION_TYPE_NAMES, true));

exports.EVENT_TYPE_VALID_PARTICIPATIONS = Object.freeze({
    [exports.EVENT_TYPES.LUNCH]:   [
        // First one is the default
        exports.PARTICIPATION_TYPES.UNDECIDED,
        exports.PARTICIPATION_TYPES.OMNIVOROUS,
        exports.PARTICIPATION_TYPES.VEGETARIAN,
        exports.PARTICIPATION_TYPES.OPT_OUT,
    ],
    [exports.EVENT_TYPES.SPECIAL]: [
        // First one is the default
        exports.PARTICIPATION_TYPES.OPT_OUT,
        exports.PARTICIPATION_TYPES.OPT_IN,
    ],
});
