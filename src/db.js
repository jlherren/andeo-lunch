'use strict';

const {Sequelize} = require('sequelize');
const Models = require('./models');

/**
 * @param {Object<string, any>} options
 * @returns {Promise<Sequelize>}
 */
exports.connect = async function connect(options) {
    options = {
        logging: false,
        define:  {
            freezeTableName: true,
            charset:         'utf8mb4',
            collate:         'utf8mb4_general_ci',
        },
        ...options,
    };

    let sequelize = new Sequelize(options);
    await sequelize.authenticate();

    Models.initModels(sequelize);

    return sequelize;
};
