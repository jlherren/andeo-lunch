import {promises as fs} from 'fs';
import path from 'path';
import url from 'url';

// eslint-disable-next-line no-underscore-dangle
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * @param {Sequelize} sequelize
 * @return {Promise<Array<string>>}
 */
async function getAllTables(sequelize) {
    let rows = await sequelize.getQueryInterface().showAllTables();
    return rows.map(row => row.tableName);
}

/**
 * @return {Promise<Object<string, string>>}
 */
export async function getReferenceCreateTableStatements() {
    let createTableStatements = {};
    let directory = path.resolve(path.join(__dirname, '..', '..', 'resources', 'tableSqls'));
    for (let entry of await fs.readdir(directory)) {
        if (!entry.endsWith('.sql')) {
            continue;
        }
        let table = entry.slice(0, -4);
        let filename = path.join(directory, entry);
        createTableStatements[table] = await fs.readFile(filename, 'utf-8');
    }
    return createTableStatements;
}

/**
 * @param {string} sql
 * @return {string}
 */
function fixCreateTableSql(sql) {
    sql = sql.replace(/ENGINE=InnoDB AUTO_INCREMENT=\d+/gu, 'ENGINE=InnoDB');
    sql = sql.replace(/ USING BTREE\b/gu, '');
    return `${sql}\n`;
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<Object<string, string>>}
 */
export async function getCreateTableStatementsFromDb(sequelize) {
    if (sequelize.getDialect() !== 'mariadb') {
        throw new Error('Only supported for MariaDB');
    }

    let createTableStatements = {};
    for (let table of await getAllTables(sequelize)) {
        if (table === 'SequelizeMeta') {
            continue;
        }
        let [rows] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``);
        let desc = rows[0]['Create Table'];
        desc = fixCreateTableSql(desc);
        createTableStatements[table] = desc;
    }
    return createTableStatements;
}
