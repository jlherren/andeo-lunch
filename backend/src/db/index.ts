import * as Models from './models.ts';
import {ConnectionRefusedError, Sequelize} from 'sequelize';
import {SequelizeStorage, Umzug} from 'umzug';
import {promises as fs} from 'fs';
import path from 'path';
import url from 'url';

const MAX_CONNECTION_ATTEMPTS = 20;

const ENV_FALLBACKS = {
    host:     'MARIADB_HOST',
    port:     'MARIADB_PORT',
    database: 'MARIADB_DATABASE',
    username: 'MARIADB_USER',
    password: 'MARIADB_PASSWORD',
};

// eslint-disable-next-line no-underscore-dangle
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

type DbConnectOptions = {
    migrate?: boolean;
    quiet?: boolean;
};

export async function connect({migrate = true, quiet = false}: DbConnectOptions, sequelizeOptions: Record<string, unknown>): Promise<Sequelize> {
    sequelizeOptions = {
        logging: sequelizeOptions.logSql ? console.log : false,
        define:  {
            freezeTableName: true,
            charset:         'utf8mb4',
            collate:         'utf8mb4_general_ci',
        },
        ...sequelizeOptions,
    };

    // Use environment for missing config
    for (let [confKey, envName] of Object.entries(ENV_FALLBACKS)) {
        if (sequelizeOptions[confKey] !== undefined) {
            continue;
        }
        let value = process.env[envName];
        if (value !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}`);
            sequelizeOptions[confKey] = value;
            continue;
        }
        envName += '_FILE';
        value = process.env[envName];
        if (value !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}`);
            let str = await fs.readFile(value, 'utf-8');
            sequelizeOptions[confKey] = str.trim();
        }
    }

    let sequelize = new Sequelize(sequelizeOptions);

    for (let attempt = 0; attempt < MAX_CONNECTION_ATTEMPTS; attempt++) {
        try {
            await sequelize.authenticate();
        } catch (err) {
            if (err instanceof ConnectionRefusedError) {
                // Try again, the MariaDB docker image usually takes a while when started for the first time
                console.error(`Failed to connect to the database (attempt ${attempt + 1}/${MAX_CONNECTION_ATTEMPTS}): ${err.message}`);
                if (attempt + 1 >= MAX_CONNECTION_ATTEMPTS) {
                    throw err;
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                throw err;
            }
        }
    }

    // Models need to be initialized before the migrations, since migrations may want to insert data.
    Models.initModels(sequelize);

    if (migrate) {
        await applyMigrations(sequelize, quiet);
    }

    return sequelize;
}

/**
 * Apply migrations to the DB
 */
export async function applyMigrations(sequelize: Sequelize, quiet: boolean): Promise<void> {
    // Apply migrations
    const umzug = new Umzug({
        migrations: {
            // glob requires forward slashes even on windows.
            glob: path.join(__dirname, '../../migrations/????-??-?? ?? *.js').replaceAll('\\', '/'),
        },
        context:    sequelize,
        storage:    new SequelizeStorage({sequelize}),
        logger:     quiet ? undefined : console,
    });
    await umzug.up();
}
