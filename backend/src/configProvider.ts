import {z} from 'zod';
import MariaDB from 'mariadb';
import {promises as fs} from 'fs';
import path from 'path';
import url from 'url';

// Any string understood by package 'ms'.
const DEFAULT_TOKEN_EXPIRY = '60 days';

// eslint-disable-next-line no-underscore-dangle
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const databaseSchema = z.looseObject({
    dialect:  z.string().min(1),
    host:     z.string().min(1).optional(),
    port:     z.int().min(1).max(65535).optional(),
    database: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    storage:  z.string().min(1).optional(),
});

const configSchema = z.looseObject({
    database:    databaseSchema,
    port:        z.int().nullable().optional().default(3000),
    bind:        z.string().optional().default('127.0.0.1'),
    tokenExpiry: z.string().min(1).optional().default(DEFAULT_TOKEN_EXPIRY),
    lag:         z.number().optional().default(0),
    frontendUrl: z.string().optional(),
});

type Config = z.output<typeof configSchema>;

function validateConfig(config: unknown): Config {
    return configSchema.parse(config);
}

/**
 * Return the main configuration file (config.json)
 */
export async function getMainConfig(): Promise<Config> {
    let fullPath = path.resolve(`${__dirname}/../config.json`);
    try {
        let fileContent = await fs.readFile(fullPath);
        let config = JSON.parse(fileContent.toString('utf-8'));
        return validateConfig(config);
    } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`No configuration file found at ${fullPath}!  Please read README.md first`);
        }
        throw err;
    }
}

/**
 * Return the testing configuration, either using a MariaDB database from the environment, or an
 * in-memory sqlite database.
 */
export async function getTestConfig(): Promise<Config> {
    let database = undefined;

    if (process.env.TEST_DB === 'mariadb') {
        if (!process.env.TEST_DB_NAME) {
            throw new Error('Running MariaDB tests requires TEST_DB_* environment variables to be set');
        }
        database = {
            dialect:  'mariadb',
            host:     process.env.TEST_DB_HOST,
            port:     process.env.TEST_DB_PORT ? parseInt(process.env.TEST_DB_PORT, 10) : undefined,
            database: process.env.TEST_DB_NAME,
            username: process.env.TEST_DB_USERNAME,
            password: process.env.TEST_DB_PASSWORD,
        };
    } else {
        // Otherwise use an in-memory SQLite DB
        database = {
            dialect: 'sqlite',
            storage: ':memory:',
        };
    }

    let config = configSchema.parse({
        frontendUrl: 'https://app.example.com',
        // null means find a free port.
        port:        null,
        bind:        '127.0.0.1',
        tokenExpiry: DEFAULT_TOKEN_EXPIRY,
        database,
    });

    if (config.database.dialect === 'mariadb') {
        // Truncate the DB first
        const connection = await MariaDB.createConnection({
            host:     config.database.host,
            port:     config.database.port,
            database: config.database.database,
            user:     config.database.username,
            password: config.database.password,
        });
        await connection.query(`DROP DATABASE ${config.database.database}`);
        await connection.query(`CREATE DATABASE ${config.database.database}`);
        await connection.end();
    }

    return config;
}
