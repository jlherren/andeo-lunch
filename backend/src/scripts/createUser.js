'use strict';

const chalk = require('chalk');

const Models = require('../db/models');
const Cli = require('../cli');
const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');
const AuthUtils = require('../authUtils');

/**
 * Create user
 *
 * @returns {Promise<void>}
 */
async function createUser() {
    console.log(chalk.bold('Creating new user'));

    let lunchMoney = new LunchMoney({config: await ConfigProvider.getMainConfig()});
    await lunchMoney.waitReady();
    let cli = new Cli();

    try {
        let username = await cli.question('Username: ');
        if (username === '') {
            throw new Error('Username cannot be empty');
        }
        let user = await Models.User.findOne({where: {username}});
        if (user) {
            throw new Error(`Username '${username}' exists already`);
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
        await Models.User.create({
            username,
            name,
            password: hashed,
            active:   true,
        });
        console.log(`User ${username} created successfully`);
    } catch (err) {
        console.error(err.message);
    }

    cli.close();
    await lunchMoney.close();
}

// noinspection JSIgnoredPromiseFromCall
createUser();
