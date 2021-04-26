
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
 * @property {number} userId
 * @property {number} contraUserId
 * @property {number} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} eventId
 */

/**
 * @typedef {Object} ApiEvent
 * @property {number} id
 * @property {string} type
 * @property {Date} date
 * @property {string} name
 * @property {{points: number, money: number}} costs
 * @property {{vegetarian: number}} factors
 */

/**
 * @typedef {Object} ApiParticipation
 * @property {number} userId
 * @property {number} eventId
 * @property {string} type
 * @property {{points: number, money: number}} credits
 */
