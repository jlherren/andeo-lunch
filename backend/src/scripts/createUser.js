'use strict';

const chalk = require('chalk');

const Models = require('../db/models');
const Cli = require('../cli');
const AndeoLunch = require('../andeoLunch');
const ConfigProvider = require('../configProvider');
const AuthUtils = require('../authUtils');

/**
 * Create user
 *
 * @returns {Promise<void>}
 */
async function createUser() {
    console.log(chalk.bold('Creating new user'));

    let andeoLunch = new AndeoLunch({config: await ConfigProvider.getMainConfig()});
    await andeoLunch.waitReady();
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
        user = await Models.User.create({
            username,
            name,
            active: true,
        });
        await Models.UserPassword.create({
            user:     user.id,
            password: hashed,
        });
        console.log(`User ${username} created successfully`);
    } catch (err) {
        console.error(err.message);
    }

    cli.close();
    await andeoLunch.close();
}

// noinspection JSIgnoredPromiseFromCall
createUser();
