'use strict';

const Models = require('../models');
const Cli = require('../cli');
const LunchMoney = require('../app');
const config = require('../config');

let lunchMoney = new LunchMoney({config: config.getMainConfig()});

lunchMoney.sequelizePromise.then(async sequelize => {
    let cli = new Cli();
    try {
        let username = await cli.question('User name: ');
        if (username === '') {
            throw new Error('Username cannot be empty');
        }
        let user = await Models.User.findOne({where: {username}});
        if (user) {
            throw new Error(`A user with username '${username}' exists already`);
        }
        let name = await cli.question('Display name: ');
        await Models.User.create({username, name, password: '', active: true});
        console.log(`User ${username} created successfully`);
    } catch (err) {
        console.error(err.message);
    }
    cli.close();
    await sequelize.close();
});
