'use strict';

const Utils = require('./utils');

exports.SYSTEM_USER_USERNAME = 'system';
exports.EPSILON = 1e-6;

exports.CURRENCIES = Object.freeze({
    POINTS: 1,
    MONEY:  2,
});
exports.CURRENCY_NAMES = Object.freeze({
    [exports.CURRENCIES.POINTS]: 'points',
    [exports.CURRENCIES.MONEY]:  'money',
});
exports.CURRENCY_IDS = Object.freeze(Utils.objectFlip(exports.CURRENCY_NAMES));

exports.EVENT_TYPES = Object.freeze({
    LUNCH:       1,
    EVENT:       2,
    LABEL:       3,
    TRANSACTION: 10,
});
exports.EVENT_TYPE_NAMES = Object.freeze({
    [exports.EVENT_TYPES.LUNCH]:       'lunch',
    [exports.EVENT_TYPES.EVENT]:       'event',
    [exports.EVENT_TYPES.LABEL]:       'label',
    [exports.EVENT_TYPES.TRANSACTION]: 'transaction',
});
exports.EVENT_TYPE_IDS = Object.freeze(Utils.objectFlip(exports.EVENT_TYPE_NAMES));

exports.PARTICIPATION_TYPES = Object.freeze({
    NORMAL:     1,
    VEGETARIAN: 2,
    NONE:       9,
});
exports.PARTICIPATION_TYPE_NAMES = Object.freeze({
    [exports.PARTICIPATION_TYPES.NORMAL]:     'normal',
    [exports.PARTICIPATION_TYPES.VEGETARIAN]: 'vegetarian',
    [exports.PARTICIPATION_TYPES.NONE]:       'none',
});
exports.PARTICIPATION_TYPE_IDS = Object.freeze(Utils.objectFlip(exports.PARTICIPATION_TYPE_NAMES));
