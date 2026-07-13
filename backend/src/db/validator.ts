import type {Sequelize} from 'sequelize';
import {promises as fs} from 'fs';
import path from 'path';
import url from 'url';

// eslint-disable-next-line no-underscore-dangle
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function getAllTables(sequelize: Sequelize): Promise<Array<string>> {
    let rowsWrongType = await sequelize.getQueryInterface().showAllTables();
    // Type definitions are wrong here.
    let rows = rowsWrongType as unknown as Array<{tableName: string, schema: string}>;
    return rows.map(row => row.tableName);
}

export async function getReferenceCreateTableStatements(): Promise<Record<string, string>> {
    let createTableStatements: Record<string, string> = {};
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

function fixCreateTableSql(sql: string): string {
    sql = sql.replace(/ENGINE=InnoDB AUTO_INCREMENT=\d+/gu, 'ENGINE=InnoDB');
    sql = sql.replace(/ USING BTREE\b/gu, '');
    return `${sql}\n`;
}

export async function getCreateTableStatementsFromDb(sequelize: Sequelize): Promise<Record<string, string>> {
    if (sequelize.getDialect() !== 'mariadb') {
        throw new Error('Only supported for MariaDB');
    }

    let createTableStatements: Record<string, string> = {};
    for (let table of await getAllTables(sequelize)) {
        if (table === 'SequelizeMeta') {
            continue;
        }
        let [rows] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``) as [[Record<string, string>], unknown];
        let desc = rows[0]['Create Table'];
        desc = fixCreateTableSql(desc);
        createTableStatements[table] = desc;
    }
    return createTableStatements;
}
