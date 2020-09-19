'use strict';

const Models = require('../db/models');
const Cli = require('../cli');
const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');
const AuthUtils = require('../authUtils');

let lunchMoney = new LunchMoney({config: ConfigProvider.getMainConfig()});

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
        let password1 = await cli.password('Password: ');
        if (password1 === '') {
            throw new Error('Password cannot be empty');
        }
        let password2 = await cli.password('Confirm password: ');
        if (password1 !== password2) {
            throw new Error('Password confirmation failed');
        }
        let name = await cli.question('Display name: ');
        let hashed = await AuthUtils.hashPassword(password1);
        await Models.User.create({username, name, password: hashed, active: true});
        console.log(`User ${username} created successfully`);
    } catch (err) {
        console.error(err.message);
    }
    cli.close();
    await sequelize.close();
});
