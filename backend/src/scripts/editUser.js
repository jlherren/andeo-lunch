'use strict';

const chalk = require('chalk');
const {sprintf} = require('sprintf-js');

const Models = require('../db/models');
const Cli = require('../cli');
const AndeoLunch = require('../andeoLunch');
const ConfigProvider = require('../configProvider');
const AuthUtils = require('../authUtils');

/**
 * @param {Cli} cli
 * @param {User} user
 * @returns {Promise<void>}
 */
async function editUser(cli, user) {
    while (true) {
        console.log('');
        console.log('Editing user', user.username);
        console.log('');
        console.log('ID  Option');
        console.log('1   Change display name');
        console.log('2   Change password');
        console.log(`3   ${user.active ? 'Deactivate' : 'Activate'} user`);
        console.log(`4   ${user.hidden ? 'Unhide' : 'Hide'} user`);
        console.log('x   Return to main menu');
        console.log('');

        let option = await cli.question('Select option ID: ');
        console.log('');

        if (option === '1') {
            let name = await cli.question('New display name (leave blank to not change): ');
            if (name !== '') {
                user.name = name;
                await user.save();
                console.log('Display name updated');
            }
        } else if (option === '2') {
            let userPassword = await Models.UserPassword.findOne({where: {user: user.id}});
            if (userPassword === null) {
                console.log('User does not have a password entity');
                continue;
            }
            let password = await cli.password('Enter new password (leave blank to not change): ');
            if (password !== '') {
                let confirm = await cli.password('Confirm new password: ');
                if (password !== confirm) {
                    throw new Error('Passwords do not match');
                }
                userPassword.password = await AuthUtils.hashPassword(password);
                userPassword.lastChange = new Date();
                await userPassword.save();
                console.log('Password updated');
            }
        } else if (option === '3') {
            user.active = !user.active;
            await user.save();
            console.log(`User ${user.username} is now ${user.active ? 'ACTIVE' : 'INACTIVE'}`);
        } else if (option === '4') {
            user.hidden = !user.hidden;
            await user.save();
            console.log(`User ${user.username} is now ${user.hidden ? 'HIDDEN' : 'NO LONGER HIDDEN'}`);
        } else if (option === 'x') {
            break;
        } else {
            console.error('Invalid option');
        }
    }
}

/**
 * @param {Cli} cli
 * @returns {Promise<void>}
 */
async function mainMenu(cli) {
    while (true) {
        let users = await Models.User.findAll({order: [['id', 'ASC']]});
        console.log('');
        console.log('ID   Active  Username          Display name');
        for (let user of users) {
            console.log(sprintf('%-3d  %-3s     %-16s  %s', user.id, user.active ? 'Y' : 'N', user.username, user.name));
        }
        console.log('x    Exit');
        console.log('');

        let option = await cli.question('Select user ID: ');
        console.log('');

        if (option === 'x') {
            break;
        }

        let userId = parseInt(option, 10);
        if (isNaN(userId)) {
            console.error('Invalid input');
            continue;
        }

        let user = users.find(u => u.id === userId);
        if (!user) {
            console.error('No such user');
            continue;
        }

        await editUser(cli, user);
    }
}

/**
 * Edit user
 *
 * @returns {Promise<void>}
 */
async function main() {
    console.log(chalk.bold('Edit user'));

    let andeoLunch = new AndeoLunch({config: await ConfigProvider.getMainConfig()});
    await andeoLunch.waitReady();
    let cli = new Cli();

    try {
        await mainMenu(cli);
    } catch (err) {
        console.error(err.message);
    }

    cli.close();
    await andeoLunch.close();
}

// noinspection JSIgnoredPromiseFromCall
main();
