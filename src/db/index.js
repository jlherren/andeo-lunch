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

    exports.sequelize = new Sequelize(options);
    await exports.sequelize.authenticate();

    Models.initModels(exports.sequelize);

    return exports.sequelize;
};
