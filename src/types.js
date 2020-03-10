
// Api classes

/**
 * @typedef {Object} ApiUser
 * @property {number} id
 * @property {string} name
 * @property {{points: number, money: number}} balances
 */

/**
 * @typedef {Object} ApiTransaction
 * @property {number} id
 * @property {Date} date
 * @property {number} user
 * @property {number} contraUser
 * @property {number} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} event
 */

/**
 * @typedef {Object} ApiEvent
 * @property {number} id
 * @property {number} type
 * @property {Date} date
 * @property {string} name
 * @property {{points: number, money: number}} costs
 * @property {number|null} vegetarianMoneyFactor
 */

/**
 * @typedef {Object} ApiParticipation
 * @property {number} user
 * @property {number} event
 * @property {number} type
 * @property {number} pointsCredited
 * @property {boolean} buyer
 */
