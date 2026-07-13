import * as Constants from '../../src/constants.ts';
import * as TransactionRebuilder from '../../src/transactionRebuilder.js';
import {Absence, Event, Grocery, Lunch, Participation, Transaction, User} from '../../src/db/models.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';

/** @type {AndeoLunch|null} */
let andeoLunch = null;

describe('Initialize', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('Creates a sane empty DB', async () => {
        let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
        expect(systemUser).to.be.instanceOf(User);
        expect(systemUser).to.containSubset({hidden: true, active: false, points: 0, money: 0});

        let andeoUser = await User.findOne({where: {username: Constants.ANDEO_USER_USERNAME}});
        expect(andeoUser).to.be.instanceOf(User);
        expect(andeoUser).to.containSubset({hidden: false, active: false, points: 0, money: 0});

        expect(await User.count()).to.equal(2);
        expect(await Event.count()).to.equal(0);
        expect(await Lunch.count()).to.equal(0);
        expect(await Absence.count()).to.equal(0);
        expect(await Grocery.count()).to.equal(0);
        expect(await Participation.count()).to.equal(0);
        expect(await Transaction.count()).to.equal(0);
    });

    it('Correctly rebuilds user balances on an empty DB', async () => {
        let sequelize = await andeoLunch.getSequelize();
        await sequelize.transaction(async dbTransaction => {
            await TransactionRebuilder.rebuildUserBalances(dbTransaction);
        });
        let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
        expect(systemUser.points).to.equal(0);
        expect(systemUser.money).to.equal(0);
    });
});
