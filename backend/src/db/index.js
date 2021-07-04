'use strict';

const {Sequelize} = require('sequelize');
const Models = require('./models');

/** @type {Sequelize|null} */
exports.sequelize = null;

/**
 * @param {Object<string, any>} options
 * @returns {Promise<Sequelize>}
 */
exports.connect = async function connect(options) {
    options = {
        logging: options.logSql ? console.log : false,
        define:  {
            freezeTableName: true,
            charset:         'utf8mb4',
            collate:         'utf8mb4_general_ci',
        },
        ...options,
    };

    // Use environment for missing config
    if (options?.database === undefined) {
        options.database = process.env.MARIADB_DATABASE;
    }
    if (options?.username === undefined) {
        options.username = process.env.MARIADB_USER;
    }
    if (options?.password === undefined) {
        options.password = process.env.MARIADB_PASSWORD;
    }

    exports.sequelize = new Sequelize(options);
    await exports.sequelize.authenticate();

    Models.initModels(exports.sequelize);

    return exports.sequelize;
};
