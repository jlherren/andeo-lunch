import MariaDB from 'mariadb';
import axios from 'axios';

/** @type {MariaDB.Connection|null} */
let dbConnection = null;

/**
 * Get a DB connection
 *
 * @returns {Promise<MariaDB.Connection>}
 */
async function getDb() {
    if (dbConnection === null) {
        // When the docker container has just started, MariaDB is sometimes not ready yet.
        let attempts = 0;
        while (true) {
            try {
                attempts++;
                dbConnection = await MariaDB.createConnection({
                    host:     'localhost',
                    port:     52476,
                    database: 'andeolunchtest',
                    user:     'andeolunchtest',
                    password: 'andeolunchtest',
                });
                if (attempts > 1) {
                    // eslint-disable-next-line no-console
                    console.log(`DB connection succeeded on attempt ${attempts}`);
                }
                break;
            } catch (err) {
                if (attempts >= 5) {
                    throw err;
                }
                // eslint-disable-next-line no-console
                console.log(`DB connection failed on attempt ${attempts}, will try again in a second`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    return dbConnection;
}

/**
 * Purge the DB and re-run the migrations
 *
 * @param {object} config
 * @returns {Promise<null>}
 */
export async function dbPurge(config) {
    let connection = await getDb();
    await connection.query('DROP DATABASE andeolunchtest');
    await connection.query('CREATE DATABASE andeolunchtest');
    // Dropping the database will reset the 'current db'
    await connection.query('USE andeolunchtest');
    await axios.get(`${config.baseUrl}/api/migrate`);
    return null;
}

/**
 * Run an SQL statement on the DB
 *
 * @param {string} sql
 * @returns {Promise<null>}
 */
export async function dbSql(sql) {
    let connection = await getDb();
    await connection.query(sql);
    return null;
}
