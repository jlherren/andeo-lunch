'use strict';

const jsonWebToken = require('jsonwebtoken');
const {Model, DataTypes} = require('sequelize');
const Constants = require('../constants');

/**
 * @class Model
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @property {string} username
 * @property {string} [password]
 * @property {boolean} active Whether this user can log in, and can be added or removed from events
 * @property {boolean} hidden Whether the user should be displayed in a normal user listing
 * @property {string} name
 * @property {number} points
 * @property {number} money
 */
class User extends Model {
    /**
     * @param {string} secret
     * @param {object} [options]
     * @returns {Promise<string>}
     */
    generateToken(secret, options) {
        // sign() is supposed to return a promise, but it doesn't
        return Promise.resolve(jsonWebToken.sign({id: this.id}, secret, options));
    }

    /**
     * Map a user to an object suitable to return over the API
     *
     * @returns {ApiUser}
     */
    toApi() {
        return {
            id:       this.id,
            username: this.username,
            name:     this.name,
            balances: {
                points: this.points,
                money:  this.money,
            },
        };
    }
}

/**
 * @property {number} type
 * @property {Date} date
 * @property {string} name
 * @property {number} pointsCost
 * @property {number} moneyCost
 * @property {number|null} vegetarianMoneyFactor
 */
class Event extends Model {
    /**
     * Map a user to an object suitable to return over the API
     *
     * @returns {ApiEvent}
     */
    toApi() {
        return {
            id:      this.id,
            type:    Constants.EVENT_TYPE_NAMES[this.type],
            date:    this.date,
            name:    this.name,
            costs:   {
                points: this.pointsCost,
                money:  this.moneyCost,
            },
            factors: {
                [Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN]]: {
                    [Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY]]: this.vegetarianMoneyFactor,
                },
            },
        };
    }
}

/**
 * @property {string} label
 */
class ParticipationType extends Model {
}

/**
 * @property {number} user
 * @property {number} event
 * @property {number} type
 * @property {number} pointsCredited
 * @property {boolean} buyer
 */
class Participation extends Model {
    /**
     * Map an event participation to an object suitable to return over the API
     *
     * @returns {ApiParticipation}
     */
    toApi() {
        return {
            userId:   this.user,
            eventId:  this.event,
            type:     Constants.PARTICIPATION_TYPE_NAMES[this.type],
            credits:  {
                points: this.pointsCredited,
            },
            provides: {
                money: !!this.buyer,
            },
        };
    }
}

/**
 * @property {Date} date
 * @property {number} user
 * @property {number} contraUser
 * @property {number} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} event
 */
class Transaction extends Model {
    /**
     * Map a transaction to an object suitable to return over the API
     *
     * @returns {ApiTransaction}
     */
    toApi() {
        return {
            id:           this.id,
            date:         this.date,
            userId:       this.user,
            contraUserId: this.contraUser,
            eventId:      this.event,
            currency:     Constants.CURRENCY_NAMES[this.currency],
            amount:       this.amount,
            balance:      this.balance,
        };
    }
}

/**
 * @property {number} user
 * @property {Date} start
 * @property {Date} end
 */
class Presence extends Model {
}

exports.User = User;
exports.Event = Event;
exports.ParticipationType = ParticipationType;
exports.Participation = Participation;
exports.Transaction = Transaction;
exports.Presence = Presence;

/**
 * @param {Sequelize} sequelize
 */
exports.initModels = function initModels(sequelize) {
    /**
     * @param {number} len
     * @returns {any}
     */
    function ascii(len) {
        switch (sequelize.getDialect()) {
            case 'mysql':
                return `${DataTypes.STRING(len)} CHARSET ascii COLLATE ascii_bin`;
            default:
                return DataTypes.STRING(len);
        }
    }

    User.init({
        username: {type: ascii(64), allowNull: false, unique: true},
        password: {type: ascii(255), allowNull: true},
        name:     {type: DataTypes.STRING(64), allowNull: false},
        active:   {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        hidden:   {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        points:   {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        money:    {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
    }, {sequelize, modelName: 'user'});

    Event.init({
        type:                  {type: DataTypes.TINYINT, allowNull: false},
        date:                  {type: DataTypes.DATE, allowNull: false},
        name:                  {type: DataTypes.STRING(255), allowNull: false},
        pointsCost:            {type: DataTypes.DOUBLE, allowNull: false},
        moneyCost:             {type: DataTypes.DOUBLE, allowNull: false},
        vegetarianMoneyFactor: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1},
    }, {sequelize, modelName: 'event'});

    ParticipationType.init({
        label: {type: DataTypes.STRING(64), allowNull: false},
    }, {sequelize, modelName: 'participationType'});

    Participation.init({
        user:           {type: DataTypes.INTEGER, allowNull: false, unique: 'userEvent', references: {model: User}},
        event:          {type: DataTypes.INTEGER, allowNull: false, unique: 'userEvent', references: {model: Event}},
        type:           {type: DataTypes.INTEGER, allowNull: false, references: {model: ParticipationType}},
        pointsCredited: {type: DataTypes.DOUBLE, allowNull: false},
        buyer:          {type: DataTypes.BOOLEAN, allowNull: false},
    }, {sequelize, modelName: 'participation'});

    Transaction.init({
        date:       {type: DataTypes.DATE, allowNull: false},
        user:       {type: DataTypes.INTEGER, allowNull: false, references: {model: User}},
        contraUser: {type: DataTypes.INTEGER, allowNull: false, references: {model: User}},
        currency:   {type: DataTypes.TINYINT, allowNull: false},
        amount:     {type: DataTypes.DOUBLE, allowNull: false},
        balance:    {type: DataTypes.DOUBLE, allowNull: false},
        event:      {type: DataTypes.INTEGER, allowNull: false, references: {model: Event}},
    }, {
        sequelize,
        modelName: 'transaction',
        indexes:   [
            {
                name:   'dateId',
                fields: ['date', 'id'],
            },
        ],
    });

    Presence.init({
        user:  {type: DataTypes.INTEGER, allowNull: false, references: {model: User}},
        start: {type: DataTypes.DATEONLY, allowNull: true},
        end:   {type: DataTypes.DATEONLY, allowNull: true},
    }, {sequelize, modelName: 'presence'});
};
