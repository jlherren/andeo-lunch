const axios = require('axios');
const MariaDB = require('mariadb');

/** @type {MariaDB.Connection|null} */
let dbConnection = null;

/**
 * Get a DB connection
 *
 * @returns {Promise<MariaDB.Connection>}
 */
async function getDb() {
    if (dbConnection === null) {
        dbConnection = await MariaDB.createConnection({
            host:     'localhost',
            port:     52476,
            database: 'andeolunchtest',
            user:     'andeolunchtest',
            password: 'andeolunchtest',
        });
    }

    return dbConnection;
}

/**
 * Purge the DB and re-run the migrations
 *
 * @param {object} config
 * @returns {Promise<null>}
 */
module.exports.dbPurge = async function dbPurge(config) {
    let connection = await getDb();
    await connection.query('DROP DATABASE andeolunchtest');
    await connection.query('CREATE DATABASE andeolunchtest');
    // Dropping the database will reset the 'current db'
    await connection.query('USE andeolunchtest');
    await axios.get(`${config.baseUrl}/api/migrate`);
    return null;
};

/**
 * Run an SQL statement on the DB
 *
 * @param {string} sql
 * @returns {Promise<null>}
 */
module.exports.dbSql = async function dbSql(sql) {
    let connection = await getDb();
    await connection.query(sql);
    return null;
};
