'use strict';

const chalk = require('chalk');
const {sprintf} = require('sprintf-js');

const Models = require('../db/models');
const Cli = require('../cli');
const AndeoLunch = require('../andeoLunch');
const ConfigProvider = require('../configProvider');
const AuthUtils = require('../authUtils');

/**
 * Edit user
 *
 * @returns {Promise<void>}
 */
async function editUser() {
    console.log(chalk.bold('Edit user'));

    let andeoLunch = new AndeoLunch({config: await ConfigProvider.getMainConfig()});
    await andeoLunch.waitReady();
    let cli = new Cli();

    try {
        let users = await Models.User.findAll({order: [['id', 'ASC']]});
        console.log('\nID  Act  Username          Display name');
        for (let user of users) {
            console.log(sprintf('%-2d  %-3s  %-16s  %s', user.id, user.active ? 'Y' : 'N', user.username, user.name));
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

        console.log('');
        let prompt = user.active ? 'Deactivate user?' : 'Activate user?';
        if (await cli.question(prompt + ' (y/N)') === 'y') {
            user.active = !user.active;
            await user.save();
            console.log('User updated');
        }
    } catch (err) {
        console.error(err.message);
    }

    cli.close();
    await andeoLunch.close();
}

// noinspection JSIgnoredPromiseFromCall
editUser();
