import * as Models from './models.js';
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

/**
 * @param {object} options
 * @param {boolean} [options.migrate]
 * @param {boolean} [options.quiet]
 * @param {Object<string, any>} sequelizeOptions
 * @return {Promise<Sequelize>}
 */
export async function connect(options, sequelizeOptions) {
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
    for (let confKey in ENV_FALLBACKS) {
        if (sequelizeOptions[confKey] !== undefined) {
            continue;
        }
        let envName = ENV_FALLBACKS[confKey];
        if (process.env[envName] !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}`);
            sequelizeOptions[confKey] = process.env[envName];
            continue;
        }
        if (process.env[`${envName}_FILE`] !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}_FILE`);
            let str = await fs.readFile(process.env[`${envName}_FILE`], 'utf-8');
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

    if (options.migrate) {
        await applyMigrations(sequelize, options.quiet);
    }

    return sequelize;
}

/**
 * Apply migrations to the DB
 *
 * @param {Sequelize} sequelize
 * @param {boolean} quiet
 * @return {Promise<void>}
 */
export async function applyMigrations(sequelize, quiet) {
    // Apply migrations
    const umzug = new Umzug({
        migrations: {
            // glob requires forward slashes even on windows.
            glob:    path.join(__dirname, '../../migrations/????-??-?? ?? *.js').replaceAll('\\', '/'),
            // Custom resolver necessary at the moment, because Jest confuses Umzug https://github.com/jestjs/jest/issues/15185
            resolve: params => {
                const getModule = () => import(`file:///${params.path}`);
                return {
                    name: params.name,
                    path: params.path,
                    up:   async upParams => (await getModule()).up(upParams),
                    down: async downParams => (await getModule()).down(downParams),
                };
            },
        },
        context:    sequelize,
        storage:    new SequelizeStorage({sequelize}),
        logger:     quiet ? undefined : console,
    });
    await umzug.up();
}
