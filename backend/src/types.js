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
 * @property {string} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} eventId
 * @property {string} [eventName]
 */

/**
 * @typedef {Object} ApiEvent
 * @property {number} id
 * @property {string} type
 * @property {Date} date
 * @property {string} name
 * @property {{points: number, money: number}} costs
 * @property {{vegetarian: number}} factors
 * @property {Array<ApiTransfer>} [transfers]
 * @property {string} [comment]
 * @property {number|null} participationFlatRate
 */

/**
 * @typedef {Object} ApiParticipation
 * @property {number} userId
 * @property {number} eventId
 * @property {string} type
 * @property {{points: number, money: number}} credits
 * @property {{money: number}} factors
 */

/**
 * @typedef {Object} ApiAudit
 * @property {number} id
 * @property {Date} date
 * @property {string} type
 * @property {number} actingUserId
 * @property {string} actingUserName
 * @property {number|null} affectedUserId
 * @property {string|null} affectedUserName
 * @property {number|null} eventId
 * @property {string|null} eventName
 * @property {number|null} groceryId
 * @property {string|null} groceryName
 * @property {Date|null} eventDate
 * @property {object|null} values
 */

/**
 * @typedef {Object} ApiAbsence
 * @property {number} id
 * @property {number} userId
 * @property {Date} start
 * @property {Date} end
 */

/**
 * @typedef {Object} ApiTransfer
 * @property {number} id
 * @property {number} senderId
 * @property {number} recipientId
 * @property {string} currency
 * @property {number} amount
 * @property {number} eventId
 * @property {string} [eventName]
 */

/**
 * @typedef {Object} ApiGrocery
 * @property {number} id
 * @property {string} label
 * @property {boolean} checked
 */
