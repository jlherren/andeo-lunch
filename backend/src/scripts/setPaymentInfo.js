'use strict';

const chalk = require('chalk');
const {sprintf} = require('sprintf-js');

const Models = require('../db/models');
const Cli = require('../cli');
const AndeoLunch = require('../andeoLunch');
const ConfigProvider = require('../configProvider');

/**
 * @returns {Promise<number|null>}
 */
async function fetchDefaultRecipient() {
    let config = await Models.Configuration.findOne({where: {name: 'payUp.defaultRecipient'}});
    return config ? parseInt(config.value, 10) : null;
}

/**
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function saveDefaultRecipient(userId) {
    await Models.Configuration.upsert({name: 'payUp.defaultRecipient', value: `${userId}`});
}

/**
 * @param {number} userId
 * @returns {Promise<string|null>}
 */
async function fetchPaymentInfo(userId) {
    let config = await Models.Configuration.findOne({where: {name: `paymentInfo.${userId}`}});
    return config?.value ?? null;
}

/**
 * @param {number} userId
 * @param {string} paymentInfo
 * @returns {Promise<void>}
 */
async function savePaymentInfo(userId, paymentInfo) {
    if (paymentInfo === '') {
        await Models.Configuration.destroy({where: {name: `paymentInfo.${userId}`}});
    } else {
        await Models.Configuration.upsert({name: `paymentInfo.${userId}`, value: paymentInfo});
    }
}

/**
 * Set payment information
 *
 * @returns {Promise<void>}
 */
async function setPaymentInfo() {
    console.log(chalk.bold('Update payment information'));

    let andeoLunch = new AndeoLunch({config: await ConfigProvider.getMainConfig()});
    await andeoLunch.waitReady();

    let cli = new Cli();
    try {
        let defaultRecipient = await fetchDefaultRecipient();
        let users = await Models.User.findAll({order: [['id', 'ASC']]});
        console.log('\nID  R  Username          Display name');
        for (let user of users) {
            let line = sprintf(
                '%-2d  %s  %-16s  %s',
                user.id,
                user.id === defaultRecipient ? '*' : ' ',
                user.username,
                user.name,
            );
            console.log(line);
        }
        console.log('');

        let userId = parseInt(await cli.question('Select user: '), 10);
        let user = users.find(u => u.id === userId);

        if (!user) {
            throw new Error('Invalid user');
        }

        let paymentInfo = await fetchPaymentInfo(userId);
        console.log('');
        if (paymentInfo !== null) {
            console.log('Current payment info:');
            console.log(paymentInfo);
        } else {
            console.log('No payment info currently set');
        }
        console.log('');

        console.log('Enter new payment information, leave empty to not change, enter "-" to delete');
        paymentInfo = await cli.question('New payment info: ');
        if (paymentInfo !== '') {
            if (paymentInfo === '-') {
                paymentInfo = '';
            }
            await savePaymentInfo(userId, paymentInfo);
            console.log('Payment info saved');
        }

        console.log('');
        if (await cli.question('Set as default recipient? [y/N] ') === 'y') {
            await saveDefaultRecipient(userId);
            console.log('Successfully saved as default recipient');
        }
    } catch (err) {
        console.error(err.message);
    }

    cli.close();
    await andeoLunch.close();
}

// noinspection JSIgnoredPromiseFromCall
setPaymentInfo();
