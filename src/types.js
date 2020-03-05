// DB classes

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} password
 * @property {boolean} active
 * @property {boolean} hidden
 * @property {string} name
 * @property {number} currentPoints
 * @property {number} currentMoney
 * @property {Date} createDate
 */

/**
 * @typedef {Object} Transaction
 * @property {number} id
 * @property {Date} date
 * @property {number} user
 * @property {number} contraUser
 * @property {number} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} event
 * @property {Date} createDate
 */

/**
 * @typedef {Object} Event
 * @property {number} id
 * @property {number} currency
 * @property {Date} date
 * @property {string} name
 * @property {number} lunch
 * @property {number} pointsCost
 * @property {number} moneyCost
 * @property {Date} createDate
 */

/**
 * @typedef {Object} Attendance
 * @property {number} id
 * @property {number} user
 * @property {number} event
 * @property {number} type
 * @property {number} pointsCredited
 * @property {boolean} buyer
 * @property {Date} createDate
 */

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
 * @property {number} lunch
 * @property {{points: number, money: number}} costs
 */

/**
 * @typedef {Object} ApiAttendance
 * @property {number} id
 * @property {number} user
 * @property {number} event
 * @property {number} type
 * @property {number} pointsCredited
 * @property {boolean} buyer
 */
