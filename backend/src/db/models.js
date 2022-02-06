'use strict';

const jsonWebToken = require('jsonwebtoken');
const {Model, DataTypes} = require('sequelize');
const Constants = require('../constants');
const {ColumnHelper} = require('./columnHelper');

/**
 * @class Model
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @property {string} name
 * @property {string} value
 */
class Configuration extends Model {
}

/**
 * @property {string} username
 * @property {string} [password]
 * @property {Date|null} lastPasswordChange
 * @property {boolean} active Whether this user can log in, and can be added or removed from events
 * @property {boolean} hidden Whether the user should be displayed in a normal user listing
 * @property {string} name
 * @property {number} points
 * @property {number} money
 * @property {Object} settings
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
            name:     this.name,
            balances: {
                points: this.points,
                money:  this.money,
            },
        };
    }
}

class EventType extends Model {
}

/**
 * @property {number} type
 * @property {Date} date
 * @property {string} name
 * @property {Lunch} [Lunch]
 * @property {Array<Transfer>} [Transfers]
 */
class Event extends Model {
    /**
     * Map a user to an object suitable to return over the API
     *
     * @param {number} systemUserId
     * @returns {ApiEvent}
     */
    toApi(systemUserId) {
        return {
            id:        this.id,
            type:      Constants.EVENT_TYPE_NAMES[this.type],
            date:      this.date,
            name:      this.name,
            costs:     this.Lunch && {
                points: this.Lunch.pointsCost,
                money:  this.Lunch.moneyCost,
            },
            factors:   this.Lunch && {
                [Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN]]: {
                    [Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY]]: this.Lunch.vegetarianMoneyFactor,
                },
            },
            transfers: this.Transfers?.map(transfer => transfer.toApi(systemUserId)),
            comment:   this.Lunch?.comment,
        };
    }

    toSnapshot() {
        return {
            date:    this.date,
            name:    this.name,
            costs:   this.Lunch && {
                points: this.Lunch.pointsCost,
            },
            factors: this.Lunch && {
                [Constants.PARTICIPATION_TYPES.VEGETARIAN]: {
                    [Constants.CURRENCIES.MONEY]: this.Lunch.vegetarianMoneyFactor,
                },
            },
            comment: this.Lunch?.comment,
        };
    }
}

/**
 * @property {number} pointsCost
 * @property {number} moneyCost
 * @property {number|null} vegetarianMoneyFactor
 * @property {string|null} comment
 * @property {number} event
 * @property {Event} [Event]
 */
class Lunch extends Model {
}

/**
 * @property {number} event
 * @property {Event} [Event]
 * @property {number} sender
 * @property {User} [Sender]
 * @property {number} recipient
 * @property {User} [Recipient]
 * @property {number} currency
 * @property {number} amount
 */
class Transfer extends Model {
    /**
     * Map to an object suitable to return over the API
     *
     * @param {number} systemUserId
     * @returns {ApiTransfer}
     */
    toApi(systemUserId) {
        return {
            id:          this.id,
            eventId:     this.event,
            eventName:   this.Event?.name,
            senderId:    systemUserId === this.sender ? -1 : this.sender,
            recipientId: systemUserId === this.recipient ? -1 : this.recipient,
            currency:    Constants.CURRENCY_NAMES[this.currency],
            amount:      this.amount,
        };
    }

    toSnapshot(systemUserId) {
        return {
            sender:    systemUserId === this.sender ? -1 : this.sender,
            recipient: systemUserId === this.recipient ? -1 : this.recipient,
            currency:  this.currency,
            amount:    this.amount,
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
 * @property {User} [User]
 * @property {number} event
 * @property {Event} [Event]
 * @property {number} type
 * @property {number} pointsCredited
 * @property {number} moneyCredited
 * @property {number} moneyFactor
 */
class Participation extends Model {
    /**
     * Map an event participation to an object suitable to return over the API
     *
     * @returns {ApiParticipation}
     */
    toApi() {
        return {
            userId:  this.user,
            eventId: this.event,
            type:    Constants.PARTICIPATION_TYPE_NAMES[this.type],
            credits: {
                points: this.pointsCredited,
                money:  this.moneyCredited,
            },
            factors: {
                money: this.moneyFactor,
            },
        };
    }

    toSnapshot() {
        return {
            type:    this.type,
            credits: {
                points: this.pointsCredited,
                money:  this.moneyCredited,
            },
            factors: {
                money: this.moneyFactor,
            },
        };
    }
}

/**
 * @property {Date} date
 * @property {number} user
 * @property {User} [User]
 * @property {number} contraUser
 * @property {User} [ContraUser]
 * @property {number} currency
 * @property {number} amount
 * @property {number} balance
 * @property {number} event
 * @property {Event} [Event]
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
            eventName:    this.Event?.name,
            currency:     Constants.CURRENCY_NAMES[this.currency],
            amount:       this.amount,
            balance:      this.balance,
        };
    }
}

/**
 * @property {number} user
 * @property {User} [User]
 * @property {Date|null} start
 * @property {Date|null} end
 */
class Absence extends Model {
    /**
     * @returns {ApiAbsence}
     */
    toApi() {
        return {
            id:     this.id,
            userId: this.user.id,
            start:  this.start,
            end:    this.end,
        };
    }

    toSnapshot() {
        return {
            user:  this.user,
            start: this.start,
            end:   this.end,
        };
    }
}

/**
 * @property {Date} date
 * @property {number|null} actingUser
 * @property {User|null} [ActingUser]
 * @property {string} type
 * @property {number|null} event
 * @property {Event|null} Event
 * @property {number|null} affectedUser
 * @property {User|null} AffectedUser
 * @property {object|null} values
 */
class Audit extends Model {
    /**
     * Map an audit to an object suitable to return over the API
     *
     * @returns {ApiAudit}
     */
    toApi() {
        return {
            id:               this.id,
            date:             this.date,
            type:             this.type,
            actingUserId:     this.actingUser,
            actingUserName:   this.getActingUserName(),
            eventId:          this.event,
            eventName:        this.getEventName(),
            eventDate:        this.Event?.date,
            affectedUserId:   this.affectedUser,
            affectedUserName: this.getAffectedUserName(),
            values:           this.values,
        };
    }

    getActingUserName() {
        if (this.ActingUser) {
            return this.ActingUser.name;
        } else if (this.ActingUser === null && this.actingUser !== null) {
            return 'Deleted user';
        }
        return null;
    }

    getEventName() {
        if (this.Event) {
            return this.Event.name;
        } else if (this.Event === null && this.event !== null) {
            return 'Deleted event';
        }
        return null;
    }

    getAffectedUserName() {
        if (this.AffectedUser) {
            return this.AffectedUser.name;
        } else if (this.AffectedUser === null && this.affectedUser !== null) {
            return 'Deleted user';
        }
        return null;
    }
}

class Grocery extends Model {
    /**
     * @returns {ApiGrocery}
     */
    toApi() {
        return {
            id:      this.id,
            label:   this.label,
            checked: this.checked,
        };
    }

    toSnapshot() {
        return {
            label:   this.label,
            checked: this.checked,
        };
    }
}

exports.Configuration = Configuration;
exports.User = User;
exports.EventType = EventType;
exports.Event = Event;
exports.Lunch = Lunch;
exports.ParticipationType = ParticipationType;
exports.Participation = Participation;
exports.Transaction = Transaction;
exports.Transfer = Transfer;
exports.Absence = Absence;
exports.Audit = Audit;
exports.Grocery = Grocery;

/**
 * @param {Sequelize} sequelize
 */
exports.initModels = function initModels(sequelize) {
    let ch = new ColumnHelper(sequelize);

    // Default cascading options
    let cascade = {
        onDelete: 'restrict',
        onUpdate: 'restrict',
    };

    Configuration.init({
        name:  {type: ch.ascii(32), allowNull: false, unique: 'configuration_name_idx'},
        value: {type: DataTypes.STRING(255), allowNull: false},
    }, {
        sequelize,
        modelName: 'configuration',
    });

    User.init({
        username:           {type: ch.ascii(64), allowNull: false, unique: 'user_username_idx'},
        password:           {type: ch.ascii(255), allowNull: true},
        lastPasswordChange: {type: DataTypes.DATE, allowNull: true},
        name:               {type: DataTypes.STRING(64), allowNull: false},
        active:             {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        hidden:             {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        points:             {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        money:              {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        settings:           {type: DataTypes.JSON, allowNull: true},
        // Note: Couldn't manage to set default on 'settings'
    }, {
        sequelize,
        modelName: 'user',
    });

    EventType.init({
        id: {type: DataTypes.TINYINT, allowNull: false, primaryKey: true, autoIncrement: true},
        // API names should eventually be moved into this table
    }, {
        sequelize,
        modelName: 'eventType',
    });

    Event.init({
        type: {type: DataTypes.TINYINT, allowNull: false},
        date: {type: DataTypes.DATE, allowNull: false},
        name: {type: DataTypes.STRING(255), allowNull: false},
    }, {
        sequelize,
        modelName: 'event',
        indexes:   [{
            name:   'event_type_idx',
            fields: ['type'],
        }],
    });
    Event.belongsTo(EventType, {foreignKey: {name: 'type'}, as: 'EventType', ...cascade});

    Lunch.init({
        event:      {type: DataTypes.INTEGER, allowNull: false, unique: 'lunch_event_idx'},
        pointsCost: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},

        // Note: moneyCost is purely informational and won't affect calculations!  The moneyCredited field
        // of participations is what will actually be used for calculations.
        moneyCost:             {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        vegetarianMoneyFactor: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1},
        comment:               {type: DataTypes.TEXT, allowNull: true},
    }, {
        sequelize,
        modelName: 'lunch',
    });
    Lunch.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Event.hasOne(Lunch, {foreignKey: {name: 'event'}, as: 'Lunch', ...cascade});

    Transfer.init({
        event:     {type: DataTypes.INTEGER, allowNull: false},
        sender:    {type: DataTypes.INTEGER, allowNull: false},
        recipient: {type: DataTypes.INTEGER, allowNull: false},
        amount:    {type: DataTypes.DOUBLE, allowNull: false},
        currency:  {type: DataTypes.TINYINT, allowNull: false},
    }, {
        sequelize,
        modelName: 'transfer',
        indexes:   [{
            name:   'transfer_event_idx',
            fields: ['event'],
        }, {
            name:   'transfer_sender_idx',
            fields: ['sender'],
        }, {
            name:   'transfer_recipient_idx',
            fields: ['recipient'],
        }],
    });
    Transfer.belongsTo(User, {foreignKey: {name: 'sender'}, as: 'Sender', ...cascade});
    Transfer.belongsTo(User, {foreignKey: {name: 'recipient'}, as: 'Recipient', ...cascade});
    Transfer.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Event.hasMany(Transfer, {foreignKey: {name: 'event'}, as: 'Transfers', ...cascade});

    ParticipationType.init({
        label: {type: DataTypes.STRING(64), allowNull: false},
    }, {sequelize, modelName: 'participationType'});

    Participation.init({
        event:          {type: DataTypes.INTEGER, allowNull: false},
        user:           {type: DataTypes.INTEGER, allowNull: false},
        type:           {type: DataTypes.INTEGER, allowNull: false},
        pointsCredited: {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        moneyCredited:  {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0.0},
        moneyFactor:    {type: DataTypes.DOUBLE, allowNull: false, defaultValue: 1.0},
    }, {
        sequelize,
        modelName: 'participation',
        indexes:   [{
            name:   'participation_userEvent_idx',
            fields: ['user', 'event'],
            unique: true,
        }, {
            name:   'participation_event_idx',
            fields: ['event'],
        }, {
            name:   'participation_type_idx',
            fields: ['type'],
        }],
    });
    Participation.belongsTo(ParticipationType, {foreignKey: {name: 'type'}, as: 'ParticipationType', ...cascade});
    Participation.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});
    Participation.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Event.hasMany(Participation, {foreignKey: {name: 'event'}, as: 'Participations', ...cascade});

    Transaction.init({
        date:       {type: DataTypes.DATE, allowNull: false},
        user:       {type: DataTypes.INTEGER, allowNull: false},
        contraUser: {type: DataTypes.INTEGER, allowNull: false},
        event:      {type: DataTypes.INTEGER, allowNull: false},
        currency:   {type: DataTypes.TINYINT, allowNull: false},
        amount:     {type: DataTypes.DOUBLE, allowNull: false},
        balance:    {type: DataTypes.DOUBLE, allowNull: false},
    }, {
        sequelize,
        modelName: 'transaction',
        indexes:   [{
            name:   'transaction_user_idx',
            fields: ['user'],
        }, {
            name:   'transaction_contraUser_idx',
            fields: ['contraUser'],
        }, {
            name:   'transaction_event_idx',
            fields: ['event'],
        }, {
            name:   'transaction_dateId_idx',
            fields: ['date', 'id'],
        }],
    });
    Transaction.belongsTo(Event, {foreignKey: {name: 'event'}, as: 'Event', ...cascade});
    Transaction.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});
    Transaction.belongsTo(User, {foreignKey: {name: 'contraUser'}, as: 'ContraUser', ...cascade});

    Absence.init({
        user:  {type: DataTypes.INTEGER, allowNull: false},
        start: {type: DataTypes.DATEONLY, allowNull: true},
        end:   {type: DataTypes.DATEONLY, allowNull: true},
    }, {
        sequelize,
        modelName: 'absence',
        indexes:   [{
            name:   'absence_user_idx',
            fields: ['user'],
        }],
    });
    Absence.belongsTo(User, {foreignKey: {name: 'user'}, as: 'User', ...cascade});

    Audit.init({
        date:         {type: DataTypes.DATE, allowNull: false},
        type:         {type: ch.ascii(32), allowNull: false},
        actingUser:   {type: DataTypes.INTEGER, allowNull: false},
        event:        {type: DataTypes.INTEGER, allowNull: true},
        affectedUser: {type: DataTypes.INTEGER, allowNull: true},
        values:       {type: DataTypes.JSON, allowNull: true},
    }, {
        sequelize,
        modelName: 'audit',
        indexes:   [{
            name:   'audit_actingUser_idx',
            fields: ['actingUser'],
        }, {
            name:   'audit_event_idx',
            fields: ['event'],
        }, {
            name:   'audit_affectedUser_idx',
            fields: ['affectedUser'],
        }],
    });
    // These do not enforce the FK constraint on purpose, to allow deleting objects but keeping the audits for it
    Audit.belongsTo(User, {foreignKey: {name: 'actingUser'}, constraints: false, as: 'ActingUser'});
    Audit.belongsTo(Event, {foreignKey: {name: 'event'}, constraints: false, as: 'Event'});
    Audit.belongsTo(User, {foreignKey: {name: 'affectedUser'}, constraints: false, as: 'AffectedUser'});

    Grocery.init({
        label:   {type: DataTypes.STRING(255), allowNull: false},
        checked: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        order:   {type: DataTypes.INTEGER, allowNull: false},
    }, {
        sequelize,
        modelName: 'grocery',
        indexes:   [{
            name:   'checked_order_idx',
            fields: ['checked', 'order'],
        }],
    });
};
