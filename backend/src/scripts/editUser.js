'use strict';

const chalk = require('chalk');
const {sprintf} = require('sprintf-js');

const Models = require('../db/models');
const Cli = require('../cli');
const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');
const AuthUtils = require('../authUtils');

/**
 * Edit user
 *
 * @returns {Promise<void>}
 */
async function editUser() {
    console.log(chalk.bold('Edit user'));

    let lunchMoney = new LunchMoney({config: await ConfigProvider.getMainConfig()});
    await lunchMoney.waitReady();
    let cli = new Cli();

    try {
        let users = await Models.User.findAll({order: [['id', 'ASC']]});
        console.log('\nID  Username          Display name');
        for (let user of users) {
            console.log(sprintf('%-2d  %-16s  %s', user.id, user.username, user.name));
        }
        console.log('');

        let userId = parseInt(await cli.question('Select user: '), 10);
        let user = users.find(u => u.id === userId);

        if (!user) {
            throw new Error('Invalid user');
        }

        console.log('');
        let name = await cli.question('New display name (leave blank to not change): ');
        if (name !== '') {
            user.name = name;
            await user.save();
            console.log('Display name updated');
        }

        console.log('');
        let password = await cli.password('Enter new password (leave blank to not change): ');
        if (password !== '') {
            let confirm = await cli.password('Confirm new password: ');
            if (password !== confirm) {
                throw new Error('Passwords do not match');
            }
            user.password = await AuthUtils.hashPassword(password);
            await user.save();
            console.log('Password updated');
        }
    } catch (err) {
        console.error(err.message);
    }

    cli.close();
    await lunchMoney.close();
}

// noinspection JSIgnoredPromiseFromCall
editUser();
