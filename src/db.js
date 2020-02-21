'use strict';

const config = require('../config');
const mysql = require('mysql2/promise');
const util = require('./util');

const POOL_CONFIG = {
    host: config.database.host || 'localhost',
    user: config.database.user || 'lunchmoney',
    password: config.database.password,
    database: config.database.name || 'lunchmoney',
    connectionLimit: config.database.connectionLimit || 10,
    namedPlaceholders: true,
};

const pool = mysql.createPool(POOL_CONFIG);
let transactionConnection = null;

/**
 * Returns the connection of the running transaction or the pool if no transaction
 * is active
 *
 * @return {Connection|PromisePool}
 */
function connection() {
    return transactionConnection || pool;
}

async function query(sql, params, key) {
    let [rows, cols] = await connection().query(sql, params);
    if (key == null) {
        return rows;
    } else {
        return util.toMap(rows, key);
    }
}

async function one(sql, params) {
    let rows = await query(sql, params);
    if (rows.length === 1) {
        return rows[0];
    }
    if (rows.length === 0) {
        return null;
    }
    throw new Error('Non-unique result');
}

async function column(sql, params) {
    let rows = await connection().query(sql, params);
    return rows.map(row => {
        // noinspection LoopStatementThatDoesntLoopJS
        for (let key in row) {
            return row[key];
        }
        throw new Error('No column defined in column()');
    });
}

async function scalar(sql, params) {
    let row = await one(sql, params);
    if (row === null) {
        return null;
    }
    // noinspection LoopStatementThatDoesntLoopJS
    for (let key in row) {
        return row[key];
    }
    throw new Error('No column defined in scalar()');
}

/**
 * @param {string} table
 * @param {number} id
 * @param {string} [where] Additional where condition string
 * @return {Promise<*|null|undefined>}
 */
async function get(table, id, where) {
    if (where !== undefined) {
        where = ` AND (${where})`;
    } else {
        where = '';
    }
    return one(`SELECT * FROM ${table} WHERE id = :id${where}`, {id: id});
}

async function insert(table, rows) {
    if (!Array.isArray(rows)) {
        rows = [rows];
    }
    let ret = null;
    // TODO: Optimize this into a multi-insert statement
    for (let row of rows) {
        let cols = Object.keys(row);
        let qs = new Array(cols.length).fill('?');
        let params = Object.values(row);
        ret = await connection().execute(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${qs.join(', ')})`, params);
    }
    return ret;
}

async function update(table, rows) {
    if (!Array.isArray(rows)) {
        rows = [rows];
    }
    let ret = null;
    for (let row of rows) {
        let set = [];
        for (let key in row) {
            if (key !== 'id') {
                set.push(`${key} = :${key}`);
            }
        }
        ret = await connection().execute(`UPDATE ${table} SET ${set.join(', ')} WHERE id = :id`, row);
    }
    return ret;
}

async function execute(sql, params) {
    return await connection().execute(sql, params);
}

/**
 * @param {function(connection: Connection)} executor
 * @return {Promise<any>}
 */
async function transaction(executor) {
    if (transactionConnection) {
        throw new Error('Cannot nest transactions');
    }

    try {
        transactionConnection = await pool.getConnection();
        return await executor(transactionConnection);
    } finally {
        if (transactionConnection) {
            transactionConnection.release();
        }
        transactionConnection = null;
    }
}

/**
 * Whether a transaction is active
 *
 * @return {boolean}
 */
function isTransaction() {
    return !!transactionConnection;
}

exports.connection = connection;
exports.pool = pool;
exports.query = query;
exports.one = one;
exports.scalar = scalar;
exports.get = get;
exports.insert = insert;
exports.update = update;
exports.execute = execute;
exports.transaction = transaction;
exports.isTransaction = isTransaction;
